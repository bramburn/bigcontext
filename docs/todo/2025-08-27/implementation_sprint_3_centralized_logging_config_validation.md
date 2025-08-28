how do i implement the sprints 3 to 3 , undertake a full websearch, determine which content is suitable and then, provide code example, api information and further guidance on using external api/packages to complete the task. Review 'prd', (if available) the existing code inin your analysis. Ensure each guide is produced in their own individual canvas document

**Implementation Guidance for Sprint 3: Centralized Logging & Config Validation**

**Objective:** Implement a centralized logging service, standardize user notifications, and add robust configuration validation to improve debugging, user experience, and maintainability.

**Relevant Files:**
-   `src/loggingService.ts` (New file)
-   `src/notificationService.ts` (New file)
-   `src/validation/configurationValidator.ts` (New file)
-   `src/extensionManager.ts` (Will be modified to instantiate and use new services)
-   `src/configuration/configurationSchema.ts` (Will be modified for logging level setting)
-   Various existing files (`src/**/*.ts`) that currently use `console.log` or `vscode.window.showErrorMessage`.

**Web Search/API Information:**
-   **VS Code Extension API:**
    -   `vscode.window.createOutputChannel(name: string)`: Creates a new output channel in the VS Code Output panel.
    -   `vscode.OutputChannel.appendLine(value: string)`: Appends a line to the output channel.
    -   `vscode.window.showErrorMessage(message: string, ...items: string[])`: Displays an error message to the user with optional action buttons.
    -   `vscode.window.showWarningMessage(message: string)`: Displays a warning message.
    -   `vscode.window.showInformationMessage(message: string)`: Displays an information message.
    -   `vscode.languages.createDiagnosticCollection(name: string)`: Creates a collection for diagnostics (errors, warnings, info) that appear in the Problems panel.
    -   `vscode.Diagnostic`, `vscode.DiagnosticSeverity`, `vscode.Range`: Classes used to define diagnostic entries.
    -   `vscode.workspace.getConfiguration(section?: string)`: Retrieves configuration settings.
    -   `vscode.workspace.onDidChangeConfiguration`: Event to listen for configuration changes.
-   **JSON Schema Validation Library:**
    -   `ajv` (Another JSON Schema Validator): A popular and performant JavaScript library for validating JSON data against JSON Schema. Install via `npm install ajv` and `npm install --save-dev @types/ajv`.

**Guidance:**

1.  **Create `src/loggingService.ts`:**
    *   Define a `LoggingService` class. Its constructor should create a `vscode.OutputChannel` (e.g., named `"Code Context Engine Logs"`).
    *   Implement methods for different log levels: `trace()`, `debug()`, `info()`, `warn()`, `error()`, `fatal()`. Each method should format the message (e.g., with timestamp and log level) and append it to the `outputChannel`.
    *   Add logic to filter messages based on a configurable log level. This level should be read from VS Code settings (e.g., `codeContextEngine.logging.level`).
    *   Consider making this a singleton or providing it via dependency injection to ensure all parts of the extension use the same logging instance.

2.  **Create `src/notificationService.ts`:**
    *   Define a `NotificationService` class. It should take an instance of `LoggingService` in its constructor to log notifications internally.
    *   Implement methods like `showError(message: string, error?: any)`, `showWarning(message: string)`, and `showInformation(message: string)`.
    *   These methods should wrap the corresponding `vscode.window.show*Message` functions.
    *   For `showError`, include an optional action button (e.g., `"View Logs"`). If clicked, it should call `this.loggingService.outputChannel.show()` to reveal the logs.

3.  **Create `src/validation/configurationValidator.ts`:**
    *   Define a `ConfigurationValidator` class. Its constructor should initialize `ajv` and `vscode.languages.createDiagnosticCollection()` (e.g., named `"Code Context Engine"`). It should also take `LoggingService` as a dependency.
    *   Implement a method, e.g., `validateAndReport(configuration: any)`, that takes the extension's configuration object.
    *   Inside this method:
        *   Clear any existing diagnostics from the `diagnosticCollection`.
        *   Use `ajv.compile(configurationSchema)` to create a validator function for your extension's schema (`src/configuration/configurationSchema.ts`).
        *   Call the validator function with the `configuration` object.
        *   If validation fails (`!validate(configuration)`), iterate through `validate.errors`. For each error, create a `vscode.Diagnostic` object. Map the `error.instancePath` to a `vscode.Range` within the `settings.json` file (this can be complex; a simpler approach for initial implementation is to create a diagnostic for the entire file or a general range). Set the `severity` to `vscode.DiagnosticSeverity.Error`.
        *   Add these diagnostics to the `diagnosticCollection` using `diagnosticCollection.set(uri, diagnostics)`, where `uri` points to the `settings.json` file.
        *   Log validation errors using the `LoggingService`.
        *   If validation passes, log a success message.
    *   Implement a `dispose()` method to clean up the `diagnosticCollection`.

