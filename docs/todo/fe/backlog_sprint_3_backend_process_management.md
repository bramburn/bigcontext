### User Story 1: Auto-Start C# Backend Service
**As a** developer, **I want the** VS Code extension to automatically start the C# backend service when the extension is activated, **so that** I don't have to run it manually.

**Actions to Undertake:**
1.  **Filepath**: `extension.ts` (Assuming this is the main extension file)
    -   **Action**: Implement logic to spawn the C# backend executable using `child_process.spawn`.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
        import * as path from 'path';

        let backendProcess: ChildProcessWithoutNullStreams | null = null;

        export function activate(context: vscode.ExtensionContext) {
            console.log('Code Context extension is now active!');

            // Determine the path to the C# backend executable
            // This path will depend on your build process and where the executable is placed.
            // Example: Assuming it's in a 'bin' folder relative to the extension root
            const backendExecutablePath = path.join(context.extensionPath, 'bin', 'CodeContext.Api'); // Adjust as needed

            backendProcess = spawn(backendExecutablePath, [], {
                cwd: path.dirname(backendExecutablePath), // Run from the executable's directory
                stdio: ['ignore', 'pipe', 'pipe'] // Ignore stdin, pipe stdout/stderr
            });

            backendProcess.stdout.on('data', (data) => {
                console.log(`Backend stdout: ${data}`);
                // You might want to log this to an output channel in VS Code
            });

            backendProcess.stderr.on('data', (data) => {
                console.error(`Backend stderr: ${data}`);
                // Log errors to an output channel
            });

            backendProcess.on('close', (code) => {
                console.log(`Backend process exited with code ${code}`);
                backendProcess = null;
                // Handle process exit, e.g., attempt restart or notify user
            });

            backendProcess.on('error', (err) => {
                console.error('Failed to start backend process:', err);
                vscode.window.showErrorMessage(`Failed to start Code Context backend: ${err.message}`);
                backendProcess = null;
            });

            // Add a disposable to ensure process is killed on deactivate
            context.subscriptions.push({
                dispose: () => {
                    if (backendProcess) {
                        console.log('Terminating backend process...');
                        backendProcess.kill(); // Send SIGTERM
                        backendProcess = null;
                    }
                }
            });
        }

        export function deactivate() {
            if (backendProcess) {
                console.log('Deactivating extension, terminating backend process...');
                backendProcess.kill();
                backendProcess = null;
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`, `import { spawn, ChildProcessWithoutNullStreams } from 'child_process';`, `import * as path from 'path';`
2.  **Filepath**: `extension.ts`
    -   **Action**: Ensure the child process is terminated when the extension is deactivated.
    -   **Implementation**: (Included in the `activate` and `deactivate` functions above)
        ```typescript
        // In activate:
        context.subscriptions.push({
            dispose: () => {
                if (backendProcess) {
                    console.log('Terminating backend process...');
                    backendProcess.kill();
                    backendProcess = null;
                }
            }
        });

        // In deactivate:
        export function deactivate() {
            if (backendProcess) {
                console.log('Deactivating extension, terminating backend process...');
                backendProcess.kill();
                backendProcess = null;
            }
        }
        ```
    -   **Imports**: None.

### User Story 2: Monitor Backend Service Health
**As a** developer, **I want the** extension to monitor the health of the C# backend service, **so that** it can reliably send API requests.

**Actions to Undertake:**
1.  **Filepath**: `extension.ts`
    -   **Action**: Periodically send HTTP GET requests to the backend's `/health` endpoint.
    -   **Implementation**:
        ```typescript
        // Inside activate function, after spawning backendProcess
        const backendPort = 5000; // Or read from configuration
        const healthCheckInterval = 5000; // 5 seconds
        let healthCheckAttempts = 0;
        const maxHealthCheckAttempts = 10;
        let healthCheckTimer: NodeJS.Timeout | null = null;

        function startHealthCheck() {
            if (healthCheckTimer) {
                clearInterval(healthCheckTimer);
            }
            healthCheckTimer = setInterval(async () => {
                if (!backendProcess) {
                    console.log('Backend process not running, stopping health check.');
                    clearInterval(healthCheckTimer!);
                    return;
                }

                try {
                    const response = await fetch(`http://localhost:${backendPort}/health`);
                    if (response.ok) {
                        console.log('Backend is healthy.');
                        healthCheckAttempts = 0;
                        // Update UI state to "Running"
                        // vscode.window.showInformationMessage('Code Context Backend is Running!');
                        // If you have a webview, send a message to it
                        // webviewPanel.webview.postMessage({ type: 'backendStatus', status: 'running' });
                    } else {
                        console.warn(`Backend health check failed: ${response.status}`);
                        healthCheckAttempts++;
                        // Update UI state to "Starting" or "Error"
                        // webviewPanel.webview.postMessage({ type: 'backendStatus', status: 'starting' });
                        if (healthCheckAttempts >= maxHealthCheckAttempts) {
                            console.error('Max health check attempts reached. Attempting to restart backend.');
                            clearInterval(healthCheckTimer!);
                            restartBackend(); // Implement this function
                        }
                    }
                } catch (error) {
                    console.error('Error during backend health check:', error);
                    healthCheckAttempts++;
                    // Update UI state to "Error"
                    // webviewPanel.webview.postMessage({ type: 'backendStatus', status: 'error' });
                    if (healthCheckAttempts >= maxHealthCheckAttempts) {
                        console.error('Max health check attempts reached. Attempting to restart backend.');
                        clearInterval(healthCheckTimer!);
                        restartBackend(); // Implement this function
                    }
                }
            }, healthCheckInterval);
        }

        function restartBackend() {
            if (backendProcess) {
                backendProcess.kill();
                backendProcess = null;
            }
            console.log('Restarting backend process...');
            // Re-call the spawn logic from activate, or a dedicated function
            // For simplicity, let's assume activate handles it, or create a startBackend function
            // startBackend(); // Call a function that encapsulates the spawning logic
            // For now, just log and let the user know
            vscode.window.showWarningMessage('Code Context Backend is restarting due to health check failures.');
            // In a real scenario, you'd re-run the spawn logic here.
            // For this backlog, we'll assume a simple restart mechanism.
            activate(context); // This is a simplified restart, might need more robust logic
        }

        // Call this after backendProcess is successfully spawned
        startHealthCheck();
        ```
    -   **Imports**: `import fetch from 'node-fetch';` (or `import { fetch } from 'undici';` for Node.js 18+)
2.  **Filepath**: `extension.ts`
    -   **Action**: Implement logic to restart the backend if health checks consistently fail.
    -   **Implementation**: (Included in the `startHealthCheck` and `restartBackend` functions above)
    -   **Imports**: None.

**Acceptance Criteria:**
-   The VS Code extension successfully launches the C# backend executable upon activation.
-   `stdout` and `stderr` from the backend process are captured and logged (e.g., to VS Code's output channel).
-   The backend process is reliably terminated when the extension is deactivated or VS Code is closed.
-   The extension periodically pings the backend's `/health` endpoint.
-   The extension can detect when the backend is unhealthy and attempts to restart it after a configurable number of failures.
-   (Implicit) The UI (webview) can receive status updates about the backend's health (e.g., "Starting", "Running", "Error").

**Testing Plan:**
-   **Test Case 1**: Activate the extension and verify that the C# backend process starts (check task manager/process list).
-   **Test Case 2**: Deactivate the extension and verify that the C# backend process is terminated.
-   **Test Case 3**: Introduce a deliberate error in the C# backend's `/health` endpoint (e.g., make it return 500) and observe if the extension attempts to restart the backend after multiple failures.
-   **Test Case 4**: Verify that backend `stdout` and `stderr` messages appear in the VS Code output channel (if implemented).
-   **Test Case 5**: (Manual) Observe the UI state changes (if a basic UI is already present) reflecting the backend's status.
