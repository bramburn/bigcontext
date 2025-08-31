### tasklist\_sprint\_01.md

# Task List: Sprint 1 - Centralized Logging Service

**Goal:** To create a stable, centralized logging service and replace all `console.log` calls to ensure all backend logs are captured in one place.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**1.1**

 | 

☐ To Do

 | 

**Create `CentralizedLoggingService.ts`:** Create the new file and define the `CentralizedLoggingService` class.

 | 

`src/logging/centralizedLoggingService.ts` (New)

 |
| 

**1.2**

 | 

☐ To Do

 | 

**Create Output Channel:** In the service's constructor, call `vscode.window.createOutputChannel("Code Context Engine")` and store the instance.

 | 

`src/logging/centralizedLoggingService.ts`

 |
| 

**1.3**

 | 

☐ To Do

 | 

**Implement Logging Methods:** Create `info`, `warn`, `error`, and `debug` methods that format a message with a timestamp and level, then call `.appendLine()` on the output channel.

 | 

`src/logging/centralizedLoggingService.ts`

 |
| 

**1.4**

 | 

☐ To Do

 | 

**Add Log Level Setting:** In `package.json`, add the `code-context-engine.logging.level` configuration property with an `enum` of `["Error", "Warn", "Info", "Debug"]` and a default of `Info`.

 | 

`package.json`

 |
| 

**1.5**

 | 

☐ To Do

 | 

**Implement Log Level Filtering:** In the service, read the configured log level. In each logging method, add a check to ensure the message is only logged if its level is at or above the configured level.

 | 

`src/logging/centralizedLoggingService.ts`

 |
| 

**1.6**

 | 

☐ To Do

 | 

**Instantiate Service:** In `ExtensionManager.ts`, import and instantiate the `CentralizedLoggingService`. Pass the instance to the constructors of other services.

 | 

`src/extensionManager.ts`

 |
| 

**1.7**

 | 

☐ To Do

 | 

**Refactor `IndexingService` Logs:** Replace all `console.*` calls in `IndexingService.ts` with the appropriate `loggingService.*` method calls.

 | 

`src/indexing/indexingService.ts`

 |
| 

**1.8**

 | 

☐ To Do

 | 

**Refactor `ContextService` Logs:** Replace all `console.*` calls in `ContextService.ts` with the appropriate `loggingService.*` method calls.

 | 

`src/context/contextService.ts`

 |
| 

**1.9**

 | 

☐ To Do

 | 

**Refactor `MessageRouter` Logs:** Replace all `console.*` calls in `MessageRouter.ts` with the appropriate `loggingService.*` method calls.

 | 

`src/communication/messageRouter.ts`

 |
| 

**1.10**

 | 

☐ To Do

 | 

**Refactor All Other Backend Logs:** Perform a global search for `console.log`, `console.warn`, and `console.error` and replace all remaining instances in the backend.

 | 

`src/**/*.ts`

 |

### tasklist\_sprint\_02.md

# Task List: Sprint 2 - User Notification Service

**Goal:** To standardize user-facing notifications for a consistent and helpful user experience.

| 
Task ID

 | 

Status

 | 

Task Description (Sequential & Atomic Steps)

 | 

File(s) To Modify

 |
| --- | --- | --- | --- |
| 

**2.1**

 | 

☐ To Do

 | 

**Create `NotificationService.ts`:** Create the new file and define the `NotificationService` class. Its constructor should accept the `CentralizedLoggingService`.

 | 

`src/notifications/notificationService.ts` (New)

 |
| 

**2.2**

 | 

☐ To Do

 | 

**Implement `showInfo` and `showWarning`:** Create methods that wrap `vscode.window.showInformationMessage` and `showWarningMessage`. Each method should also log the message using the injected `loggingService`.

 | 

`src/notifications/notificationService.ts`

 |
| 

**2.3**

 | 

☐ To Do

 | 

**Implement `showError`:** Create the `showError` method. It must define a "View Logs" action button.

 | 

`src/notifications/notificationService.ts`

 |
| 

**2.4**

 | 

☐ To Do

 | 

**Implement "View Logs" Logic:** Inside `showError`, after calling `vscode.window.showErrorMessage`, check if the returned value is "View Logs". If it is, call `loggingService.showOutputChannel()`.

 | 

`src/notifications/notificationService.ts`

 |
| 

**2.5**

 | 

☐ To Do

 | 

**Instantiate Service:** In `ExtensionManager.ts`, import and instantiate the `NotificationService`, passing the `loggingService` instance to its constructor.

 | 

`src/extensionManager.ts`

 |
| 

**2.6**

 | 

☐ To Do

 | 

**Refactor Error Notifications:** Search the codebase for `vscode.window.showErrorMessage` and replace all instances with calls to `notificationService.showError`.

 | 

`src/**/*.ts`

 |
| 

**2.7**

 | 

☐ To Do

 | 

**Refactor Info/Warning Notifications:** Search and replace all `vscode.window.showInformationMessage` and `showWarningMessage` calls with the new service methods.

 | 

`src/**/*.ts`

 |
| 

**2.8**

 | 

☐ To Do

 | 

**Manual Test:** Trigger a known error condition in the extension and verify that the new standardized error notification appears with the "View Logs" button.

 | 

`(Manual Test)`

 |
| 

**2.9**

 | 

☐ To Do

 | 

**Manual Test:** Click the "View Logs" button and verify that the "Code Context Engine" Output Channel is opened and brought into focus.

 | 

`(Manual Test)`

 |