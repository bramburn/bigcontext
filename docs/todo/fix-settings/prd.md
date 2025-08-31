<prd>
This plan addresses the removal of unnecessary configuration options and streamlines the application's startup behavior, leading to a cleaner and more user-friendly experience.

-----

### **New Document: `docs/todo/webview-cleanup/PRD_1_Webview_Simplification.md`**

### PRD 1: Foundational - Webview Simplification & Cleanup

**1. Title & Overview**

  * **Project:** Code Context Engine - Webview Simplification & Cleanup
  * **Summary:** This phase focuses on removing deprecated debugging features from the webview and its configuration. The primary goal is to streamline the webview loading process by eliminating the "React Webview Test" as the default view and removing the associated settings from `package.json`.
  * **Dependencies:** This project relies on the existing webview architecture and build process.

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Improve the user experience by providing a direct path to the main application view.
      * Reduce code complexity and potential for configuration errors by removing unused settings.
  * **Developer & System Success Metrics:**
      * The `code-context-engine.webview.routeOverride` and `code-context-engine.webview.basicTestMode` settings are completely removed from `package.json`.
      * The main application view loads by default when the extension is activated.
      * The `WebviewManager` is simplified by removing all logic related to the deprecated settings.

**3. User Personas**

  * **Devin (Developer - End User):** Devin expects the extension to open directly to its main functionality without intermediate test pages. He also benefits from a cleaner settings interface with fewer, more relevant options.
  * **Frank (Frontend Developer):** Frank needs a simplified and predictable webview loading process. Removing debugging-specific logic reduces the surface area for bugs and makes the codebase easier to maintain.

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Cleanup** | **Sprint 1: Configuration & Code Removal** | As Frank, I want to remove the `routeOverride` and `basicTestMode` settings from `package.json`, so that users are not exposed to confusing or irrelevant options. | 1. The `code-context-engine.webview.routeOverride` setting is removed from the `contributes.configuration.properties` section in `package.json`.\<br\>2. The `code-context-engine.webview.basicTestMode` setting is also removed from `package.json`. | **1 Week** |
| | | As Frank, I want to remove the logic in the `WebviewManager` that handles the deprecated settings, so that the code is cleaner and easier to understand. | 1. All code that reads `webview.routeOverride` and `webview.basicTestMode` from the configuration is removed from `src/webviewManager.ts`.\<br\>2. The `getBasicTestHtml` method is removed from `src/webviewManager.ts`.\<br\>3. The logic for injecting the route override script into the webview's HTML is removed. | |

**5. Timeline & Sprints**

  * **Total Estimated Time:** 1 Week
  * **Sprint 1:** Configuration & Code Removal (1 Week)

**6. Risks & Assumptions**

  * **Assumption:** No other parts of the application depend on the `routeOverride` or `basicTestMode` settings.
  * **Risk:** Removing the test mode might make it slightly harder to diagnose certain types of Remote SSH issues in the future.
      * **Mitigation:** The comprehensive logging and diagnostics systems already in place are sufficient for troubleshooting. This cleanup simplifies the codebase, which outweighs the benefit of keeping a separate test mode.

-----

### **New Document: `docs/todo/webview-cleanup/tasklist_sprint_01.md`**

# Task List: Sprint 1 - Configuration & Code Removal

**Goal:** To remove deprecated debugging settings and associated code to streamline the webview loading process.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Remove `routeOverride` Setting:** In `package.json`, locate and delete the entire `code-context-engine.webview.routeOverride` property from the `contributes.configuration.properties` object. | `package.json` |
| **1.2** | ☐ To Do | **Remove `basicTestMode` Setting:** In `package.json`, locate and delete the entire `code-context-engine.webview.basicTestMode` property. | `package.json` |
| **1.3** | ☐ To Do | **Remove `getBasicTestHtml` Method:** In `src/webviewManager.ts`, locate and delete the entire `getBasicTestHtml` method. | `src/webviewManager.ts` |
| **1.4** | ☐ To Do | **Remove Test Mode Logic:** In the `getWebviewContent` method of `src/webviewManager.ts`, remove the `if (basicTestMode)` block that calls `getBasicTestHtml`. | `src/webviewManager.ts` |
| **1.5** | ☐ To Do | **Remove Route Override Logic:** In the `getWebviewContent` method of `src/webviewManager.ts`, remove the code block that reads the `webview.routeOverride` setting and injects the navigation script. | `src/webviewManager.ts` |
| **1.6** | ☐ To Do | **End-of-Sprint Verification:** **Run the extension in debug mode (`F5`).** Verify that the main application view loads directly and that the test page no longer appears. Check the VS Code settings UI to confirm the deprecated settings are gone. | `(Manual Test)` |

