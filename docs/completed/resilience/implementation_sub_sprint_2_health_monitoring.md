# Implementation Guide: Sub-Sprint 2 - Health Monitoring API

This guide provides technical details for building an API to report webview health metrics to the extension backend.

---

### **1. Metrics Collection (Frontend)**

**File**: `shared/connectionMonitor.js`

*   **Concept**: The monitor is the central point for tracking connection-related events. We will add properties to store these metrics.
*   **Implementation Sketch**:
    ```javascript
    // In ConnectionMonitor class
    constructor() {
        // ...
        this.metrics = {
            latency: 0,
            reconnectAttempts: 0,
            disconnects: 0,
        };
    }

    // In handleHeartbeatResponse, update latency
    handleHeartbeatResponse() {
        this.metrics.latency = Date.now() - this.heartbeatStartTime;
        // ...
    }

    // In startReconnection, increment attempts
    startReconnection() {
        this.metrics.reconnectAttempts++;
        // ...
    }

    // In handleDisconnect, increment disconnects
    handleDisconnect() {
        this.metrics.disconnects++;
        // ...
    }
    ```

### **2. Health Status API (Frontend & Backend)**

This involves a request/response flow between the backend and frontend.

**Frontend Handler (`shared/connectionMonitor.js`)**:
*   **Action**: Listen for a request from the backend and reply with the metrics.
*   **Implementation**:
    ```javascript
    // Add this to the message listener in the constructor
    if (message.command === 'getHealthStatus') {
        this.postMessage({
            command: 'healthStatusResponse',
            payload: this.metrics
        });
    }
    ```

**Backend Requester (`src/extensionManager.ts` or new `HealthService.ts`)**:
*   **Action**: Periodically ask the webview for its health.
*   **Implementation**:
    ```typescript
    // In a new HealthService or within ExtensionManager
    private startHealthChecks(webviewManager: WebviewManager): void {
        setInterval(() => {
            webviewManager.postMessage({ command: 'getHealthStatus' });
        }, 60000); // Check every 60 seconds
    }
    ```

**Backend Receiver (`src/communication/messageRouter.ts`)**:
*   **Action**: Receive the response, log it, and check it against thresholds.
*   **Implementation**:
    ```typescript
    // In handleMessage switch
    case 'healthStatusResponse':
        const metrics = message.payload;
        this.loggingService.log(`Webview Health: ${JSON.stringify(metrics)}`);

        const config = vscode.workspace.getConfiguration('code-context-engine.health');
        const latencyThreshold = config.get<number>('latencyThreshold');

        if (metrics.latency > latencyThreshold) {
            this.notificationService.showWarning(`High webview latency detected: ${metrics.latency}ms`);
        }
        break;
    ```

### **3. Configuration (Backend)**

**File**: `package.json`

*   **Web Search**: "VSCode extension contributes configuration"
*   **Action**: Define the setting so users can customize the alert threshold.
*   **Implementation**:
    ```json
    "contributes": {
        "configuration": {
            "title": "Code Context Engine",
            "properties": {
                "code-context-engine.health.latencyThreshold": {
                    "type": "number",
                    "default": 1000,
                    "description": "Threshold (in ms) for webview message latency before a warning is shown."
                }
            }
        }
    }
    ```
