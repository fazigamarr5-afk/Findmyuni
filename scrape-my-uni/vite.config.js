import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',
  },
  // Dev proxy: same-origin /api/* → local FastAPI backend.
  // Production uses Vercel's catch-all rewrite (see vercel.json); services
  // fall back to Supabase when the API is unreachable.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
