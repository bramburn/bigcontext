### User Story 1: Backend MessageRouter
**As a** developer, **I want a** `MessageRouter` class in the backend to handle all incoming webview messages, **so that** communication logic is centralized and testable.

**Actions to Undertake:**
1.  **Filepath**: `src/messageRouter.ts` (New File)
    -   **Action**: Create a new file `messageRouter.ts` and define the `MessageRouter` class.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';

        export class MessageRouter {
            private webview: vscode.Webview;

            constructor(webview: vscode.Webview) {
                this.webview = webview;
                this.webview.onDidReceiveMessage(message => this.handleMessage(message));
            }

            private async handleMessage(message: any) {
                switch (message.command) {
                    // This will be implemented in the next user story
                    case 'ping':
                        console.log('Received ping from webview');
                        this.webview.postMessage({ command: 'pong', requestId: message.requestId });
                        break;
                    default:
                        console.warn('Unknown command received:', message.command);
                        break;
                }
            }

            public postMessage(message: any) {
                this.webview.postMessage(message);
            }
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
2.  **Filepath**: `src/webviewManager.ts`
    -   **Action**: Instantiate `MessageRouter` and pass the webview instance to it. Delegate `onDidReceiveMessage` to `MessageRouter`.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';
        import * as path from 'path';
        import * as fs from 'fs';
        import { MessageRouter } from './messageRouter'; // Add this import

        export class WebviewManager {
            private static instance: WebviewManager;
            private panel: vscode.WebviewPanel | undefined;
            private readonly context: vscode.ExtensionContext;
            private messageRouter: MessageRouter | undefined; // Add this line

            private constructor(context: vscode.ExtensionContext) {
                this.context = context;
            }

            public static getInstance(context: vscode.ExtensionContext): WebviewManager {
                if (!WebviewManager.instance) {
                    WebviewManager.instance = new WebviewManager(context);
                }
                return WebviewManager.instance;
            }

            public showMainPanel() {
                if (this.panel) {
                    this.panel.reveal(vscode.ViewColumn.One);
                    return;
                }

                this.panel = vscode.window.createWebviewPanel(
                    'codeContextEngine',
                    'Code Context Engine',
                    vscode.ViewColumn.One,
                    {
                        enableScripts: true,
                        localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'dist'))]
                    }
                );

                this.messageRouter = new MessageRouter(this.panel.webview); // Instantiate MessageRouter

                this.panel.webview.html = this.getWebviewContent();

                this.panel.onDidDispose(() => {
                    this.panel = undefined;
                    this.messageRouter = undefined; // Clear message router on dispose
                }, null, this.context.subscriptions);
            }

            private getWebviewContent(): string {
                const webviewPath = path.join(this.context.extensionPath, 'webview', 'dist', 'index.html');
                let htmlContent = fs.readFileSync(webviewPath, 'utf8');

                htmlContent = htmlContent.replace(
                    /(<script src="|\ssrc="|<link href=")(?!https?:\/\/)([^"]*)"/g,
                    (match, p1, p2) => {
                        const resourcePath = path.join(this.context.extensionPath, 'webview', 'dist', p2);
                        const uri = this.panel!.webview.asWebviewUri(vscode.Uri.file(resourcePath));
                        return `${p1}${uri}"`;
                    }
                );

                return htmlContent;
            }
        }
        ```
    -   **Imports**: `import { MessageRouter } from './messageRouter';`

**Acceptance Criteria:**
-   A new file `src/messageRouter.ts` exists containing the `MessageRouter` class.
-   The `WebviewManager` instantiates `MessageRouter` when a new webview panel is created.
-   The `MessageRouter` receives messages from the webview via `onDidReceiveMessage`.
-   The `MessageRouter` can send messages back to the webview via `postMessage`.

**Testing Plan:**
-   **Test Case 1**: Set a breakpoint in `MessageRouter.handleMessage`. Send a message from the webview (e.g., via browser console `vscode.postMessage({ command: 'test' })`). Verify the breakpoint is hit.
-   **Test Case 2**: Set a breakpoint in `WebviewManager.showMainPanel` after `messageRouter` is instantiated. Verify `messageRouter` is an instance of `MessageRouter`.

### User Story 2: Frontend vscodeApi Client
**As Frank, I want a** `vscodeApi` client in my SvelteKit app to abstract away the `postMessage` API, **so I can** easily communicate with the extension.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/vscodeApi.ts`
    -   **Action**: Implement the `vscodeApi` client to wrap `acquireVsCodeApi()` and handle message passing.
    -   **Implementation**:
        ```typescript
        // webview/src/lib/vscodeApi.ts

        interface VsCodeApi {
            postMessage(message: any): void;
            setState(newState: any): void;
            getState(): any;
        }

        declare const acquireVsCodeApi: () => VsCodeApi;

        const vscode = acquireVsCodeApi();

        type MessageCallback = (message: any) => void;

        const callbacks = new Map<string, MessageCallback>();
        let requestIdCounter = 0;

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.requestId && callbacks.has(message.requestId)) {
                callbacks.get(message.requestId)?.(message);
                callbacks.delete(message.requestId);
            } else {
                // Handle unsolicited messages or general events
                console.log('Received unsolicited message:', message);
            }
        });

        export const vscodeApi = {
            postMessage: (command: string, payload?: any): Promise<any> => {
                const requestId = `req-${requestIdCounter++}`;
                const message = { command, requestId, payload };
                vscode.postMessage(message);

                return new Promise(resolve => {
                    callbacks.set(requestId, resolve);
                });
            },
            onMessage: (callback: MessageCallback) => {
                // This is a simplified approach for general messages. For specific command responses,
                // the postMessage promise-based approach is preferred.
                window.addEventListener('message', event => {
                    const message = event.data;
                    // Only call callback for messages not handled by requestId
                    if (!message.requestId) {
                        callback(message);
                    }
                });
            },
            getState: () => vscode.getState(),
            setState: (newState: any) => vscode.setState(newState),
        };
        ```
    -   **Imports**: None (uses global `acquireVsCodeApi` and `window`)

