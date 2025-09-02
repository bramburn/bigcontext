import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
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
    target: ['es2020', 'chrome87', 'safari14', 'firefox78', 'edge88'],
    cssCodeSplit: false, // Inline CSS for faster loading
    sourcemap: false, // Disable sourcemaps for production
    reportCompressedSize: false // Faster builds
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts']
  }
});
