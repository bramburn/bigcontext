### How to Implement Sprint 3: Backend Process Management

This sprint focuses on the critical integration between the VS Code extension (TypeScript) and the C# backend. The goal is to automate the lifecycle management of the backend process, ensuring it starts automatically, is monitored for health, and is properly terminated.

**Key Technologies and Concepts:**

*   **Node.js `child_process` module:** Provides the ability to spawn child processes, execute shell commands, and interact with their I/O streams. Specifically, `spawn` is preferred for long-running processes.
*   **VS Code Extension API:** `vscode.ExtensionContext` for managing disposables, `vscode.window.showInformationMessage` for user notifications.
*   **HTTP `fetch` API:** For making HTTP requests to the backend's health endpoint. In Node.js, you might need a polyfill like `node-fetch` or use `undici` for Node.js 18+.
*   **Process Management:** Handling `stdout`, `stderr`, `close`, and `error` events of the child process. Ensuring proper termination (`kill()`).

**Detailed Implementation Steps and Code Examples:**

1.  **Spawn C# Backend Executable:**
    In your extension's `activate` function, use `child_process.spawn` to launch the compiled C# executable. You'll need to determine the correct path to your executable after the C# project is built.
    *   **File:** `extension.ts` (main extension file)
    *   **Code Example:**
        ```typescript
        import * as vscode from 'vscode';
        import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
        import * as path from 'path';
        import fetch from 'node-fetch'; // Or 'undici' for Node.js 18+

        let backendProcess: ChildProcessWithoutNullStreams | null = null;
        const backendPort = 5000; // Define your backend's port

        export function activate(context: vscode.ExtensionContext) {
            console.log('Code Context extension is now active!');

            // IMPORTANT: Adjust this path based on your C# build output location.
            // This assumes the C# project builds to a 'bin' folder within the extension's root.
            const backendExecutablePath = path.join(context.extensionPath, 'bin', 'CodeContext.Api', 'CodeContext.Api'); // Example for Windows/Linux
            // For macOS, it might be: path.join(context.extensionPath, 'bin', 'CodeContext.Api', 'CodeContext.Api')
            // Or if it's a self-contained deployment: path.join(context.extensionPath, 'publish', 'CodeContext.Api')

            // Ensure the executable exists before trying to spawn
            if (!require('fs').existsSync(backendExecutablePath)) {
                vscode.window.showErrorMessage(`Code Context backend executable not found at: ${backendExecutablePath}`);
                return;
            }

            backendProcess = spawn(backendExecutablePath, [], {
                cwd: path.dirname(backendExecutablePath), // Run from the executable's directory
                stdio: ['ignore', 'pipe', 'pipe'] // Ignore stdin, pipe stdout/stderr
            });

            // Capture stdout for logging
            backendProcess.stdout.on('data', (data) => {
                console.log(`[Backend stdout]: ${data.toString()}`);
                // Consider using a dedicated VS Code OutputChannel for better logging
                // const outputChannel = vscode.window.createOutputChannel("Code Context Backend");
                // outputChannel.appendLine(`[Backend stdout]: ${data.toString()}`);
            });

            // Capture stderr for error logging
            backendProcess.stderr.on('data', (data) => {
                console.error(`[Backend stderr]: ${data.toString()}`);
                // outputChannel.appendLine(`[Backend stderr]: ${data.toString()}`);
            });

            // Handle process exit
            backendProcess.on('close', (code) => {
                console.log(`Backend process exited with code ${code}`);
                backendProcess = null;
                // Potentially notify user or attempt restart if unexpected exit
            });

            // Handle errors during spawning (e.g., executable not found, permissions)
            backendProcess.on('error', (err) => {
                console.error('Failed to start backend process:', err);
                vscode.window.showErrorMessage(`Failed to start Code Context backend: ${err.message}`);
                backendProcess = null;
            });

            // Ensure the process is killed when the extension deactivates
            context.subscriptions.push({
                dispose: () => {
                    if (backendProcess) {
                        console.log('Terminating backend process on extension deactivation...');
                        backendProcess.kill(); // Sends SIGTERM
                        backendProcess = null;
                    }
                }
            });

            // Start health check after a short delay to allow backend to start listening
            setTimeout(() => startHealthCheck(context), 2000);
        }

        export function deactivate() {
            if (backendProcess) {
                console.log('Deactivating extension, terminating backend process...');
                backendProcess.kill(); // Ensure process is killed
                backendProcess = null;
            }
        }
        ```
    *   **Guidance:**
        *   `cwd`: Set the current working directory for the spawned process to the directory containing the executable.
        *   `stdio`: `['ignore', 'pipe', 'pipe']` means stdin is ignored, stdout and stderr are piped to the parent process (your extension), allowing you to capture their output.
        *   **Executable Path:** The path `path.join(context.extensionPath, 'bin', 'CodeContext.Api', 'CodeContext.Api')` is a common pattern for .NET Core executables. For cross-platform compatibility, you might need to check `process.platform` or use a self-contained deployment.
        *   **Error Handling:** Implement robust error handling for `spawn` and `on('error')` events.

