import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Proxy configuration for Google API
app.use(
  '/google-api',
  createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    pathRewrite: {
      '^/google-api': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      // console.log(`Proxying ${req.method} request to: ${proxyReq.path}`);
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(500).send('Proxy Error');
    }
  })
);

// 1. Serve static files from 'public' directory FIRST
// This allows you to see new images immediately without running 'npm run build'
// We use fallthrough: true (default) to allow next middleware to handle if not found
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path, stat) => {
    // console.log(`Serving from public: ${path}`);
  }
}));

// 2. Serve static files from the 'dist' directory (built by Vite)
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, path, stat) => {
    // console.log(`Serving from dist: ${path}`);
  }
}));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  // Check if request is for a card image that wasn't found in static middleware
  if (req.path.startsWith('/cards/')) {
    console.error(`404 Image Not Found: ${req.path}`);
    return res.status(404).send('Image not found');
  }

  // Try dist first, then public (though usually index.html is in dist after build)
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(distIndex, (err) => {
    if (err) {
       // Fallback for dev mode if dist doesn't exist yet
       const publicIndex = path.join(__dirname, 'public', 'index.html');
       res.sendFile(publicIndex, (err) => {
         if (err) {
           console.error(`404 Not Found: ${req.path}`);
           res.status(404).send('Not Found');
         }
       });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'public')} and ${path.join(__dirname, 'dist')}`);
});