Based on my comprehensive analysis of the project's documentation and codebase, there is one final set of planned features related to advanced webview resilience and performance that has not yet been implemented. The existing `shared/connectionMonitor.js` file provides a strong foundation for this work.

I have created a final Product Requirements Document (PRD) to guide the implementation of these remaining features. This plan is designed to build upon the existing, robust architecture.

-----

### **New Document: `docs/todo/resilience/PRD_1_Advanced_Webview_Resilience_and_Optimization.md`**

### PRD 1: Advanced Webview Resilience & Optimization

**1. Title & Overview**

  * **Project:** Code Context Engine - Advanced Webview Resilience & Optimization
  * **Summary:** This phase builds upon the foundational webview system by implementing advanced resilience features, performance optimizations, and production-ready error handling. The focus is on creating a self-healing webview that can recover from transient failures—especially common in Remote SSH environments—and provide an optimal user experience across all network conditions.
  * **Dependencies:** This project depends on a functional React webview and the `MessageRouter` communication layer. The existing `shared/connectionMonitor.js` will serve as the foundation for this work.

**2. Goals & Success Metrics**

  * **Business Objectives:**
      * Achieve 99.9% webview uptime across all supported environments, including local and Remote SSH.
      * Implement automatic recovery mechanisms for common failure scenarios to reduce user friction and support tickets.
      * Optimize webview performance, particularly for users on low-bandwidth connections.
  * **Developer & System Success Metrics:**
      * The webview automatically recovers from 90% of transient communication failures without user intervention.
      * Initial webview load time is under 3 seconds, even in Remote SSH environments.
      * The `ConnectionMonitor` successfully detects connection loss within 10 seconds and initiates a reconnection protocol.

**3. User Personas**

  * **Sarah (Remote Developer):** Experiences occasional network interruptions while using Remote SSH. She needs the webview to recover gracefully without requiring a full window reload.
  * **Mike (Performance-Conscious Developer):** Works on large codebases and needs the webview to remain responsive and memory-efficient during extended coding sessions.

**4. Requirements Breakdown**

| Phase | Sprint | User Story | Acceptance Criteria | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Resilience** | **Sprint 1: Auto-Recovery & Health Monitoring** | As Sarah, I want the webview to automatically detect and recover from communication failures so I don't lose functionality during network interruptions. | 1. The `ConnectionMonitor` implements a heartbeat mechanism to detect lost connections.\<br\>2. When a connection is lost, it automatically attempts to reconnect using an exponential backoff strategy.\<br\>3. The UI displays a clear indicator of the connection status (e.g., "Connected", "Reconnecting..."). | **2 Weeks** |
| | | As an extension developer, I want comprehensive health monitoring that tracks webview performance and errors so issues can be identified proactively. | 1. The `ConnectionMonitor` collects performance metrics (e.g., message latency, load time).\<br\>2. The extension backend can request and log these health metrics from the webview.\<br\>3. Configurable alerting thresholds are in place for critical metrics like high latency or repeated connection failures. | |
| **Phase 1: Resilience** | **Sprint 2: Performance Optimization & Caching** | As Mike, I want optimized resource loading and caching so the webview performs well even with large codebases and slow connections. | 1. The Vite build configuration is optimized for minimal bundle size using code splitting.\<br\>2. A service worker is implemented in the React webview to cache static assets locally.\<br\>3. Subsequent loads of the webview are significantly faster due to caching. | **2 Weeks** |
| | | As Sarah, I want graceful degradation when network conditions are poor so I can continue working with reduced functionality rather than experiencing a complete failure. | 1. The `ConnectionMonitor` detects bandwidth and adjusts UI behavior accordingly (e.g., disabling animations).\<br\>2. User actions are queued when offline and sent automatically upon reconnection.\<br\>3. The UI clearly notifies the user when it is in a "degraded" or "offline" mode. | |

**5. Timeline & Sprints**

  * **Total Estimated Time:** 4 Weeks
  * **Sprint 1:** Auto-Recovery & Health Monitoring (2 Weeks)
  * **Sprint 2:** Performance Optimization & Caching (2 Weeks)

