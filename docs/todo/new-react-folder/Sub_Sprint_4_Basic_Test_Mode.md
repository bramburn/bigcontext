# Sub-Sprint 4: Basic Test Mode

**Objective:**
To implement a minimal diagnostic test mode that verifies VS Code API functionality and webview environment health before loading complex UI components.

**Parent Sprint:**
PRD 1, Sprint 2: Diagnostic & Logging System

**Tasks:**

1. **Create Basic Test HTML Generator:**
   - Implement `getBasicTestHtml` method in WebviewManager
   - Generate minimal HTML with VS Code API acquisition test
   - Include retry logic with visual feedback
   - Add real-time status display and logging

2. **Implement Test Mode Configuration:**
   - Add `webview.basicTestMode` VS Code setting
   - Modify `getWebviewContent` to check test mode setting
   - Ensure test mode bypasses complex UI loading
   - Provide clear setting description for troubleshooting

3. **Add VS Code API Verification:**
   - Test `acquireVsCodeApi()` availability with retry mechanism
   - Verify message passing capability with test messages
   - Display connection status and timing information
   - Log all test results for debugging

4. **Create Test Mode UI:**
   - Simple HTML interface showing test progress
   - Real-time status updates (initializing, testing, success/failure)
   - Scrollable log display for detailed information
   - Clear visual indicators for test results

**Acceptance Criteria:**

- `basicTestMode` setting enables minimal diagnostic HTML
- Test mode successfully verifies VS Code API in local environment
- Test mode works in Remote SSH environments
- Test results are displayed in real-time within the webview
- Test mode logs are captured in extension output channel
- Test mode can be enabled/disabled without extension restart

**Dependencies:**

- Sub-Sprint 3 must be complete (logging system functional)
- VS Code configuration system
- Understanding of webview sandbox restrictions

**Timeline:**

- **Start Date:** Week 2, Day 5
- **End Date:** Week 2, Day 7

**Files to Create/Modify:**

- `src/webviewManager.ts` (getBasicTestHtml method, test mode logic)
- `package.json` (add webview.basicTestMode configuration)
