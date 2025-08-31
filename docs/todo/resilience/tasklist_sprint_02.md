# Task List: Sprint 2 - Performance Optimization & Caching

**Goal:** To optimize webview performance through resource caching and to build a more resilient UI that can handle poor network conditions gracefully.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Install Vite PWA Plugin:** Add the `vite-plugin-pwa` developer dependency to the React webview project. | `webview-react/package.json` |
| **2.2** | ☐ To Do | **Configure Vite for PWA:** In `vite.config.ts`, import and add the `VitePWA` plugin. Configure it to auto-update and cache common static assets (`.js`, `.css`, `.html`, etc.). | `webview-react/vite.config.ts` |
| **2.3** | ☐ To Do | **Verify Service Worker Registration:** Run a production build (`npm run build`) of the webview. Launch the extension and use browser dev tools to confirm the service worker is registered and active. | `(Manual Test)` |
| **2.4** | ☐ To Do | **Verify Asset Caching:** On the first load, check the "Network" tab to see assets being fetched. On subsequent loads, confirm the same assets are being served from the "Service Worker" or "disk cache". | `(Manual Test)` |
| **2.5** | ☐ To Do | **Implement Network Quality Detection:** In `shared/connectionMonitor.js`, add a method `checkNetworkQuality` that uses `navigator.connection.effectiveType` to determine network speed. | `shared/connectionMonitor.js` |
| **2.6** | ☐ To Do | **Add Latency-Based Fallback:** In `checkNetworkQuality`, add a fallback that checks the last measured heartbeat latency if `navigator.connection` is not available. | `shared/connectionMonitor.js` |
| **2.7** | ☐ To Do | **Emit `qualityChange` Event:** The `checkNetworkQuality` method should emit a `qualityChange` event with a payload of 'good' or 'poor'. Call this method after each successful heartbeat response. | `shared/connectionMonitor.js` |
| **2.8** | ☐ To Do | **Create Offline Message Queue:** In `shared/connectionMonitor.js`, add a `messageQueue` array. | `shared/connectionMonitor.js` |
| **2.9** | ☐ To Do | **Create `postMessage` Wrapper:** Create a new `postMessage` method in the `ConnectionMonitor`. If the status is 'connected', it sends the message immediately. Otherwise, it pushes the message to the `messageQueue`. | `shared/connectionMonitor.js` |
| **2.10**| ☐ To Do | **Refactor App to Use Wrapper:** Search the `webview-react` codebase for all instances of `vscodeApi.postMessage` and refactor them to use the new `connectionMonitor.postMessage` wrapper. | `webview-react/src/**/*.tsx` |
| **2.11**| ☐ To Do | **Implement Queue Draining:** In the `handleReconnect` method of `connectionMonitor.js`, add logic to iterate over the `messageQueue` and send all stored messages. | `shared/connectionMonitor.js` |
| **2.12**| ☐ To Do | **Enhance `ConnectionStatus` UI:** In `webview-react/src/components/ConnectionStatus.tsx`, add a subscription to the `qualityChange` event. Display a "Poor Connection" message when the quality is 'poor'. | `webview-react/src/components/ConnectionStatus.tsx` |
| **2.13**| ☐ To Do | **End-of-Sprint Verification:** **Test offline queueing.** Disconnect the network, perform an action, and verify the message is sent upon reconnection. **Test graceful degradation.** Throttle the network and verify the "Poor Connection" UI appears. | `(Manual Test)` |
