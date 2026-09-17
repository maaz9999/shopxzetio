import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-and-mime-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Vite otherwise resolves /admin to the legacy admin.html file before
          // React Router sees it. All application routes must use index.html.
          if (req.url && /^\/admin(?:\/login)?\/?(?:\?.*)?$/.test(req.url)) {
            req.url = '/index.html';
          }
          if (req.url && (req.url.endsWith('.js') || req.url.includes('.js?') || req.url.endsWith('.jsx') || req.url.includes('.jsx?'))) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
          next();
        });
      }
    }
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    open: false,
    host: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
