# Implementation Guide: Sprint 2 - Performance Optimization & Caching

This guide provides technical details for optimizing webview load times with a service worker and implementing graceful degradation for poor network conditions.

---

### **Part 1: Caching with a Service Worker**

The goal is to cache static assets (JS, CSS, images) to speed up subsequent webview loads.

**Relevant Files:**
*   `webview-react/vite.config.ts` (Build Config)
*   `webview-react/public/sw.js` (New Service Worker)
*   `webview-react/src/main.tsx` (Registration)

**1.1. Vite Configuration (`vite.config.ts`)**

*   **Concept**: We will use a Vite plugin to simplify service worker generation and management. `vite-plugin-pwa` is a great choice.
*   **Web Search**: "vite-plugin-pwa for react". This will provide documentation on configuration options.
*   **Action**: Install the plugin (`npm install vite-plugin-pwa -D`) and add it to your `vite.config.ts`.
*   **Implementation Sketch**:
    ```typescript
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import { VitePWA } from 'vite-plugin-pwa';

    export default defineConfig({
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                workbox: {
                    // Caches JS, CSS, and other assets
                    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
                },
                // The manifest is useful for PWAs but optional here
                manifest: {
                    name: 'Code Context Webview',
                    short_name: 'CodeContext',
                    description: 'Webview for Code Context Engine',
                    theme_color: '#ffffff',
                }
            })
        ]
    });
    ```
    *The plugin will automatically generate a service worker, handle registration, and implement a cache-busting strategy.*

**1.2. Manual Service Worker (Alternative)**

If you prefer not to use a plugin:
1.  **Create `webview-react/public/sw.js`**:
    *   **Web Search**: "service worker cache static assets" and "service worker cache busting".
    *   Implement `install`, `activate`, and `fetch` event listeners. In the `install` event, cache your assets. In the `fetch` event, serve assets from the cache if available. The `activate` event is used to clean up old caches.
2.  **Register in `webview-react/src/main.tsx`**:
    ```typescript
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('SW registered: ', registration);
            }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }
    ```

---

### **Part 2: Graceful Degradation**

This involves detecting network quality and queueing actions when offline.

**Relevant Files:**
*   `shared/connectionMonitor.js` (Core Logic)
*   `webview-react/src/App.tsx` (State Management)

**2.1. Network Quality Detection (`shared/connectionMonitor.js`)**

*   **Concept**: Use the `navigator.connection` API to get information about the user's network. Fall back to latency-based detection if the API is not available.
*   **Web Search**: "javascript navigator.connection API". Note that browser support varies.
*   **Implementation Sketch**:
    ```javascript
    // In ConnectionMonitor
    checkNetworkQuality() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            const quality = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
            this.emit('qualityChange', quality.includes('2g') ? 'poor' : 'good');
        } else if (this.metrics.latency > 400) { // Fallback to latency
            this.emit('qualityChange', 'poor');
        } else {
            this.emit('qualityChange', 'good');
        }
    }
    // Call this periodically or after each heartbeat response.
    ```

**2.2. Offline Action Queueing (`shared/connectionMonitor.js`)**

*   **Concept**: Create a wrapper around `vscodeApi.postMessage`. If disconnected, push the message to an array. When reconnected, drain the array.
*   **Implementation Sketch**:
    ```javascript
    // In ConnectionMonitor
    constructor() {
        this.messageQueue = [];
        // ...
    }

    postMessage(message) {
        if (this.status === 'connected') {
            this.vscodeApi.postMessage(message);
        } else {
            this.messageQueue.push(message);
        }
    }

    handleReconnect() {
        this.status = 'connected';
        this.emit('statusChange', this.status);
        // Drain the queue
        while(this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.vscodeApi.postMessage(message);
        }
    }
    ```
    *Your application code should now use `connectionMonitor.postMessage(message)` instead of calling `vscodeApi.postMessage` directly.*