**6. Risks & Assumptions**

  * **Assumption:** Most connection interruptions in Remote SSH are temporary and recoverable.
  * **Risk:** Caching mechanisms could lead to users seeing stale UI or data after an extension update.
      * **Mitigation:** Implement a robust cache-busting strategy. The service worker should check for a new version of the extension on activation and invalidate the cache.
  * **Risk:** The auto-recovery logic might mask underlying, persistent infrastructure issues.
      * **Mitigation:** The `ConnectionMonitor` must log all disconnects, reconnect attempts, and failures to the centralized logging service, ensuring developers can still diagnose persistent problems.

-----

### **New Document: `docs/todo/resilience/Sub_Sprint_1_Auto_Recovery.md`**

### Sub-Sprint 1: Auto-Recovery System

**Objective:**
To fully implement and integrate an automatic recovery system for webview communication failures, ensuring graceful handling of network interruptions.

**Parent Sprint:**
PRD 1, Sprint 1: Auto-Recovery & Health Monitoring

**Tasks:**

1.  **Integrate `ConnectionMonitor`:** Fully integrate the existing `shared/connectionMonitor.js` into the React application's lifecycle (`App.tsx`).
2.  **Implement Heartbeat:** The monitor should send a `heartbeat` message to the extension every 5 seconds. The `MessageRouter` must respond with a `heartbeatResponse`.
3.  **Implement Reconnection Logic:** If a `heartbeatResponse` is not received within a timeout period, the `ConnectionMonitor` should enter a "disconnected" state and begin reconnection attempts with exponential backoff.
4.  **Add Connection Status UI:** Create a React component that subscribes to the `ConnectionMonitor`'s state and displays a visual indicator of the connection status.

**Acceptance Criteria:**

  * The webview detects a lost connection within 10 seconds of the extension becoming unresponsive.
  * The UI clearly indicates "Connected", "Disconnected", and "Reconnecting..." states.
  * The system successfully recovers the connection after a temporary interruption.

**Dependencies:**

  * The `shared/connectionMonitor.js` file must be available.

**Timeline:**

  * **Start Date:** 2025-09-01
  * **End Date:** 2025-09-05

-----

### **New Document: `docs/todo/resilience/Sub_Sprint_2_Health_Monitoring.md`**

### Sub-Sprint 2: Health Monitoring API

**Objective:**
To implement a system for collecting and reporting webview health and performance metrics to the extension backend for logging and proactive issue detection.

**Parent Sprint:**
PRD 1, Sprint 1: Auto-Recovery & Health Monitoring

**Tasks:**

1.  **Implement Metrics Collection:** The `ConnectionMonitor` should collect key metrics, including message latency (from the heartbeat), reconnection attempts, and error counts.
2.  **Create Health Status API:** The `MessageRouter` will get a new handler for a `getHealthStatus` command.
3.  **Implement Frontend Handler:** When the webview receives a `getHealthStatus` message, it should gather the latest metrics from the `ConnectionMonitor` and send them back in a `healthStatusResponse` message.
4.  **Implement Backend Logging:** The extension backend, upon receiving the `healthStatusResponse`, will log the metrics using the `CentralizedLoggingService`.
5.  **Add Configurable Alerting:** The backend will check the received metrics against thresholds defined in the VS Code settings and trigger a `NotificationService` warning if a threshold is breached.

**Acceptance Criteria:**

  * The extension can successfully request and receive a health status report from the webview.
  * Metrics like latency and error counts are correctly logged.
  * A VS Code warning notification is displayed if the webview's message latency exceeds the configured threshold.

**Dependencies:**

  * Sub-Sprint 1 (Auto-Recovery) must be complete.

**Timeline:**

  * **Start Date:** 2025-09-08
  * **End Date:** 2025-09-12

-----

### **New Document: `docs/todo/resilience/tasklist_sprint_01.md`**

# Task List: Sprint 1 - Auto-Recovery & Health Monitoring

