# Task List: Sprint 2 - Diagnostic & Logging System

**Goal:** To implement comprehensive webview message logging and basic test mode for debugging webview issues across all environments.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
|---------|--------|----------------------------------------------|-------------------|
| **2.1** | ☐ To Do | **Implement logWebviewMessage Helper:** Create centralized logging method in WebviewManager that captures message details, timestamps, and source information. | `src/webviewManager.ts` |
| **2.2** | ☐ To Do | **Add Sidebar Message Logging:** Update sidebar webview `onDidReceiveMessage` handler to log all incoming messages using the new logging helper. | `src/webviewManager.ts` |
| **2.3** | ☐ To Do | **Add Main Panel Message Logging:** Update main panel webview message handler to include comprehensive logging of all message types. | `src/webviewManager.ts` |
| **2.4** | ☐ To Do | **Add Settings Panel Message Logging:** Update settings panel webview message handler to log messages consistently with other handlers. | `src/webviewManager.ts` |
| **2.5** | ☐ To Do | **Implement webviewReady Detection:** Add explicit detection and logging for `webviewReady` messages with implementation type and timing information. | `src/webviewManager.ts` |
| **2.6** | ☐ To Do | **Add Basic Test Mode Setting:** Add `webview.basicTestMode` configuration property to VS Code settings with clear description for troubleshooting. | `package.json` |
| **2.7** | ☐ To Do | **Implement getBasicTestHtml Method:** Create method that generates minimal diagnostic HTML for testing VS Code API functionality and message passing. | `src/webviewManager.ts` |
| **2.8** | ☐ To Do | **Add Test Mode Logic to getWebviewContent:** Modify content generation to check basicTestMode setting and serve diagnostic HTML when enabled. | `src/webviewManager.ts` |
| **2.9** | ☐ To Do | **Create Test Mode UI:** Implement simple HTML interface with real-time status updates, VS Code API testing, and scrollable log display. | `src/webviewManager.ts` (within getBasicTestHtml) |
| **2.10** | ☐ To Do | **Add VS Code API Verification:** Implement retry logic for `acquireVsCodeApi()` with visual feedback and detailed error reporting in test mode. | `src/webviewManager.ts` (within getBasicTestHtml) |
| **2.11** | ☐ To Do | **Test Logging in Local Environment:** Verify that all message types are properly logged and accessible through VS Code's Output channel. | VS Code Output Channel Testing |
| **2.12** | ☐ To Do | **Test Basic Mode in Remote SSH:** Validate that basic test mode works correctly in Remote SSH environments and provides useful diagnostic information. | Remote SSH Environment Testing |
| **2.13** | ☐ To Do | **Verify All Implementations Send webviewReady:** Ensure React, Simple Svelte, and SvelteKit implementations all send proper webviewReady messages. | `webview-react/src/App.tsx`, `webview-simple/src/App.svelte`, `webview/src/lib/vscodeApi.ts` |
