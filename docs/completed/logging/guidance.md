### Implementation Guidance: Sprint 1 - Centralized Logging Service

**Objective:** To create a `CentralizedLoggingService`, integrate it throughout the extension, and replace all existing `console.log` calls. This will provide a single, controllable, and user-accessible stream for all backend diagnostic information.

#### **Analysis of Existing Code**

A review of the `repomix-output.xml` file shows that the current codebase uses `console.log`, `console.warn`, and `console.error` calls scattered across multiple files, including `extensionManager.ts`, `commandManager.ts`, and `indexingService.ts`. There is no unified logging strategy, making it difficult to control log verbosity or provide users with a single place to view diagnostic output. The `ExtensionManager` is the clear architectural entry point for instantiating and distributing a new logging service.

#### **VS Code API Information**

- **`vscode.window.createOutputChannel(name: string): OutputChannel`**: This is the core VS Code API for this task. It creates a new output channel that appears in the "Output" panel. This is the primary interface for users to view logs.
    
    - **Reference**: [VS Code API Docs: createOutputChannel](https://www.google.com/search?q=https://code.visualstudio.com/api/references/vscode-api%23window.createOutputChannel "null")
        
- **`OutputChannel` Interface**: The object returned by `createOutputChannel` has several key methods:
    
    - `.appendLine(value: string)`: Appends a string to the output channel, followed by a newline. This will be our main tool for writing log messages.
        
    - `.show()`: Programmatically reveals the output channel to the user.
        
    - `.dispose()`: Cleans up the channel.
        
- **`vscode.workspace.getConfiguration(section: string)`**: Used to read the extension's settings, which will include our new log level setting.
    

#### **Implementation Strategy & Code Examples**

##### **1\. Add Log Level Setting to `package.json`**

First, define the new setting so users can control log verbosity.

**Filepath**: `package.json`

```
"contributes": {
  "configuration": {
    "title": "Code Context Engine",
    "properties": {
      "code-context-engine.logging.level": {
        "type": "string",
        "enum": ["Error", "Warn", "Info", "Debug"],
        "default": "Info",
        "description": "Controls the verbosity of logs shown in the 'Code Context Engine' output channel."
      }
      // ... other properties
    }
  }
}
```

##### **2\. Create the `CentralizedLoggingService`**

This class will encapsulate all logging logic.

**Filepath**: `src/logging/centralizedLoggingService.ts` (New File)

```
import * as vscode from 'vscode';

// Define an enum for log levels for type safety and clarity
enum LogLevel {
    Debug,
    Info,
    Warn,
    Error
}

export class CentralizedLoggingService {
    private outputChannel: vscode.OutputChannel;
    private currentLogLevel: LogLevel = LogLevel.Info;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel("Code Context Engine");
        this.updateLogLevel();

        // Listen for configuration changes to update the log level on the fly
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('code-context-engine.logging.level')) {
                this.updateLogLevel();
            }
        });
    }

    private updateLogLevel(): void {
        const logLevelSetting = vscode.workspace.getConfiguration('code-context-engine').get<string>('logging.level');
        switch (logLevelSetting) {
            case 'Debug':
                this.currentLogLevel = LogLevel.Debug;
                break;
            case 'Info':
                this.currentLogLevel = LogLevel.Info;
                break;
            case 'Warn':
                this.currentLogLevel = LogLevel.Warn;
                break;
            case 'Error':
                this.currentLogLevel = LogLevel.Error;
                break;
            default:
                this.currentLogLevel = LogLevel.Info;
        }
        this.info(`Log level set to: ${logLevelSetting}`);
    }

    private log(level: LogLevel, message: string): void {
        if (level >= this.currentLogLevel) {
            const timestamp = new Date().toISOString();
            const levelString = LogLevel[level].toUpperCase();
            this.outputChannel.appendLine(`[${timestamp}] [${levelString}] ${message}`);
        }
    }

    public debug(message: string): void {
        this.log(LogLevel.Debug, message);
    }

    public info(message: string): void {
        this.log(LogLevel.Info, message);
    }

    public warn(message: string): void {
        this.log(LogLevel.Warn, message);
    }

    public error(message: string, error?: any): void {
        let fullMessage = message;
        if (error) {
            if (error instanceof Error) {
                fullMessage += ` | Details: ${error.message}`;
                if (error.stack) {
                    fullMessage += `\nStack: ${error.stack}`;
                }
            } else {
                fullMessage += ` | Details: ${JSON.stringify(error)}`;
            }
        }
        this.log(LogLevel.Error, fullMessage);
    }

    public show(): void {
        this.outputChannel.show();
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}
```

##### **3\. Integrate into `ExtensionManager`**

Instantiate the service in the `ExtensionManager` and make it available to other services.

**Filepath**: `src/extensionManager.ts`

```
import * as vscode from 'vscode';
import { CentralizedLoggingService } from './logging/centralizedLoggingService';
// ... other imports

export class ExtensionManager {
    private loggingService: CentralizedLoggingService;
    // ... other services

    constructor(context: vscode.ExtensionContext) {
        // Instantiate the logger first, as other services will need it
        this.loggingService = new CentralizedLoggingService();
        
        // Pass the logger instance to other services via their constructors
        this.indexingService = new IndexingService(this.loggingService, /* ... other deps */);
        this.contextService = new ContextService(this.loggingService, /* ... other deps */);
        // ... and so on for all other services

        this.disposables.push(this.loggingService);
    }
    
    // ...
}
```

##### **4\. Refactor Existing `console.log` Calls**

Now, systematically replace all `console.*` calls with the new service. This is a crucial step for centralization.

**Example Refactor in `IndexingService.ts`:**

**Before:**

```
// src/indexing/indexingService.ts
export class IndexingService {
    public async startIndexing() {
        console.log("Starting the indexing process...");
        try {
            // ... logic ...
            console.log("Indexing complete.");
        } catch (e) {
            console.error("Indexing failed", e);
        }
    }
}
```

**After:**

```
// src/indexing/indexingService.ts
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

export class IndexingService {
    private logger: CentralizedLoggingService;

    constructor(logger: CentralizedLoggingService, /* ... */) {
        this.logger = logger;
    }

    public async startIndexing() {
        this.logger.info("Starting the indexing process...");
        try {
            // ... logic ...
            this.logger.info("Indexing complete.");
        } catch (e) {
            this.logger.error("Indexing failed", e);
        }
    }
}
```

#### **Verification Plan**

1. **Check Output Channel**: After launching the extension, open the Command Palette (`Ctrl+Shift+P`) and run "View: Toggle Output". Select "Code Context Engine" from the dropdown. Verify you see the `[INFO] Log level set to: Info` message.
    
2. **Test Log Levels**:
    
    - Go to VS Code Settings (`Ctrl+,`), search for "code-context-engine.logging.level".
        
    - Set the level to "Debug". Reload the extension. Verify that you now see `[DEBUG]` level messages in the output channel that were previously hidden.
        
    - Set the level to "Error". Reload. Verify you only see `[ERROR]` messages.
        
3. **Trigger an Error**: Manually trigger an action that is known to cause an error (e.g., try to index with an invalid database connection). Verify that a detailed error message, including the stack trace, is logged to the output channel.
    
4. **Code Review**: Do a final search for `console.log`, `console.warn`, and `console.error` in your `src` directory to ensure all instances have been replaced.