**Acceptance Criteria:**
-   A `webview/src/lib/vscodeApi.ts` file exists.
-   It exports a `vscodeApi` object with `postMessage` and `onMessage` methods.
-   The `postMessage` method sends messages to the extension and returns a Promise that resolves with the response.
-   The client correctly handles `requestId` for request-response pairing.
-   Svelte components can import and use `vscodeApi` for communication.

**Testing Plan:**
-   **Test Case 1**: In a Svelte component, import `vscodeApi` and call `vscodeApi.postMessage('test', { data: 'hello' })`. Verify the message is received by the extension (using a breakpoint in `MessageRouter`).
-   **Test Case 2**: From the extension, send a message back to the webview using `webview.postMessage`. Verify the `window.addEventListener('message')` in `vscodeApi.ts` receives it.

### User Story 3: End-to-End Ping Command
**As a** developer, **I want to** implement a "ping" command to verify the communication bridge, **so we can** confirm the connection is working end-to-end.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/index.ts` (or a new Svelte component)
    -   **Action**: Add a button to the Svelte UI that sends a 'ping' command.
    -   **Implementation**:
        ```html
        <!-- Example in a Svelte component (e.g., App.svelte or a new PingTest.svelte) -->
        <script lang="ts">
            import { vscodeApi } from './lib/vscodeApi';
            let responseMessage: string = '';

            async function sendPing() {
                try {
                    responseMessage = 'Sending ping...';
                    const response = await vscodeApi.postMessage('ping');
                    responseMessage = `Received: ${response.command} (requestId: ${response.requestId})`;
                } catch (error) {
                    responseMessage = `Error: ${error.message}`;
                }
            }
        </script>

        <main>
            <h1>Webview Communication Test</h1>
            <button on:click={sendPing}>Send Ping to Extension</button>
            {#if responseMessage}
                <p>{responseMessage}</p>
            {/if}
        </main>

        <style>
            /* Add some basic styling */
            main {
                font-family: sans-serif;
                padding: 20px;
            }
            button {
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
            }
            p {
                margin-top: 15px;
                color: green;
            }
        </style>
        ```
    -   **Imports**: `import { vscodeApi } from './lib/vscodeApi';`
2.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Ensure the 'ping' command is handled and a 'pong' response is sent.
    -   **Implementation**:
        ```typescript
        import * as vscode from 'vscode';

        export class MessageRouter {
            private webview: vscode.Webview;

            constructor(webview: vscode.Webview) {
                this.webview = webview;
                this.webview.onDidReceiveMessage(message => this.handleMessage(message));
            }

            private async handleMessage(message: any) {
                switch (message.command) {
                    case 'ping':
                        console.log('Received ping from webview', message.requestId);
                        // Send pong back with the same requestId
                        this.webview.postMessage({ command: 'pong', requestId: message.requestId });
                        break;
                    default:
                        console.warn('Unknown command received:', message.command);
                        break;
                }
            }

            public postMessage(message: any) {
                this.webview.postMessage(message);
            }
        }
        ```
    -   **Imports**: None (already imported)

**Acceptance Criteria:**
-   A button exists in the Svelte webview UI to send a 'ping' message.
-   Clicking the button sends a message with `command: 'ping'` and a `requestId` to the extension.
-   The extension's `MessageRouter` receives the 'ping' message and sends back a 'pong' message with the same `requestId`.
-   The Svelte UI receives the 'pong' response and displays a success message to the user.

**Testing Plan:**
-   **Test Case 1**: Run the extension, open the webview. Click the "Send Ping to Extension" button. Verify that "Received: pong" is displayed in the webview.
-   **Test Case 2**: Check the VS Code extension output channel and the webview's developer console for any errors or unexpected messages.
