// All imports at the top (ES Module requirement)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

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

// --- Simple in-memory statistics ---
const stats = {
  startedAt: new Date().toISOString(),
  totalVisitors: 0,
  uniqueIPs: new Set(),
  totalQuestions: 0,
  todayQuestions: 0,
  todayDate: new Date().toISOString().slice(0, 10),
};

const resetDayIfNeeded = () => {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== stats.todayDate) {
    stats.todayDate = today;
    stats.todayQuestions = 0;
  }
};

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
        resetDayIfNeeded();
        stats.totalQuestions++;
        stats.todayQuestions++;
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
app.get('/api/stats', (req, res) => {
  resetDayIfNeeded();
  res.json({
    startedAt: stats.startedAt,
    totalVisitors: stats.totalVisitors,
    uniqueVisitors: stats.uniqueIPs.size,
    totalQuestions: stats.totalQuestions,
    todayQuestions: stats.todayQuestions,
    todayDate: stats.todayDate,
    uptime: Math.round(process.uptime()) + 's'
  });
});

// --- Visitor counter middleware (before static files) ---
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') {
    stats.totalVisitors++;
    const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    stats.uniqueIPs.add(ip);
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
