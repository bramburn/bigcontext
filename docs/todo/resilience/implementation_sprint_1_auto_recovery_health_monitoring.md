# Implementation Guide: Sprint 1 - Auto-Recovery & Health Monitoring

This guide provides technical details for implementing a resilient, self-healing webview with health monitoring capabilities.

---

### **Part 1: Auto-Recovery System**

This system relies on a "heartbeat" to check the connection status between the webview (frontend) and the extension (backend).

**Relevant Files:**
*   `shared/connectionMonitor.js` (Core Logic)
*   `webview-react/src/App.tsx` (Integration)
*   `src/communication/messageRouter.ts` (Backend Handler)
*   `webview-react/src/components/ConnectionStatus.tsx` (New UI Component)

**1.1. Heartbeat and Reconnection Logic (`shared/connectionMonitor.js`)**

*   **Concept**: The monitor will periodically send a `heartbeat` message. If a `heartbeatResponse` isn't received within a timeout, it assumes disconnection and starts trying to reconnect.
*   **Web Search**: For the reconnection strategy, research "exponential backoff algorithm javascript". This prevents spamming reconnection requests.
*   **Implementation Sketch**:
    ```javascript
    // In ConnectionMonitor class
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const startTime = Date.now();
            this.vscodeApi.postMessage({ command: 'heartbeat' });
            this.heartbeatTimeout = setTimeout(() => {
                this.handleDisconnect();
            }, this.timeout);
        }, 5000); // Send heartbeat every 5 seconds
    }

    handleHeartbeatResponse() {
        clearTimeout(this.heartbeatTimeout);
        this.latency = Date.now() - startTime; // For health monitoring
        if (this.status !== 'connected') {
            this.handleReconnect();
        }
    }

    handleDisconnect() {
        this.status = 'disconnected';
        this.emit('statusChange', this.status);
        this.startReconnection();
    }

    startReconnection() {
        // Implement exponential backoff logic here
        // e.g., attempt 1 after 1s, attempt 2 after 2s, attempt 3 after 4s...
    }
    ```
    *Note: You will also need to add a listener for the `heartbeatResponse` message.*

**1.2. Backend Heartbeat Handler (`src/communication/messageRouter.ts`)**

*   **Action**: The backend must listen for `heartbeat` and reply immediately.
*   **Implementation**:
    ```typescript
    // In MessageRouter's handleMessage method
    case 'heartbeat':
        this.webview.postMessage({ command: 'heartbeatResponse' });
        break;
    ```

**1.3. UI Component (`ConnectionStatus.tsx`)**

*   **Concept**: A simple component that listens to the monitor's state.
*   **Web Search**: "React hooks useEffect for event listeners" to properly subscribe and unsubscribe.
*   **Implementation Sketch**:
    ```tsx
    import React, { useState, useEffect } from 'react';
    import { connectionMonitor } from '../services/connectionMonitor'; // Assuming singleton instance

    export const ConnectionStatus = () => {
        const [status, setStatus] = useState(connectionMonitor.getStatus());

        useEffect(() => {
            const handleStatusChange = (newStatus) => setStatus(newStatus);
            connectionMonitor.on('statusChange', handleStatusChange);
            return () => {
                connectionMonitor.off('statusChange', handleStatusChange);
            };
        }, []);

        if (status === 'connected') return null; // Or show a subtle green dot

        return (
            <div className={`connection-status ${status}`}>
                {status === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
            </div>
        );
    };
    ```

---

### **Part 2: Health Monitoring API**

This API allows the backend to request performance data from the webview.

**1.4. Metrics Collection (`shared/connectionMonitor.js`)**

*   **Action**: Expand the monitor to track metrics.
*   **Implementation**:
    ```javascript
    // In ConnectionMonitor class
    constructor() {
        // ...
        this.metrics = {
            latency: 0,
            reconnectAttempts: 0,
            errors: 0,
        };
    }
    // Update this.metrics.latency in handleHeartbeatResponse
    // Increment this.metrics.reconnectAttempts in startReconnection
    ```

**1.5. Health Status API Handlers**

*   **Backend (`src/communication/messageRouter.ts`)**:
    *   Add a handler for `healthStatusResponse` to receive the data and log it.
    *   Periodically, the backend (e.g., in `extensionManager.ts`) will post a `getHealthStatus` message to the webview.
    ```typescript
    // In MessageRouter
    case 'healthStatusResponse':
        const { latency } = message.payload;
        this.loggingService.log(`Webview health: latency=${latency}ms`);
        // Add logic to check against thresholds from config
        break;
    ```

*   **Frontend (`shared/connectionMonitor.js`)**:
    *   Listen for `getHealthStatus` and respond with the collected metrics.
    ```javascript
    // In ConnectionMonitor, add a listener
    this.vscodeApi.onMessage(message => {
        if (message.command === 'getHealthStatus') {
            this.vscodeApi.postMessage({
                command: 'healthStatusResponse',
                payload: this.metrics
            });
        }
    });
    ```

**1.6. Configuration (`package.json`)**

*   **Web Search**: "VSCode extension contribution points configuration"
*   **Action**: Add settings to allow users to configure thresholds.
*   **Implementation**:
    ```json
    "contributes": {
        "configuration": {
            "title": "Code Context Engine",
            "properties": {
                "code-context-engine.health.latencyThreshold": {
                    "type": "number",
                    "default": 500,
                    "description": "Threshold (in ms) for webview message latency before a warning is shown."
                }
            }
        }
    }
    ```
