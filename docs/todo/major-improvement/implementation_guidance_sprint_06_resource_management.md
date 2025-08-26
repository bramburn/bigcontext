# Implementation Guidance: Sprint 6 - Resource Management

**Objective:** To implement an "Indexing Intensity" setting that allows users to throttle the indexing process, thereby managing CPU and resource consumption.

---

### **High-Level Plan:**
1.  **Define the Setting:** The setting must first be defined in `package.json`. This makes it discoverable in the VS Code Settings UI and provides a schema for validation, default values, and descriptions.
2.  **Access the Setting:** A `ConfigService` (or similar configuration manager) will be responsible for reading the setting's value from the VS Code workspace configuration. This centralizes configuration access.
3.  **Implement Throttling:** The `IndexingService` will consume this setting. Inside its main processing loop (where it iterates over files), it will check the intensity level and, if necessary, `await` a small delay. This `await` pauses the execution of the loop, yielding control back to the JavaScript event loop and allowing other operations (including VS Code's UI) to remain responsive.

---

### **VS Code API for Configuration:**
*   **`package.json` (`contributes.configuration`):**
    *   This is the entry point for adding custom settings.
    *   **`type`**: Defines the data type (e.g., `string`, `boolean`, `number`).
    *   **`default`**: The value to be used if the user has not set one.
    *   **`description`**: A helpful string that appears in the Settings UI.
    *   **`enum`**: For `string` types, this restricts the possible values to a list, which VS Code will render as a dropdown menu. This is perfect for the intensity setting.
    *   **Reference**: [VS Code API Docs: Configuration Contribution Point](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration)

*   **`vscode.workspace.getConfiguration()`:**
    *   **Syntax**: `vscode.workspace.getConfiguration('myExtension.sectionName')`
    *   This returns a `WorkspaceConfiguration` object.
    *   **`.get<T>(settingName: string, defaultValue: T): T`**: This method retrieves the value of a specific setting. It's best practice to provide a default value here as a fallback, even though one is also defined in `package.json`.
    *   **Reference**: [VS Code API Docs: getConfiguration](https://code.visualstudio.com/api/references/vscode-api#workspace.getConfiguration)

---

### **Implementation Details:**

**1. `package.json` Definition:**
This is a critical first step. A well-defined setting is self-documenting.

```json
"contributes": {
  "configuration": {
    "title": "Code Context Engine",
    "properties": {
      "code-context-engine.indexingIntensity": {
        "type": "string",
        "enum": [
          "High",
          "Medium",
          "Low"
        ],
        "default": "High",
        "description": "Controls the CPU/resource usage of the indexing process. A lower setting introduces delays between file processing, which is ideal for battery-powered devices or when running other intensive tasks.",
        "scope": "resource"
      }
    }
  }
}
```
*Note: `"scope": "resource"` allows the setting to be configured per workspace folder.*

**2. `ConfigService.ts` Accessor:**
Centralizing access makes it easy to manage and mock for testing.

```typescript
import * as vscode from 'vscode';

export type IndexingIntensity = 'High' | 'Medium' | 'Low';

export class ConfigService {
    private get configuration() {
        return vscode.workspace.getConfiguration('code-context-engine');
    }

    public getIndexingIntensity(): IndexingIntensity {
        return this.configuration.get<IndexingIntensity>('indexingIntensity', 'High');
    }
}
```

**3. `IndexingService.ts` Throttling Logic:**
The core of the implementation lies in adding a delay to the tight loop of file processing.

```typescript
import { ConfigService, IndexingIntensity } from './configService';

export class IndexingService {
    constructor(private configService: ConfigService) {}

    private async getDelayForIntensity(intensity: IndexingIntensity): Promise<void> {
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        switch (intensity) {
            case 'Medium':
                return delay(100); // 100ms pause between files
            case 'Low':
                return delay(500); // 500ms pause between files
            case 'High':
            default:
                return Promise.resolve(); // No delay
        }
    }

    public async processFileQueue(files: vscode.Uri[]): Promise<void> {
        const intensity = this.configService.getIndexingIntensity();
        console.log(`[Indexing] Starting with ${intensity} intensity.`);

        for (const file of files) {
            // Await the delay at the beginning of each iteration
            await this.getDelayForIntensity(intensity);

            // ... existing logic to parse and index the file ...
            console.log(`[Indexing] Processing: ${file.fsPath}`);
        }
        
        console.log('[Indexing] Queue finished.');
    }
}
```
By placing the `await` inside the loop, you ensure that the process yields control on every single file, making the throttling very effective at reducing sustained CPU load.