4.  **Modify `src/extensionManager.ts`:**
    *   In the `activate()` function (or constructor if using a class-based extension manager):
        *   Instantiate `LoggingService`, `NotificationService`, and `ConfigurationValidator`. Pass the `LoggingService` to the `NotificationService` and `ConfigurationValidator`.
        *   Retrieve the current extension configuration using `vscode.workspace.getConfiguration('yourExtensionId')`.
        *   Call `this.configurationValidator.validateAndReport(currentConfig)` to perform initial validation.
        *   Register a listener for `vscode.workspace.onDidChangeConfiguration`. If the change affects your extension's configuration, re-run the validation (`this.configurationValidator.validateAndReport(updatedConfig)`). Log this event.
        *   Ensure these services are passed to other components that need them (e.g., `SearchManager`, `StateManager`).
    *   In the `deactivate()` function (or `dispose()` method), call `this.configurationValidator.dispose()` and any other necessary cleanup for the new services.

5.  **Update `src/configuration/configurationSchema.ts`:**
    *   Add a new property, e.g., `"logging"`, to the root of your extension's configuration schema. Under `"logging"`, add a `"level"` property with `"type": "string"` and an `"enum"` of allowed log levels (`"off"`, `"error"`, `"warn"`, `"info"`, `"debug"`, `"trace"`). Set a `"default"` value (e.g., `"info"`).

6.  **Codebase Refactoring (Global Search & Replace):**
    *   **Logging:** Systematically go through all `.ts` files in `src/` and replace `console.log`, `console.warn`, `console.error` with calls to the `LoggingService` instance (e.g., `this.loggingService.info(...)`, `this.loggingService.error(...)`). Ensure the `LoggingService` instance is accessible (e.g., passed in constructors or via a global singleton pattern if appropriate for your architecture).
    *   **Notifications:** Similarly, replace direct calls to `vscode.window.showErrorMessage`, `vscode.window.showWarningMessage`, `vscode.window.showInformationMessage` with calls to the `NotificationService` instance (e.g., `this.notificationService.showError(...)`).

**Code Examples:**

**`src/loggingService.ts` (New File Content - Illustrative):**

```typescript
import * as vscode from 'vscode';

export class LoggingService {
    public readonly outputChannel: vscode.OutputChannel;
    private logLevel: vscode.LogLevel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Code Context Engine Logs');
        this.updateLogLevel();

        // Listen for configuration changes to update log level dynamically
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('codeContextEngine.logging.level')) {
                this.updateLogLevel();
            }
        });
    }

    private updateLogLevel() {
        const config = vscode.workspace.getConfiguration('codeContextEngine');
        const configuredLogLevel = config.get<string>('logging.level');
        switch (configuredLogLevel?.toLowerCase()) {
            case 'off': this.logLevel = vscode.LogLevel.Off; break;
            case 'error': this.logLevel = vscode.LogLevel.Error; break;
            case 'warn': this.logLevel = vscode.LogLevel.Warning; break;
            case 'info': this.logLevel = vscode.LogLevel.Info; break;
            case 'debug': this.logLevel = vscode.LogLevel.Debug; break;
            case 'trace': this.logLevel = vscode.LogLevel.Trace; break;
            default: this.logLevel = vscode.LogLevel.Info; // Default
        }
    }

    private log(level: vscode.LogLevel, message: string, ...args: any[]) {
        if (level >= this.logLevel) {
            const timestamp = new Date().toISOString();
            const levelStr = vscode.LogLevel[level].toUpperCase();
            this.outputChannel.appendLine(`[${timestamp}] [${levelStr}] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}`);
        }
    }

    public trace(message: string, ...args: any[]) { this.log(vscode.LogLevel.Trace, message, ...args); }
    public debug(message: string, ...args: any[]) { this.log(vscode.LogLevel.Debug, message, ...args); }
    public info(message: string, ...args: any[]) { this.log(vscode.LogLevel.Info, message, ...args); }
    public warn(message: string, ...args: any[]) { this.log(vscode.LogLevel.Warning, message, ...args); }
    public error(message: string, ...args: any[]) { this.log(vscode.LogLevel.Error, message, ...args); }
    public fatal(message: string, ...args: any[]) { this.log(vscode.LogLevel.Error, `FATAL: ${message}`, ...args); } // Fatal is often just a severe error
}
```

**`src/notificationService.ts` (New File Content - Illustrative):**

```typescript
import * as vscode from 'vscode';
import { LoggingService } from './loggingService';

export class NotificationService {
    private loggingService: LoggingService;

    constructor(loggingService: LoggingService) {
        this.loggingService = loggingService;
    }

    public async showError(message: string, error?: any): Promise<string | undefined> {
        this.loggingService.error(message, error);
        const viewLogsButton = 'View Logs';
        const result = await vscode.window.showErrorMessage(message, viewLogsButton);
        if (result === viewLogsButton) {
            this.loggingService.outputChannel.show();
        }
        return result;
    }

    public showWarning(message: string): Thenable<string | undefined> {
        this.loggingService.warn(message);
        return vscode.window.showWarningMessage(message);
    }

    public showInformation(message: string): Thenable<string | undefined> {
        this.loggingService.info(message);
        return vscode.window.showInformationMessage(message);
    }
}
```

