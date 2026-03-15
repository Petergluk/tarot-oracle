
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devKeys = (env.GEMINI_API_KEYS || env.VITE_API_KEYS || env.VITE_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 5);
  const nvidiaApiKey = (env.NVIDIA_API_KEY || '').trim();

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Эмуляция серверного прокси при локальной разработке
        '/google-api': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/google-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (devKeys.length > 0) {
                proxyReq.setHeader('x-goog-api-key', devKeys[0]);
              }
            });
          },
        },
        '/nvidia-api': {
          target: 'https://integrate.api.nvidia.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nvidia-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (nvidiaApiKey.length > 0) {
                proxyReq.setHeader('authorization', `Bearer ${nvidiaApiKey}`);
              }
            });
          },
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-ai': ['@google/genai'],
            'vendor-utils': ['react-markdown'],
          },
        },
      },
    },
  };
});
