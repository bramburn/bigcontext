# Task List: Sprint 1 - Multi-Implementation Framework

**Goal:** To establish multiple webview implementations with dynamic resource loading and configuration switching capabilities.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
|---------|--------|----------------------------------------------|-------------------|
| **1.1** | ☐ To Do | **Create React Project Structure:** Create `webview-react/` directory and initialize with `package.json`, basic React setup with TypeScript support. | `webview-react/package.json`, `webview-react/tsconfig.json` |
| **1.2** | ☐ To Do | **Configure React Vite Build:** Set up `vite.config.ts` with single bundle output, proper asset naming, and VS Code webview compatibility settings. | `webview-react/vite.config.ts` |
| **1.3** | ☐ To Do | **Implement React App Component:** Create main React component with VS Code API integration, Fluent UI components, and message passing functionality. | `webview-react/src/App.tsx`, `webview-react/src/main.tsx` |
| **1.4** | ☐ To Do | **Create Simple Svelte Project:** Set up `webview-simple/` directory with minimal Svelte configuration, avoiding SvelteKit complexity. | `webview-simple/package.json`, `webview-simple/svelte.config.js` |
| **1.5** | ☐ To Do | **Configure Simple Svelte Build:** Set up Vite configuration for Svelte with single bundle output and webview compatibility. | `webview-simple/vite.config.ts` |
| **1.6** | ☐ To Do | **Implement Simple Svelte Component:** Create basic Svelte component with VS Code API integration and Fluent UI web components. | `webview-simple/src/App.svelte`, `webview-simple/src/main.ts` |
| **1.7** | ☐ To Do | **Add getBuildDirectory Helper:** Implement centralized method in WebviewManager to determine build directory based on configuration setting. | `src/webviewManager.ts` |
| **1.8** | ☐ To Do | **Update localResourceRoots Configuration:** Replace all hardcoded 'webview/build' references with dynamic `getBuildDirectory()` calls in sidebar, main panel, and settings panel. | `src/webviewManager.ts` |
| **1.9** | ☐ To Do | **Add Implementation Selection Setting:** Add VS Code configuration property for choosing webview implementation with enum validation. | `package.json` |
| **1.10** | ☐ To Do | **Update Asset Path Rewriting:** Modify `getWebviewContent` to handle different asset patterns for SvelteKit vs React/Simple Svelte implementations. | `src/webviewManager.ts` |
| **1.11** | ☐ To Do | **Build All Implementations:** Run build commands for all three implementations and verify output structure and functionality. | `webview-react/dist/`, `webview-simple/dist/`, `webview/build/` |
| **1.12** | ☐ To Do | **Update TypeScript Configuration:** Exclude new webview directories from main TypeScript compilation to prevent conflicts. | `tsconfig.json` |
| **1.13** | ☐ To Do | **Test Implementation Switching:** Verify that changing the configuration setting properly switches between implementations without errors. | VS Code Settings, Extension Testing |