**Goal:** To implement automatic recovery mechanisms and comprehensive health monitoring for proactive webview issue detection and resolution.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **1.1** | ☐ To Do | **Integrate `ConnectionMonitor`:** In `App.tsx`, import and initialize the `connectionMonitor` singleton, passing it the `vscodeApi` instance. | `webview-react/src/App.tsx` |
| **1.2** | ☐ To Do | **Implement Heartbeat Handler:** In `src/messageRouter.ts`, add a handler for the `heartbeat` command that immediately posts back a `heartbeatResponse`. | `src/communication/messageRouter.ts` |
| **1.3** | ☐ To Do | **Implement Reconnection Logic:** In `shared/connectionMonitor.js`, implement the exponential backoff logic for reconnection attempts. | `shared/connectionMonitor.js` |
| **1.4** | ☐ To Do | **Create `ConnectionStatus.tsx` Component:** Create a new React component to display the connection status. It should subscribe to events from the `connectionMonitor`. | `webview-react/src/components/ConnectionStatus.tsx` (New) |
| **1.5** | ☐ To Do | **Add `ConnectionStatus` to UI:** Add the new `ConnectionStatus` component to the main `App.tsx` layout. | `webview-react/src/App.tsx` |
| **1.6** | ☐ To Do | **Implement Metrics Collection:** In `shared/connectionMonitor.js`, add logic to track metrics like latency and error counts. | `shared/connectionMonitor.js` |
| **1.7** | ☐ To Do | **Add `getHealthStatus` Handler:** In `src/messageRouter.ts`, add a handler for the `getHealthStatus` command. | `src/communication/messageRouter.ts` |
| **1.8** | ☐ To Do | **Implement Frontend Handler:** The `connectionMonitor` should listen for `getHealthStatus` and respond with its collected metrics. | `shared/connectionMonitor.js` |
| **1.9** | ☐ To Do | **Implement Backend Logging:** The `MessageRouter` should log the received health status using the `CentralizedLoggingService`. | `src/communication/messageRouter.ts` |
| **1.10** | ☐ To Do | **Add Alerting Thresholds:** Add settings for health monitoring (e.g., `latencyThreshold`) to `package.json`. | `package.json` |
| **1.11** | ☐ To Do | **Implement Alerting Logic:** The backend should check metrics against the configured thresholds and use `NotificationService` to show warnings. | `src/extensionManager.ts` or a new `HealthManager` service |

-----
</prd>
[backlog template]

