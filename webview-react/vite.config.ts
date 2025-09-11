import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    //   },
    //   devOptions: {
    //     enabled: false
    //   }
    // })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    rollupOptions: {
      external: ['vscode'], // Exclude VS Code API from bundle
    },
    target: ['es2020', 'chrome87', 'safari14', 'firefox78', 'edge88'],
    cssCodeSplit: false, // Inline CSS for faster loading
    sourcemap: false, // Disable sourcemaps for production
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000, // Increase warning limit for webview context
    assetsInlineLimit: 4096 // Inline small assets
  },
  esbuild: {
    drop: ['debugger'],
    legalComments: 'none',
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
});
