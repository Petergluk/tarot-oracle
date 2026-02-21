
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

// Прокси для Google API (Нативная реализация для обхода проблем с потоками на Render)
app.use('/google-api', express.json({ limit: '10mb' }), (req, res) => {
  const targetHost = 'generativelanguage.googleapis.com';

  // Убираем возможный фейковый ключ клиента из URL
  const urlPath = req.url.replace(/([?&])key=[^&]+(&|$)/, '$1').replace(/&$/, '').replace(/\?$/, '');

  const options = {
    hostname: targetHost,
    port: 443,
    path: urlPath,
    method: req.method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (API_KEYS.length > 0) {
    options.headers['x-goog-api-key'] = API_KEYS[currentKeyIndex];
  } else if (req.headers['x-goog-api-key']) {
    options.headers['x-goog-api-key'] = req.headers['x-goog-api-key'];
  }

  let bodyStr;
  if (req.body && Object.keys(req.body).length > 0) {
    bodyStr = JSON.stringify(req.body);
    options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
  }

  const proxyReq = https.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);

    ['content-type', 'content-encoding'].forEach(header => {
      if (proxyRes.headers[header]) {
        res.setHeader(header, proxyRes.headers[header]);
      }
    });

    if (proxyRes.statusCode !== 200) {
      console.error(`[Manual Proxy] Error Code: ${proxyRes.statusCode} on path ${urlPath}`);
    }

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[Manual Proxy] Network Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: { message: 'Ошибка связи с серверами Google' } });
    }
  });

  if (bodyStr) {
    proxyReq.write(bodyStr);
  }

  proxyReq.end();
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
  console.log(`Server running on port ${PORT}. AI Proxy active.`);
});
