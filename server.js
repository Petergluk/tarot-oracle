// All imports at the top (ES Module requirement)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// API keys are read ONLY from server-side environment variables
// They are NEVER exposed to the frontend bundle
const API_KEYS = (process.env.GEMINI_API_KEYS || process.env.VITE_API_KEYS || process.env.API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(k => k.length > 5);

let currentKeyIndex = 0;

// --- Database & Statistics Setup ---
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required by Render DB
  });
  console.log('[Proxy] PostgreSQL DB configured. Using persistent stats.');
} else {
  console.log('[Proxy] No DATABASE_URL found. Falling back to in-memory stats.');
}

// In-memory fallback
const inMemoryStats = {
  startedAt: new Date().toISOString(),
  totalVisitors: 0,
  totalQuestions: 0,
  todayQuestions: 0,
  todayDate: new Date().toISOString().slice(0, 10),
};

const initDB = async () => {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stats (
          id VARCHAR(50) PRIMARY KEY,
          total_visitors INT DEFAULT 0,
          total_questions INT DEFAULT 0,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_daily (
          date DATE PRIMARY KEY,
          unique_visitors INT DEFAULT 0,
          total_questions INT DEFAULT 0
      );
    `);

    // Ensure global stats row exists
    const res = await pool.query("SELECT * FROM stats WHERE id = 'global'");
    if (res.rowCount === 0) {
      await pool.query("INSERT INTO stats (id) VALUES ('global')");
    }
    console.log('[Proxy] Database initialized successfully.');
  } catch (err) {
    console.error('[Proxy] Failed to initialize DB:', err);
    pool = null; // fallback to memory on error
  }
};

const recordEvent = async (type) => {
  const today = new Date().toISOString().slice(0, 10);

  if (!pool) {
    // In-memory fallback logic
    if (today !== inMemoryStats.todayDate) {
      inMemoryStats.todayDate = today;
      inMemoryStats.todayQuestions = 0;
    }
    if (type === 'visitor') inMemoryStats.totalVisitors++;
    if (type === 'question') {
      inMemoryStats.totalQuestions++;
      inMemoryStats.todayQuestions++;
    }
    return;
  }

  // PostgreSQL logic
  try {
    if (type === 'visitor') {
      await pool.query("UPDATE stats SET total_visitors = total_visitors + 1 WHERE id = 'global'");
      await pool.query(`
        INSERT INTO analytics_daily (date, unique_visitors) VALUES ($1, 1)
        ON CONFLICT (date) DO UPDATE SET unique_visitors = analytics_daily.unique_visitors + 1
      `, [today]);
    } else if (type === 'question') {
      await pool.query("UPDATE stats SET total_questions = total_questions + 1 WHERE id = 'global'");
      await pool.query(`
        INSERT INTO analytics_daily (date, total_questions) VALUES ($1, 1)
        ON CONFLICT (date) DO UPDATE SET total_questions = analytics_daily.total_questions + 1
      `, [today]);
    }
  } catch (e) {
    console.error(`[Proxy] Failed to record ${type}:`, e);
  }
};

// Initialize DB on start
initDB();

console.log(`[Proxy] Server starting. API keys available: ${API_KEYS.length}`);

// Proxy for Google Generative AI API
// The frontend sends requests to /google-api/..., this proxy forwards them to Google
// and injects the real server-side API key, hiding it from the browser.
app.use('/google-api', createProxyMiddleware({
  target: 'https://generativelanguage.googleapis.com',
  changeOrigin: true,
  // Remove the /google-api prefix and strip any ?key= from URL (browser shouldn't send real keys anyway)
  pathRewrite: (reqPath) => {
    return reqPath
      .replace(/^\/google-api/, '')
      .replace(/([?&])key=[^&]+(&|$)/, '$1')
      .replace(/&$/, '')
      .replace(/\?$/, '');
  },
  onProxyReq: (proxyReq, req) => {
    // Strip client IP for anonymity
    proxyReq.removeHeader('x-forwarded-for');
    proxyReq.removeHeader('x-forwarded-host');
    proxyReq.removeHeader('x-real-ip');

    // Inject server-side API key via header (preferred method, no key in URL)
    if (API_KEYS.length > 0) {
      const key = API_KEYS[currentKeyIndex % API_KEYS.length];
      proxyReq.setHeader('x-goog-api-key', key);
      currentKeyIndex++;

      // Track question stats (generateContent = a real question)
      if (req.url.includes('generateContent')) {
        recordEvent('question').catch(console.error);
      }

      console.log(`[Proxy] Forwarding request using key index ${(currentKeyIndex - 1) % API_KEYS.length}`);
    } else {
      console.error('[Proxy] WARNING: No API keys configured! Set GEMINI_API_KEYS env variable on Render.');
    }
  },
  onError: (err, req, res) => {
    console.error('[Proxy] Error:', err.message);
    res.status(502).json({ error: { message: 'Proxy connection to Google API failed', details: err.message } });
  }
}));

// --- Stats endpoint ---
app.get('/api/stats', async (req, res) => {
  if (!pool) {
    // Return in-memory stats
    const today = new Date().toISOString().slice(0, 10);
    if (today !== inMemoryStats.todayDate) {
      inMemoryStats.todayDate = today;
      inMemoryStats.todayQuestions = 0;
    }
    return res.json({
      ...inMemoryStats,
      uptime: Math.round(process.uptime()) + 's',
      db: false
    });
  }

  try {
    const globalRes = await pool.query("SELECT * FROM stats WHERE id = 'global'");
    const today = new Date().toISOString().slice(0, 10);
    const dailyRes = await pool.query("SELECT * FROM analytics_daily WHERE date = $1", [today]);

    const globalStats = globalRes.rows[0] || { total_visitors: 0, total_questions: 0, started_at: new Date() };
    const dailyStats = dailyRes.rows[0] || { unique_visitors: 0, total_questions: 0 };

    res.json({
      startedAt: globalStats.started_at,
      totalVisitors: globalStats.total_visitors,
      uniqueVisitors: dailyStats.unique_visitors,
      totalQuestions: globalStats.total_questions,
      todayQuestions: dailyStats.total_questions,
      todayDate: today,
      uptime: Math.round(process.uptime()) + 's',
      db: true
    });
  } catch (e) {
    console.error('Failed to fetch stats:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Visitor counter middleware (before static files) ---
let knownIPs = new Set(); // Reset on restart, but prevents duplicate counts in one session
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    if (!knownIPs.has(ip)) {
      knownIPs.add(ip);
      recordEvent('visitor').catch(console.error);
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/cards/')) {
    return res.status(404).send('Card not found');
  }
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(distIndex, (err) => {
    if (err) {
      const publicIndex = path.join(__dirname, 'public', 'index.html');
      res.sendFile(publicIndex);
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Proxy] Server running on port ${PORT}. Proxy active with ${API_KEYS.length} API key(s).`);
});
