# Implementation Guide: Sub-Sprint 1 - Auto-Recovery System

This guide provides a focused plan for implementing the heartbeat and auto-recovery mechanism.

---

### **Core Logic: Heartbeat and Reconnection**

**Primary File**: `shared/connectionMonitor.js`

*   **Concept**: The monitor will manage the connection state (`connected`, `disconnected`, `reconnecting`). It sends a `heartbeat` message every 5 seconds. If a `heartbeatResponse` isn't received within a 2-second timeout, it transitions to `disconnected` and starts trying to reconnect using exponential backoff.
*   **Web Search**: For the reconnection strategy, research "exponential backoff algorithm javascript".
*   **Implementation Sketch**:
    ```javascript
    // In ConnectionMonitor class
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const startTime = Date.now();
            this.postMessage({ command: 'heartbeat' }); // Use the wrapper
            this.heartbeatTimeout = setTimeout(() => {
                this.handleDisconnect();
            }, 2000); // 2-second timeout
        }, 5000); // 5-second interval
    }

    handleHeartbeatResponse() {
        clearTimeout(this.heartbeatTimeout);
        if (this.status !== 'connected') {
            this.handleReconnect();
        }
    }

    handleDisconnect() {
        if (this.status === 'connected') {
            this.status = 'disconnected';
            this.emit('statusChange', this.status);
            this.startReconnection();
        }
    }

    startReconnection() {
        let attempt = 0;
        const tryReconnect = () => {
            if (this.status !== 'connected') {
                this.status = 'reconnecting';
                this.emit('statusChange', this.status);
                this.postMessage({ command: 'heartbeat' }); // Attempt to reconnect
                attempt++;
                const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff up to 30s
                setTimeout(tryReconnect, delay);
            }
        };
        tryReconnect();
    }
    ```

### **Backend Handler**

**File**: `src/communication/messageRouter.ts`

*   **Action**: The backend must listen for `heartbeat` and reply immediately.
*   **Implementation**:
    ```typescript
    // In MessageRouter's handleMessage method's switch statement
    case 'heartbeat':
        this.webview.postMessage({ command: 'heartbeatResponse' });
        break;
    ```

### **UI Integration**

**New File**: `webview-react/src/components/ConnectionStatus.tsx`
**Modified File**: `webview-react/src/App.tsx`

*   **Concept**: Create a dedicated React component to display the status. It should subscribe to the `connectionMonitor`'s `statusChange` event.
*   **Implementation (`ConnectionStatus.tsx`)**:
    ```tsx
    import React, { useState, useEffect } from 'react';
    import { connectionMonitor } from '../services/connectionMonitor';

    export const ConnectionStatus = () => {
        const [status, setStatus] = useState(connectionMonitor.getStatus());

        useEffect(() => {
            const handleStatusChange = (newStatus) => setStatus(newStatus);
            connectionMonitor.on('statusChange', handleStatusChange);
            return () => connectionMonitor.off('statusChange', handleStatusChange);
        }, []);

        const statusText = {
            reconnecting: 'Reconnecting...',
            disconnected: 'Disconnected',
        };

        if (status === 'connected') {
            return null; // Don't show anything when connected
        }

        return <div className={`status-indicator ${status}`}>{statusText[status]}</div>;
    };
    ```
*   **Integration (`App.tsx`)**:
    ```tsx
    import { ConnectionStatus } from './components/ConnectionStatus';

    function App() {
      // ...
      return (
        <div>
          <ConnectionStatus />
          {/* Rest of the app */}
        </div>
      );
    }
    ```
