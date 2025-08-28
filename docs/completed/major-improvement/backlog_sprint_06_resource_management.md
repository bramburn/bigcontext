# Backlog: Sprint 6 - Resource Management

**Objective:** To provide users with control over the extension's resource consumption by implementing an "Indexing Intensity" setting.

---

### User Story 1: Indexing Intensity Control
**As a** developer, **I want to** be able to control the resource consumption of the extension, **so that** it doesn't slow down my machine, especially when I'm on battery power or running other intensive tasks.

**Acceptance Criteria:**
- A new setting, `code-context-engine.indexingIntensity`, is added to the native VS Code settings UI.
- The setting is an enum with options: "High" (default), "Medium", "Low".
- The `IndexingService` reads this setting and adjusts its behavior.
- "Low" intensity adds a significant delay between processing each file.
- "Medium" intensity adds a small delay.
- "High" intensity runs at maximum speed (no artificial delay).

**Actions to Undertake:**
1.  **Filepath**: `package.json`
    -   **Action**: Define the new `code-context-engine.indexingIntensity` setting under `contributes.configuration`.
    -   **Implementation**:
        ```json
        "contributes": {
            "configuration": {
                "title": "Code Context Engine",
                "properties": {
                    "code-context-engine.indexingIntensity": {
                        "type": "string",
                        "enum": ["High", "Medium", "Low"],
                        "default": "High",
                        "description": "Controls the CPU intensity of the indexing process. 'Low' is recommended for battery-powered devices."
                    }
                }
            }
        }
        ```
    -   **Imports**: None.
2.  **Filepath**: `src/configService.ts`
    -   **Action**: Add a new getter method `getIndexingIntensity()` to retrieve the configured value from the workspace configuration.
    -   **Implementation**:
        ```typescript
        public getIndexingIntensity(): 'High' | 'Medium' | 'Low' {
            return vscode.workspace.getConfiguration('code-context-engine').get('indexingIntensity', 'High');
        }
        ```
    -   **Imports**: `import * as vscode from 'vscode';`
3.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: Create a simple async `delay` helper function.
    -   **Implementation**:
        ```typescript
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        ```
    -   **Imports**: None.
4.  **Filepath**: `src/indexing/indexingService.ts`
    -   **Action**: In the main file processing loop, read the intensity setting and `await` a delay based on its value.
    -   **Implementation**:
        ```typescript
        // Inside the loop, e.g., `for (const file of files)`
        const intensity = this.configService.getIndexingIntensity();
        switch (intensity) {
            case 'Medium':
                await delay(100); // 100ms delay
                break;
            case 'Low':
                await delay(500); // 500ms delay
                break;
            case 'High':
            default:
                // No delay
                break;
        }
        // ... proceed with processing the file
        ```
    -   **Imports**: None.

**Testing Plan:**
-   **Test Case 1**: Open VS Code settings and verify the "Indexing Intensity" dropdown appears with the correct options and default value.
-   **Test Case 2**: Set the intensity to "High" and start indexing. Verify it runs at full speed.
-   **Test Case 3**: Set the intensity to "Low" and start indexing the same project. Verify that the process is visibly slower and that CPU usage is lower compared to the "High" setting.
-   **Test Case 4**: Set the intensity to "Medium" and verify the speed is between "Low" and "High".
