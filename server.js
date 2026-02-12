
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Получаем ключи из переменных окружения сервера
const API_KEYS = (process.env.VITE_API_KEYS || process.env.API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;

app.use(express.json());

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


const countFilesRecursive = (dirPath) => {
  if (!fs.existsSync(dirPath)) return 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries.reduce((count, entry) => {
    const currentPath = path.join(dirPath, entry.name);
    return count + (entry.isDirectory() ? countFilesRecursive(currentPath) : 1);
  }, 0);
};

app.get('/debug/cards-status', (req, res) => {
  const publicCardsPath = path.join(__dirname, 'public', 'cards');
  const distCardsPath = path.join(__dirname, 'dist', 'cards');
  const distAssetsPath = path.join(__dirname, 'dist', 'assets');

  const distImageCount = fs.existsSync(distAssetsPath)
    ? fs.readdirSync(distAssetsPath).filter((fileName) => /\.(jpg|jpeg|png|webp)$/i.test(fileName)).length
    : 0;

  res.json({
    runtime: 'node-express',
    publicCardsExists: fs.existsSync(publicCardsPath),
    distCardsExists: fs.existsSync(distCardsPath),
    distAssetsExists: fs.existsSync(distAssetsPath),
    publicCardsCount: countFilesRecursive(publicCardsPath),
    distCardsCount: countFilesRecursive(distCardsPath),
    distImageAssetsCount: distImageCount,
    examplePublicCardUrl: '/cards/major/01_the_fool.jpg',
  });
});


app.use('/cards', (req, res, next) => {
  const normalizedPath = req.path.replace(/^\/+/, '');
  const publicFilePath = path.join(__dirname, 'public', 'cards', normalizedPath);
  const distFilePath = path.join(__dirname, 'dist', 'cards', normalizedPath);

  console.info('[cards request]', {
    method: req.method,
    url: req.originalUrl,
    publicExists: fs.existsSync(publicFilePath),
    distExists: fs.existsSync(distFilePath),
    referer: req.get('referer') || null,
  });

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
  console.log(`Server running on port ${PORT}. AI Proxy active.`);
});
