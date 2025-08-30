import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'app.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'app.css';
          }
          return 'assets/[name][extname]';
        },
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    },
    target: ['es2020', 'chrome87', 'safari14', 'firefox78', 'edge88']
  }
});
