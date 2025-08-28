<prd>### PRD 1: Foundational - Centralized Logging & Notifications

**1\. Title & Overview**

- **Project:** Code Context Engine - Centralized Logging & Notifications
    
- **Summary:** This foundational phase focuses on implementing a robust, centralized logging service and a standardized user notification system. The goal is to capture all application events, errors, and warnings in a single, accessible location (a dedicated VS Code Output Channel and log files) and to present user-facing errors in a consistent, helpful manner. This will replace all scattered `console.log` and direct `vscode.window.showErrorMessage` calls.
    
- **Dependencies:** This project will modify most existing services (`IndexingService`, `ContextService`, `MessageRouter`, etc.) to integrate with the new logging and notification services.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Drastically reduce the time required to diagnose user-reported issues.
        
    - Improve user trust by providing clear, actionable error messages.
        
    - Establish a stable foundation for future monitoring and diagnostics features.
        
- **Developer & System Success Metrics:**
    
    - All backend service logs (info, warn, error) are successfully routed to a single "Code Context Engine" Output Channel.
        
    - Critical errors are automatically written to a log file in the workspace's `.vscode` directory.
        
    - All user-facing error messages are displayed through the new `NotificationService` and include a "View Logs" button.
        
    - The extension's log level can be controlled via a new setting in `package.json`.
        

**3\. User Personas**

- **Alisha (Backend Developer):** When a user reports a bug, Alisha currently has no centralized place to look for logs. She needs a single Output Channel and persistent log files to trace the execution flow and identify the root cause of an error quickly.
    
- **Devin (Developer - End User):** When an operation like indexing fails, Devin sees a generic error message with no context. He needs a clear notification that tells him what went wrong and gives him an easy way to access detailed logs to either fix the issue himself or report it effectively.
    

**4\. Requirements Breakdown**

| 
Phase

 | 

Sprint

 | 

User Story

 | 

Acceptance Criteria

 | 

Duration

 |
| --- | --- | --- | --- | --- |
| 

**Phase 1: Foundation**

 | 

**Sprint 1: Centralized Logging Service**

 | 

As Alisha, I want a `CentralizedLoggingService` so that all backend logs are routed to a single, consistent location.

 | 

1\. A new `CentralizedLoggingService.ts` is created. <br> 2. The service creates a dedicated "Code Context Engine" Output Channel in VS Code. <br> 3. The service provides methods for different log levels (`info`, `warn`, `error`, `debug`). <br> 4. All existing `console.log` and `console.error` calls in the backend are replaced with calls to the new service. <br> 5. A new setting in `package.json` allows users to control the log verbosity (e.g., "Info", "Debug").

 | 

**2 Weeks**

 |
| 

**Phase 1: Foundation**

 | 

**Sprint 2: User Notification Service**

 | 

As Devin, I want to receive clear, consistent, and actionable error notifications so that I can understand and resolve problems.

 | 

1\. A new `NotificationService.ts` is created. <br> 2. The service provides standardized methods for showing info, warning, and error messages. <br> 3. The `showError` method automatically includes a "View Logs" action button. <br> 4. Clicking "View Logs" opens the "Code Context Engine" Output Channel. <br> 5. All direct `vscode.window.show...Message` calls are replaced with calls to the new service.

 | 

**2 Weeks**

 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 4 Weeks
    
- **Sprint 1:** Centralized Logging Service (2 Weeks)
    
- **Sprint 2:** User Notification Service (2 Weeks)
    

**6\. Risks & Assumptions**

- **Assumption:** The performance impact of routing all logs through a central service will be negligible.
    
- **Risk:** Improperly replacing existing logging calls could lead to loss of important debug information.
    
    - **Mitigation:** Conduct a thorough search-and-replace across the entire codebase. Initially set the default log level to "Debug" to ensure no information is lost during the transition.
        
- **Risk:** Writing log files to the workspace could be problematic in restricted environments or conflict with workspace settings.
    
    - **Mitigation:** The log file path will be configurable. The feature will gracefully handle file-writing errors by falling back to only using the Output Channel.
    
    
    
    ### Sub-Sprint 1: Implement Centralized Logging Service

**Objective:** To create the `CentralizedLoggingService`, integrate it into the `ExtensionManager`, and replace all existing `console.log` calls with the new service.

**Parent Sprint:** PRD 1, Sprint 1: Centralized Logging Service

**Tasks:**

1. **Create `CentralizedLoggingService.ts`:** Develop the new class with a constructor that creates a `vscode.OutputChannel`.
    
2. **Implement Log Levels:** Create public methods (`info`, `warn`, `error`, `debug`) that format messages with a timestamp and log level before writing to the output channel.
    
3. **Add Log Level Setting:** In `package.json`, add a new configuration property `code-context-engine.logging.level` with an `enum` for the different levels.
    
4. **Read Log Level:** The `CentralizedLoggingService` should read this setting to determine which log messages to display.
    
5. **Integrate with `ExtensionManager`:** Instantiate the `CentralizedLoggingService` in the `ExtensionManager` and pass its instance to all other services that require logging.
    
6. **Refactor Existing Logs:** Systematically search the codebase for `console.log`, `console.warn`, and `console.error` and replace them with calls to the new logging service.
    

**Acceptance Criteria:**

- Logs from all backend services appear in the "Code Context Engine" Output Channel.
    
- Changing the log level in the settings correctly filters the visible logs.
    
- No `console.log` calls remain in the extension's backend TypeScript files.
    

**Dependencies:**

- A functional `ExtensionManager` for service instantiation.
    

**Timeline:**

- **Start Date:** 2025-08-27
    
- **End Date:** 2025-09-02
    

### Sub-Sprint 2: Implement User Notification Service

**Objective:** To create a standardized `NotificationService` for displaying user-facing messages and refactor all existing notifications to use it.

**Parent Sprint:** PRD 1, Sprint 2: User Notification Service

**Tasks:**

1. **Create `NotificationService.ts`:** Develop the new class. It should depend on the `CentralizedLoggingService` to automatically log any message it displays.
    
2. **Implement Notification Methods:** Create public methods like `showInfo`, `showWarning`, and `showError` that wrap the corresponding `vscode.window.show...Message` functions.
    
3. **Add "View Logs" Action:** The `showError` method must be implemented to always include a "View Logs" action item in the notification.
    
4. **Implement Action Handler:** When the "View Logs" button is clicked, the service should call the `show()` method on the `CentralizedLoggingService`'s output channel.
    
5. **Integrate with `ExtensionManager`:** Instantiate the `NotificationService` in the `ExtensionManager` and pass its instance to any service that needs to show notifications.
    
6. **Refactor Existing Notifications:** Systematically search the codebase for `vscode.window.show...Message` and replace these calls with the new `NotificationService`.
    

**Acceptance Criteria:**

- All user-facing notifications are displayed via the `NotificationService`.
    
- All error notifications consistently display a "View Logs" button.
    
- Clicking the "View Logs" button successfully opens the correct Output Channel.
    

**Dependencies:**

- Sub-Sprint 1 must be complete.
    

**Timeline:**

- **Start Date:** 2025-09-03
    
- **End Date:** 2025-09-09</prd>