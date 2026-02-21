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
  on: {
    proxyReq: (proxyReq, req) => {
      // Strip client IP for anonymity
      proxyReq.removeHeader('x-forwarded-for');
      proxyReq.removeHeader('x-forwarded-host');
      proxyReq.removeHeader('x-real-ip');

      // Inject server-side API key via header (preferred method, no key in URL)
      if (API_KEYS.length > 0) {
        const key = API_KEYS[currentKeyIndex % API_KEYS.length];
        proxyReq.setHeader('x-goog-api-key', key);
        currentKeyIndex++;
        console.log(`[Proxy] Forwarding request using key index ${(currentKeyIndex - 1) % API_KEYS.length}`);
      } else {
        console.error('[Proxy] WARNING: No API keys configured! Set GEMINI_API_KEYS env variable on Render.');
      }
    },
    error: (err, req, res) => {
      console.error('[Proxy] Error:', err.message);
      res.status(502).json({ error: { message: 'Proxy connection to Google API failed', details: err.message } });
    }
  }
}));

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
