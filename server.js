
import express from 'express';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Получаем ключи из переменных окружения сервера
const API_KEYS = (process.env.VITE_API_KEYS || process.env.API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;

import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

// Прокси для Google API через надежный http-proxy-middleware
app.use('/google-api', createProxyMiddleware({
  target: 'https://generativelanguage.googleapis.com',
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // Убираем возможный фейковый ключ клиента из URL
    const cleanPath = path.replace(/^\/google-api/, '').replace(/([?&])key=[^&]+(&|$)/, '$1').replace(/&$/, '').replace(/\?$/, '');

    if (API_KEYS.length > 0) {
      const url = new URL(cleanPath, 'https://generativelanguage.googleapis.com');
      url.searchParams.set('key', API_KEYS[currentKeyIndex]);
      return url.pathname + url.search;
    }
    return cleanPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    // Скрываем реальный IP-адрес клиента для безопасности
    proxyReq.removeHeader('x-forwarded-for');
    proxyReq.removeHeader('x-forwarded-host');

    if (API_KEYS.length > 0) {
      proxyReq.setHeader('x-goog-api-key', API_KEYS[currentKeyIndex]);
    } else if (req.headers['x-goog-api-key']) {
      proxyReq.setHeader('x-goog-api-key', req.headers['x-goog-api-key']);
    }

    // Если express.json используется глобально, чиним тело запроса
    if (req.body && Object.keys(req.body).length > 0) {
      fixRequestBody(proxyReq, req);
    }
  },
  onError: (err, req, res) => {
    console.error('[HPM Error]', err);
    res.status(500).json({ error: { message: 'Ошибка связи с серверами Google через прокси' } });
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
  console.log(`Server running on port ${PORT}. AI Proxy active.`);
});
