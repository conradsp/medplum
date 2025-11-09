import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    // Allow requests from any host (including hopeemr.com)
    allowedHosts: ['hopeemr.com', 'www.hopeemr.com', 'localhost'],
    // Alternatively, allow all hosts:
    // allowedHosts: 'all',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

