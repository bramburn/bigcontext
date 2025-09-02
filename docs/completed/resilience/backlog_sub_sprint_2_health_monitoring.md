# Backlog: Sub-Sprint 2 - Health Monitoring API

**Objective:** To implement a system for collecting and reporting webview health and performance metrics to the extension backend for logging and proactive issue detection.

**Parent Sprint:** PRD 1, Sprint 1: Auto-Recovery & Health Monitoring

---

### User Story: Webview Health Monitoring

**As an** extension developer,
**I want** comprehensive health monitoring that tracks webview performance and errors,
**So that** issues can be identified, diagnosed, and resolved proactively.

**Actions to Undertake:**

1.  **Filepath**: `shared/connectionMonitor.js`
    *   **Action**: Add logic to collect key performance metrics, such as message latency (calculated from the heartbeat roundtrip), total reconnection attempts, and a count of disconnect events.

2.  **Filepath**: `src/communication/messageRouter.ts`
    *   **Action**: Add a new message handler for a `getHealthStatus` command, which will be sent from the extension backend to the webview.

3.  **Filepath**: `shared/connectionMonitor.js`
    *   **Action**: Implement a listener for the `getHealthStatus` message. When received, it should gather the latest metrics and post them back to the backend in a `healthStatusResponse` message.

4.  **Filepath**: `src/extensionManager.ts` (or a new `HealthService.ts`)
    *   **Action**: Implement a function that periodically (e.g., every 60 seconds) sends the `getHealthStatus` message to the webview.

5.  **Filepath**: `src/communication/messageRouter.ts`
    *   **Action**: Upon receiving the `healthStatusResponse`, log the metrics using the `CentralizedLoggingService`.

6.  **Filepath**: `package.json`
    *   **Action**: Add new configuration settings for health monitoring thresholds (e.g., `code-context-engine.health.latencyThreshold`).

7.  **Filepath**: `src/extensionManager.ts` (or a new `HealthService.ts`)
    *   **Action**: Implement logic to check the received metrics against the configured thresholds and use the `NotificationService` to show a VS Code warning if a threshold is breached.

**Acceptance Criteria:**

*   The extension backend can successfully request and receive a health status report from the webview.
*   Metrics like latency, error counts, and reconnection attempts are correctly logged by the `CentralizedLoggingService`.
*   A VS Code warning notification is displayed if the webview's message latency exceeds the configured threshold.

**Testing Plan:**

*   **Test Case 1**: Trigger the `getHealthStatus` command from the backend. Check the extension's output logs to verify the health metrics are received and logged.
*   **Test Case 2**: Set a low `latencyThreshold` in the VS Code settings. Simulate high latency for the heartbeat response. Verify that a warning notification is displayed.