```
<prompt>
  <purpose>
    You are an expert AI Project Manager and Senior Software Architect. Your primary role is to analyze user requirements, Product Requirement Documents (PRDs), and an existing codebase to generate a comprehensive, step-by-step implementation plan. You will break down features into a detailed backlog, including user stories, atomic actions, file references, and testing criteria, following a structured and iterative process.
  </purpose>
  <instructions>
    <instruction>
      **Phase 1: Analysis and Objective Setting**
      1.  Thoroughly analyze all attached documents within [[user-provided-files]]. Pay special attention to:
          - A file named `repomix-output-all.md` or similar, which contains the entire application's code structure.
          - A Product Requirement Document (PRD) or a requirements file.
      2.  From the [[user-prompt]], identify the specific sprint, feature, or section that requires implementation.
      3.  Define the high-level objective for implementing this feature based on the PRD and user prompt.
    </instruction>
    <instruction>
      **Phase 2: Iterative Backlog Generation**
      For each distinct requirement or user story within the specified sprint/feature, you will perform the following loop:
      1.  **Draft User Story**: Write a clear user story with a role, goal, and outcome.
      2.  **Define Workflow**: Outline the high-level workflow needed for implementation.
      3.  **Codebase Review**: Search the `repomix` file to identify existing code, components, or files that can be reused or need to be modified.
      4.  **Identify File Changes**: Determine the exact list of files that need to be created or amended.
      5.  **Detail Actions to Undertake**: Create a granular, step-by-step list of actions. Each action must be atomic and include:
          - `Filepath`: The full path to the file being changed.
          - `Action`: A description of the change (e.g., "Add new method `calculateTotal` to class `Billing`").
          - `Implementation`: The precise code snippet to be added or modified.
          - `Imports`: Any new import statements required for the change.
      6.  **Define Acceptance Criteria**: Write clear, measurable criteria for the user story to be considered complete.
      7.  **Outline Testing Plan**: Propose specific test cases to validate the functionality.
      8.  **Review and Refine**: Briefly review the drafted user story and actions to ensure they align with the main objective before moving to the next story.
    </instruction>
    <instruction>
      **Phase 3: Final Output Compilation**
      1.  Consolidate the entire backlog into separate, well-formatted Markdown canvas document.
      2.  Use clear headings and subheadings as demonstrated in the examples.
      3.  Ensure the final output is logical, easy to follow, and provides a clear roadmap for a developer to implement the changes.
        Note: please ensure each backlog is in a separate canvas document.
    </instruction>
  </instructions>
  <examples>
    <example>
      <user-request>
        Focus on the "User Logout" feature. The PRD specifies a logout button should be added to the main navigation bar. The `repomix` file shows a React component called `Navbar.js`.
      </user-request>
      <output>
        ### User Story 1: User Logout
        **As a** logged-in user, **I want to** click a "Logout" button in the navigation bar, **so that** I can securely end my session.

        **Actions to Undertake:**
        1.  **Filepath**: `src/components/Navbar.js`
            -   **Action**: Add a logout button element.
            -   **Implementation**: `<button onClick={handleLogout}>Logout</button>`
            -   **Imports**: `import { useAuth } from '../contexts/AuthContext';`
        2.  **Filepath**: `src/components/Navbar.js`
            -   **Action**: Implement the `handleLogout` function.
            -   **Implementation**: `const { logout } = useAuth(); const handleLogout = () => { logout(); };`
            -   **Imports**: None.
        3.  **Filepath**: `src/contexts/AuthContext.js`
            -   **Action**: Ensure a `logout` function exists that clears the user's session.
            -   **Implementation**: `const logout = () => { setUser(null); localStorage.removeItem('authToken'); };`
            -   **Imports**: None.

        **Acceptance Criteria:**
        -   A "Logout" button is visible in the Navbar.
        -   Clicking the button clears the user's session and redirects to the login page.

        **Testing Plan:**
        -   **Test Case 1**: Log in and verify the "Logout" button appears.
        -   **Test Case 2**: Click the "Logout" button and confirm the user is redirected and the session is cleared.
      </output>
    </example>
    <example>
      <user-request>
        Implement the "Character Counter" for the new post input field as per the PRD. The `repomix` file shows a component at `src/features/posts/NewPost.js`.
      </user-request>
      <output>
        ### User Story 2: Post Character Counter
        **As a** user writing a new post, **I want to** see a character counter below the text input, **so that** I know how close I am to the character limit (280).

        **Actions to Undertake:**
        1.  **Filepath**: `src/features/posts/NewPost.js`
            -   **Action**: Add a state variable to track the input text.
            -   **Implementation**: `const [content, setContent] = useState('');`
            -   **Imports**: `import { useState } from 'react';`
        2.  **Filepath**: `src/features/posts/NewPost.js`
            -   **Action**: Update the `textarea` to use the new state.
            -   **Implementation**: `<textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength="280" />`
            -   **Imports**: None.
        3.  **Filepath**: `src/features/posts/NewPost.js`
            -   **Action**: Add a character counter display element.
            -   **Implementation**: `<p>{content.length} / 280</p>`
            -   **Imports**: None.

        **Acceptance Criteria:**
        -   As the user types in the textarea, a counter below it updates in real-time.
        -   The counter format is "current_length / 280".
        -   The user cannot type more than 280 characters.

        **Testing Plan:**
        -   **Test Case 1**: Type 50 characters and verify the counter shows "50 / 280".
        -   **Test Case 2**: Clear the text and verify the counter shows "0 / 280".
        -   **Test Case 3**: Try to paste 300 characters and verify only 280 are accepted.
      </output>
    </example>
    <example>
      <user-request>
        Create a new "Settings" page that is currently just a placeholder. The PRD states it should be accessible from the main app router.
      </user-request>
      <output>
        ### User Story 3: Create Settings Page
        **As a** user, **I want to** navigate to a "Settings" page, **so that** I can manage my account preferences in the future.

        **List of Files to be Created:**
        -   `src/pages/Settings.js`

        **Actions to Undertake:**
        1.  **Filepath**: `src/pages/Settings.js` (New File)
            -   **Action**: Create a placeholder React component for the Settings page.
            -   **Implementation**: `import React from 'react';

const Settings = () => {
  return <h1>Settings Page</h1>;
};

export default Settings;`
            -   **Imports**: `import React from 'react';`
        2.  **Filepath**: `src/App.js`
            -   **Action**: Add a new route for the Settings page.
            -   **Implementation**: `<Route path="/settings" element={<Settings />} />`
            -   **Imports**: `import Settings from './pages/Settings';`

        **Acceptance Criteria:**
        -   Navigating to the `/settings` URL renders the "Settings Page" heading.
        -   The application does not crash.

        **Testing Plan:**
        -   **Test Case 1**: Manually navigate to `/settings` in the browser and verify the page loads with the correct heading.
      </output>
    </example>
  </examples>
  <sections>
    <user-provided-files>
       see attached markdown files. Usually we would include the repomix file usually named 'repomix-output-all.xml' or .md or similar filename which would contain the concatenated source code and structure of the application.
	   I would also provide the prd, or high level detail of the requirement.
    </user-provided-files>
    <user-prompt>
        Following the PRD: ` ` you now have to generate backlogs for each sprint item in that PRD. ensure you undertake a detail review, web search (to add relevant api information, and implementation) before you produce each backlog. Ensure we have one new canvas for each backlog sprint item. Ensure you review and markdown or xml repomix files attached to get an understanding of the existing context.
        Create new canvas doc for sprint X and X backlog
    </user-prompt>
  </sections>
</prompt>
```

