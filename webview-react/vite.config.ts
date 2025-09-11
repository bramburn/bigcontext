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
      output: {
        // Ensure consistent naming for webview asset loading
        entryFileNames: 'app.js',
        chunkFileNames: 'chunk-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'app.css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    target: ['es2020', 'chrome87', 'safari14', 'firefox78', 'edge88'],
    cssCodeSplit: false, // Inline CSS for faster loading in webview
    sourcemap: process.env.NODE_ENV === 'development', // Enable sourcemaps in dev
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000, // Increase warning limit for webview context
    assetsInlineLimit: 8192 // Inline more assets for webview compatibility
  },
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,
    // Ensure CSS is properly processed for webview
    preprocessorOptions: {
      css: {
        charset: false // Prevent charset issues in webview
      }
    }
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
