### User Story 3: Centralized Logging & Config Validation
**As a** developer, **I want to** a centralized logging service **so that** I can easily debug issues and monitor the health of all services from one location.
**As a** user, **I want to** receive a clear and consistent error notification when an operation fails, **so that** I can understand the problem.
**As a** user, **I want to** the extension to immediately inform me if my settings are invalid, **so that** I can correct them before an operation fails.

**Actions to Undertake:**
1.  **Filepath**: `src/loggingService.ts`
    -   **Action**: Create a new `LoggingService` class.
    -   **Implementation**: ```// Implement methods for different log levels (info, warn, error, debug, trace) that write to a VS Code Output Channel.```
    -   **Imports**: ```import * as vscode from 'vscode';```
2.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Instantiate `LoggingService` and pass its instance to other services that require logging.
    -   **Implementation**: ```// In the constructor, create a new LoggingService instance and make it available to other parts of the extension.```
    -   **Imports**: ```import { LoggingService } from './loggingService';```
3.  **Filepath**: Various files (e.g., `src/**/*.ts`)
    -   **Action**: Replace existing `console.log`, `console.warn`, `console.error` calls with `LoggingService` methods.
    -   **Implementation**: ```// Systematically replace direct console calls with calls to the injected LoggingService instance.```
    -   **Imports**: ```import { loggingService } from './loggingService'; // Or access via dependency injection.```
4.  **Filepath**: `src/configuration/configurationSchema.ts`
    -   **Action**: Add a setting to control the log level of the extension.
    -   **Implementation**: ```// Add a new property, e.g., 'logging.level', to the extension's configuration schema with enum values like 'off', 'error', 'warn', 'info', 'debug', 'trace'.```
    -   **Imports**: ```// No new imports needed.```
5.  **Filepath**: `src/notificationService.ts`
    -   **Action**: Create a new `NotificationService` class.
    -   **Implementation**: ```// Implement methods like showError, showWarning, showInformation that wrap vscode.window.show*Message calls. For showError, include an option to open the log output channel.```
    -   **Imports**: ```import * as vscode from 'vscode';
import { LoggingService } from './loggingService';```
6.  **Filepath**: Various files (e.g., `src/**/*.ts`)
    -   **Action**: Replace direct `vscode.window.showErrorMessage` calls with `NotificationService` methods.
    -   **Implementation**: ```// Replace direct calls with calls to the injected NotificationService instance.```
    -   **Imports**: ```import { notificationService } from './notificationService'; // Or access via dependency injection.```
7.  **Filepath**: `src/validation/configurationValidator.ts`
    -   **Action**: Create a new `ConfigurationValidator` class.
    -   **Implementation**: ```// This class will use a JSON Schema validator (e.g., Ajv) to validate the extension's configuration against `configurationSchema.ts`. It will create and manage VS Code Diagnostics.```
    -   **Imports**: ```import * as vscode from 'vscode';
import Ajv from 'ajv';
import { configurationSchema } from '../configuration/configurationSchema';
import { LoggingService } from '../loggingService';```
8.  **Filepath**: `src/extensionManager.ts`
    -   **Action**: Instantiate `ConfigurationValidator` on startup and run it to validate the current configuration. Display any errors in the VS Code Diagnostics View.
    -   **Implementation**: ```// In the constructor, create a ConfigurationValidator instance and call its validation method. Set up a listener for configuration changes to re-validate.```
    -   **Imports**: ```import { ConfigurationValidator } from './validation/configurationValidator';```

**List of Files to be Created:**
-   `src/loggingService.ts`
-   `src/notificationService.ts`
-   `src/validation/configurationValidator.ts`

**Acceptance Criteria:**
-   A new `LoggingService` is created and instantiated in the `ExtensionManager`.
-   It creates a dedicated VS Code Output Channel for logs.
-   It provides methods for different log levels (e.g., `log.info()`, `log.error()`).
-   All existing `console.log` calls are replaced with the new service.
-   A setting is added to control the log level.
-   A new `NotificationService` is created to standardize how user-facing errors are shown (`vscode.window.showErrorMessage`).
-   All `try/catch` blocks that interact with the user now call this service to display errors.
-   The service provides consistent formatting and can include a "View Logs" button that opens the Output Channel.
-   A `ConfigurationValidator` class is created that uses the `configurationSchema.ts` to validate the loaded settings.
-   The `ExtensionManager` runs this validator on startup.
-   Any validation errors are displayed in the Diagnostics View and logged.

**Testing Plan:**
-   **Test Case 1 (Logging):** Verify that logs appear in the dedicated VS Code Output Channel. Test different log levels (info, warn, error) and ensure only messages at or above the configured level are shown.
-   **Test Case 2 (Logging):** Verify that `console.log` calls are no longer used in the codebase.
-   **Test Case 3 (Notifications):** Trigger an error condition and verify that a consistent error notification appears, potentially with a "View Logs" button.
-   **Test Case 4 (Config Validation):** Modify `settings.json` with an invalid configuration value (e.g., wrong type, out of range) and verify that a clear error appears in the VS Code Diagnostics View and is logged.
-   **Test Case 5 (Config Validation):** Verify that valid configurations do not produce any validation errors.