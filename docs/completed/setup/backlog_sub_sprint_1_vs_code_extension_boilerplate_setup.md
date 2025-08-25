### User Story 1: VS Code Extension Project Setup

**As a** developer, **I want to** set up a new VS Code extension project with a fundamental file structure and configuration, **so that** I have a clean and organized starting point for development.

**Actions to Undertake:**
1.  **Filepath**: `(Project Root)`
    -   **Action**: Generate a new TypeScript-based VS Code extension using `yo code`.
    -   **Implementation**: `npx yo code` (select "New Extension (TypeScript)")
    -   **Imports**: None.
2.  **Filepath**: `package.json`
    -   **Action**: Configure the extension's name, publisher, and activation events in `package.json`.
    -   **Implementation**: (Modify `name`, `publisher`, and `activationEvents` fields as per project requirements)
    -   **Imports**: None.
3.  **Filepath**: `(Project Root)`
    -   **Action**: Create separate directories for the `extension` (backend) and `webview` (frontend) source code.
    -   **Implementation**: `mkdir src/extension` and `mkdir src/webview` (or similar structure if `yo code` provides a different default)
    -   **Imports**: None.
4.  **Filepath**: `src/extension.ts`
    -   **Action**: Write the initial `extension.ts` file, including the `activate` and `deactivate` functions.
    -   **Implementation**: (Basic `activate` and `deactivate` functions with a sample command)
        ```typescript
        import * as vscode from 'vscode';

        export function activate(context: vscode.ExtensionContext) {
            console.log('Congratulations, your extension "your-extension-name" is now active!');

            let disposable = vscode.commands.registerCommand('your-extension-name.helloWorld', () => {
                vscode.window.showInformationMessage('Hello World from your-extension-name!');
            });

            context.subscriptions.push(disposable);
        }

        export function deactivate() {}
        ```
    -   **Imports**: `import * as vscode from 'vscode';`

**Acceptance Criteria:**
-   The extension can be launched in a VS Code development host.
-   A "Hello World" command from the extension can be successfully executed from the command palette.
-   The project structure is clean and logically separated, with distinct directories for backend and frontend concerns.

**Testing Plan:**
-   **Test Case 1**: Run the extension in a VS Code development host (`F5` in VS Code). Verify no errors occur on activation.
-   **Test Case 2**: Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`), search for "Hello World", and execute the command. Verify the "Hello World from your-extension-name!" information message appears.
-   **Test Case 3**: Inspect the project directory to confirm the presence of `src/extension` and `src/webview` (or equivalent) directories.