2.  **Implement Backend Health Monitoring:**
    Create a function to periodically check the backend's `/health` endpoint. If it fails repeatedly, attempt to restart the backend.
    *   **File:** `extension.ts`
    *   **Code Example (add as a new function):**
        ```typescript
        // ... (inside extension.ts, after activate/deactivate) ...

        let healthCheckTimer: NodeJS.Timeout | null = null;
        let healthCheckAttempts = 0;
        const maxHealthCheckAttempts = 5; // Number of failed attempts before restart
        const healthCheckInterval = 5000; // Check every 5 seconds

        async function checkBackendHealth(context: vscode.ExtensionContext): Promise<boolean> {
            if (!backendProcess) {
                console.log('Backend process not running, health check skipped.');
                return false;
            }
            try {
                const response = await fetch(`http://localhost:${backendPort}/health`);
                if (response.ok) {
                    console.log('Backend is healthy.');
                    healthCheckAttempts = 0;
                    // You can send a message to your webview here to update UI status
                    // vscode.window.activeTextEditor?.document.uri.scheme === 'vscode-webview' &&
                    // webviewPanel.webview.postMessage({ type: 'backendStatus', status: 'running' });
                    return true;
                } else {
                    console.warn(`Backend health check failed: HTTP ${response.status}`);
                    return false;
                }
            } catch (error) {
                console.error('Error during backend health check:', error);
                return false;
            }
        }

        function startHealthCheck(context: vscode.ExtensionContext) {
            if (healthCheckTimer) {
                clearInterval(healthCheckTimer);
            }
            healthCheckTimer = setInterval(async () => {
                const isHealthy = await checkBackendHealth(context);
                if (!isHealthy) {
                    healthCheckAttempts++;
                    // Update UI state to "Starting" or "Error"
                    // webviewPanel.webview.postMessage({ type: 'backendStatus', status: 'starting' });

                    if (healthCheckAttempts >= maxHealthCheckAttempts) {
                        console.error('Max health check attempts reached. Attempting to restart backend.');
                        clearInterval(healthCheckTimer!);
                        restartBackend(context);
                    }
                }
            }, healthCheckInterval);
        }

        function restartBackend(context: vscode.ExtensionContext) {
            if (backendProcess) {
                console.log('Killing existing backend process for restart...');
                backendProcess.kill(); // Send SIGTERM
                backendProcess = null;
            }
            healthCheckAttempts = 0; // Reset attempts for new process
            console.log('Attempting to restart backend process...');
            // Re-call activate to re-spawn and re-initialize everything
            // In a more complex app, you might have a dedicated `startBackend` function
            deactivate(); // Clean up existing disposables
            activate(context); // Re-activate the extension, which will spawn a new process
            vscode.window.showWarningMessage('Code Context Backend is restarting due to health check failures.');
        }
        ```
    *   **Guidance:**
        *   `setInterval`: Used for periodic checks.
        *   `fetch`: Make HTTP requests. Remember to install `node-fetch` (`npm install node-fetch`) or use Node.js's built-in `fetch` if on Node.js 18+.
        *   **Restart Logic:** The `restartBackend` function kills the current process and then re-calls `activate(context)`. This is a simple way to re-initialize the extension and spawn a new backend. For more fine-grained control, you might extract the spawning logic into a separate `startBackend` function.
        *   **UI Integration:** The comments show where you would send messages to a VS Code Webview to update the UI status.

**Verification:**

*   **Manual Testing:**
    1.  Open VS Code and activate the extension. Check your system's process list (Task Manager on Windows, Activity Monitor on macOS, `ps aux | grep CodeContext.Api` on Linux) to confirm the C# backend process is running.
    2.  Deactivate the extension (e.g., by closing the VS Code window or disabling the extension). Verify the C# backend process is no longer running.
    3.  While the extension is active, manually kill the C# backend process (e.g., using Task Manager). Observe if the extension detects the unhealthiness and attempts to restart the backend after a few intervals.
*   **Logging:** Monitor the VS Code Debug Console (for `console.log` messages) or a dedicated Output Channel (if implemented) for messages indicating process start/stop, health checks, and errors.
