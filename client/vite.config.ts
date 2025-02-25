import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: 'buffer/',  // Ensure Vite knows where to find `buffer`
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env': {}, // Provide a fallback for `process.env`
  }
});