**`src/validation/configurationValidator.ts` (New File Content - Illustrative):**

```typescript
import * as vscode from 'vscode';
import Ajv from 'ajv'; // npm install ajv
import { configurationSchema } from '../configuration/configurationSchema';
import { LoggingService } from '../loggingService';

export class ConfigurationValidator {
    private ajv: Ajv;
    private diagnosticCollection: vscode.DiagnosticCollection;
    private loggingService: LoggingService;

    constructor(loggingService: LoggingService) {
        this.ajv = new Ajv({ allErrors: true, verbose: true });
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('Code Context Engine');
        this.loggingService = loggingService;
    }

    public validateAndReport(configuration: any): void {
        this.diagnosticCollection.clear(); // Clear previous diagnostics

        const validate = this.ajv.compile(configurationSchema);
        const isValid = validate(configuration);

        if (!isValid && validate.errors) {
            this.loggingService.error('Configuration validation failed:', validate.errors);
            const diagnostics: vscode.Diagnostic[] = [];

            // In a real scenario, you'd try to find the exact range in settings.json
            // For simplicity, we'll create a diagnostic for the entire workspace or a general range
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            const uri = workspaceFolder ? vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'settings.json') : undefined;

            for (const error of validate.errors) {
                const path = error.instancePath.substring(1).replace(/olderg, '.'); // e.g., /search/queryExpansion -> search.queryExpansion
                const message = `Configuration Error: ${error.message} (Path: ${path})`;

                const range = new vscode.Range(0, 0, 0, 0); // Placeholder range, ideally map to actual line/column

                const diagnostic = new vscode.Diagnostic(
                    range,
                    message,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.code = 'CODE_CONTEXT_ENGINE_CONFIG_ERROR';
                diagnostic.source = 'Code Context Engine';
                diagnostics.push(diagnostic);
            }
            if (uri) {
                this.diagnosticCollection.set(uri, diagnostics);
            } else {
                // Fallback if no workspace folder or settings.json path can be determined
                this.loggingService.warn('Could not set diagnostics for settings.json. Displaying general error.');
                vscode.window.showErrorMessage('Invalid extension configuration. Check logs for details.');
            }
        } else {
            this.loggingService.info('Configuration validated successfully.');
        }
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}
```

**`src/extensionManager.ts` (Snippets - Illustrative):**

```typescript
import * as vscode from 'vscode';
import { LoggingService } from './loggingService';
import { NotificationService } from './notificationService';
import { ConfigurationValidator } from './validation/configurationValidator';
import { ConfigurationManager } from './configurationManager'; // Assuming this exists and handles reading config

export class ExtensionManager {
    private loggingService: LoggingService;
    private notificationService: NotificationService;
    private configurationValidator: ConfigurationValidator;
    private configurationManager: ConfigurationManager;

    constructor(context: vscode.ExtensionContext) {
        this.loggingService = new LoggingService();
        this.notificationService = new NotificationService(this.loggingService);
        this.configurationValidator = new ConfigurationValidator(this.loggingService);
        this.configurationManager = new ConfigurationManager(); // Initialize or inject as needed

        this.loggingService.info('Code Context Engine extension activating...');

        // Validate configuration on startup
        const currentConfig = vscode.workspace.getConfiguration('codeContextEngine'); // Get your extension's config
        this.configurationValidator.validateAndReport(currentConfig);

        // Listen for configuration changes
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('codeContextEngine')) {
                const updatedConfig = vscode.workspace.getConfiguration('codeContextEngine');
                this.configurationValidator.validateAndReport(updatedConfig);
                this.loggingService.info('Configuration updated and re-validated.');
            }
        }));

        // Example usage:
        this.notificationService.showInformation('Code Context Engine is active!');
        this.loggingService.debug('Debug messages are now enabled if log level is set to Debug.');

        // Register other services and commands, passing logging/notification services
        // ...
    }

    public dispose(): void {
        this.loggingService.info('Code Context Engine extension deactivating...');
        this.configurationValidator.dispose();
        this.loggingService.outputChannel.dispose(); // Dispose the output channel
        // Dispose other disposable resources
    }
}
```

**`src/configuration/configurationSchema.ts` (Snippet - Illustrative):**

```typescript
// ... existing schema definitions

export const configurationSchema = {
    "type": "object",
    "properties": {
        // ... existing properties
        "logging": {
            "type": "object",
            "properties": {
                "level": {
                    "type": "string",
                    "enum": ["off", "error", "warn", "info", "debug", "trace"],
                    "default": "info",
                    "description": "Controls the verbosity of extension logs. 'Off' disables logging."
                }
            },
            "description": "Settings related to extension logging."
        },
        // ... other top-level properties
    }
};
```