
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Получаем ключи из переменных окружения сервера
const API_KEYS = (process.env.VITE_API_KEYS || process.env.API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;

// Прокси для Google API
// Это позволяет делать запросы от имени сервера (из США/Европы), обходя блокировки
app.use(
  '/google-api',
  createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    pathRewrite: {
      '^/google-api': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      // Скрываем реальный IP-адрес клиента для безопасности и обхода региональных блокировок
      proxyReq.removeHeader('x-forwarded-for');
      proxyReq.removeHeader('x-forwarded-host');

      // Если на сервере есть ключи, подставляем один из них
      if (API_KEYS.length > 0) {
        const key = API_KEYS[currentKeyIndex];
        const url = new URL(proxyReq.path, 'https://generativelanguage.googleapis.com');
        url.searchParams.set('key', key);
        proxyReq.path = url.pathname + url.search;
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(500).send('Ошибка связи с Оракулом через сервер');
    }
  })
);

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