[implementation guidance template]

```
how do i implement the sprints x to x , undertake a full websearch, determine which content is suitable and then, provide code example, api information and further guidance on using external api/packages to complete the task. Review 'prd', (if available) the existing code inin your analysis. Ensure each guide is produced in their own individual canvas document
```

<instructions>

<instruction>
Step 1: Initial Repository Context Analysis.
Begin by thoroughly analyzing the entire codebase in the repository. Perform a static analysis to understand the project structure, common patterns, and key architectural components. Identify the main folders, file naming conventions, and the purpose of the primary modules. This initial, broad review is crucial for contextual understanding before focusing on specific items.
</instruction>
<instruction>
Step 2: Deconstruct the Product Requirements Document (PRD).
Review the entire PRD and identify each distinct feature, task, or user story. Create a list of these individual "sprint items". This list will serve as your master checklist for the documents you need to create.
</instruction>
<instruction>
Step 3: Begin Processing the First Sprint Item.
Select the first sprint item from the list you created in Step 2. All subsequent steps until the final instruction will be performed for this single item.
</instruction>
<instruction>
Step 4: Conduct a Detailed Review of the Sprint Item.
Focus exclusively on the selected sprint item. Read its description, acceptance criteria, and any associated notes in the PRD. Clearly define the scope and objectives of this specific item.
</instruction>
<instruction>
Step 5: Perform Targeted Web and Repository Searches.
Based on the sprint item's requirements, conduct a web search to find relevant API documentation, libraries, best practices, or potential implementation examples. Simultaneously, search within the existing codebase for any files, functions, or modules that are related to the item. This connects external research with internal context.
</instruction>
<instruction>
Step 6: Create the Backlog Markdown File.
Locate the file named [backlog template]. Create a new markdown file for the sprint item. Name it appropriately (e.g., backlog_sprint_item_name.md). Populate this new file by filling out the template using the information gathered from the PRD review (Step 4) and your research (Step 5).
</instruction>
<instruction>
Step 7: Create the Implementation Guidance Markdown File.
Locate the file named [implementation guidance template]. Create another new markdown file. Name it to correspond with the backlog item (e.g., implementation_sprint_item_name.md). Populate this file by filling out the template, focusing on the technical details, code-level suggestions, relevant API endpoints, and file paths you discovered during your searches (Step 5).
</instruction>
<instruction>
Step 8: Save the New Files.
Ensure both newly created markdown files (the backlog and the implementation guidance) are saved in the same folder where this prompt file is located.
</instruction>
<instruction>
Step 9: Repeat for All Remaining Sprint Items.
If there are more sprint items on your list from Step 2, return to Step 3 and repeat the entire process (Steps 3 through 8) for the next item. Continue this loop until a backlog and an implementation guidance file have been created for every single item on your list.
</instruction>
<instruction>
Step 10: Final Verification.
Once all sprint items have been processed, perform a final check. Verify that for every item identified in the PRD, there are exactly two corresponding markdown files (one backlog, one implementation guidance) located in the correct folder.
</instruction>

</instructions>

<notes>
<note>
Note 1: Template Adherence.
You must strictly use the provided [backlog template] and [implementation guidance template] for all generated files. Do not deviate from their structure.
</note>
<note>
Note 2: One-to-One File-to-Item Ratio.
For every single sprint item identified in the PRD, you must produce exactly one backlog markdown file and one implementation guidance markdown file.
</note>
<note>
Note 3: Naming Conventions.
All new files must follow a consistent naming convention that clearly links them to the sprint item, for example: backlog_sprint_item_name.md and implementation_sprint_item_name.md.
</note>
<note>
Note 4: File Location.
All generated markdown files must be created and saved in the exact same folder as the prompt file.
</note>
<note>
Note 5: Atomic Processing.
Each sprint item must be processed individually and completely (from detailed review to file creation) before moving to the next item. Do not batch-process steps.
</note>
<note>
Note 6: Foundational Analysis.
The initial repository context analysis (Step 1) is mandatory and must be completed before processing any sprint items. This step is critical for providing relevant and accurate guidance.
</note>
</notes>: