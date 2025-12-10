
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (optional, usually not needed for simple proxying but good practice)
app.use(express.json());

// Proxy configuration
// Forward requests from /google-api to Google's Generative Language API
// This hides the client's IP address from Google
app.use(
  '/google-api',
  createProxyMiddleware({
    target: 'https://generativelanguage.googleapis.com',
    changeOrigin: true,
    pathRewrite: {
      '^/google-api': '', // Remove /google-api prefix when forwarding
    },
    onProxyReq: (proxyReq, req, res) => {
      // Optional: Log proxy requests for debugging
      // console.log(`Proxying ${req.method} request to: ${proxyReq.path}`);
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(500).send('Proxy Error');
    }
  })
);

// Serve static files from the 'dist' directory (built by Vite)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for Single Page Application (SPA) routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
