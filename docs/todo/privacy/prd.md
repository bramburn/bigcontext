PRD 15: Telemetry & Privacy Controls

1. Title & Overview

    Project: Code Context Engine - Telemetry & Privacy Controls

    Summary: To improve the product, we need to understand how it's used. This phase introduces a foundational, privacy-conscious Telemetry System to gather anonymous usage data (e.g., feature usage, performance timings). Crucially, this will be paired with clear Privacy Controls in the settings UI, allowing users to easily opt-out of data collection.

    Dependencies: Requires the SettingsView.tsx component.

2. Goals & Success Metrics

    Business Objectives:

        Gather anonymous product usage data to make informed decisions for future development.

        Build user trust by being transparent about data collection and providing easy opt-out controls.

    Developer & System Success Metrics:

        The system successfully logs anonymous events for key actions (e.g., search_performed, filter_applied).

        Disabling telemetry in the settings immediately stops all telemetry events from being sent.

        All telemetry data is verifiably anonymous (contains no personally identifiable information or code content).

3. User Personas

    Priya (Product Manager): Priya wants to know which features are most popular and where users might be struggling. She needs data to prioritize the roadmap (e.g., "Are people using the Code Relationship Map?").

    Sarah (Security-Conscious Developer): Sarah wants to use the tool but needs to ensure that no proprietary code or personal information is being sent from her machine. She wants to be able to disable all telemetry.

4. Requirements Breakdown

Phase
	

Sprint
	

User Story
	

Acceptance Criteria
	

Duration

Phase 6: Maintainability
	

Sprint 15: Telemetry
	

As Priya, I want to anonymously track key feature usage so I can make data-driven product decisions.
	

1. A TelemetryService is created that can send anonymous event data to an analytics backend.<br>2. The service is integrated into key user actions (e.g., running a search, applying a filter, saving a search).<br>3. Events contain only the action name and non-sensitive metadata (e.g., search latency).
	

2 Weeks


	


	

As Sarah, I want to control what telemetry data is shared from a dedicated Privacy section so that I can protect my privacy.
	

1. A new "Privacy" or "Telemetry" section is added to SettingsView.tsx.<br>2. A master toggle allows users to completely enable or disable telemetry.<br>3. The TelemetryService checks this configuration setting before sending any event and sends nothing if it's disabled.
	


5. Timeline & Sprints

    Total Estimated Time: 2 Weeks

    Sprint 15: Telemetry & Privacy Controls (2 Weeks)

6. Risks & Assumptions

    Risk: If not implemented carefully, the telemetry system could accidentally capture sensitive information.

        Mitigation: Implement a strict "allow-list" of event names and properties that can be sent. All new telemetry events must go through a code review specifically focused on privacy. Absolutely no user-generated content (search queries, code snippets) should be included in events.

# Task List: Sprint 15 - Telemetry & Privacy Controls

**Goal:** To implement a privacy-conscious telemetry system with clear user controls for opting out.

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

**15.1**

 | 

☐ To Do

 | 

**Add Privacy Setting to UI:** In `webview-react/src/components/SettingsView.tsx`, add a new section for "Privacy" and include a `Switch` labeled "Enable Anonymous Usage Telemetry".

 | 

`webview-react/src/components/SettingsView.tsx`

 |
| 

**15.2**

 | 

☐ To Do

 | 

**Connect Setting to Config:** Wire the new switch to the extension's configuration store. Ensure it defaults to `true` (opt-out).

 | 

`webview-react/src/components/SettingsView.tsx`

 |
| 

**15.3**

 | 

☐ To Do

 | 

**Create `TelemetryService.ts`:** Create a new file `src/telemetry/telemetryService.ts`. This service will be the single point of contact for all telemetry events.

 | 

`src/telemetry/telemetryService.ts` (New)

 |
| 

**15.4**

 | 

☐ To Do

 | 

**Implement `trackEvent` Method:** The service's main method, `trackEvent`, will first check the `enableTelemetry` configuration setting. If `false`, it should return immediately.

 | 

`src/telemetry/telemetryService.ts`

 |
| 

**15.5**

 | 

☐ To Do

 | 

**Send Anonymous Data:** If telemetry is enabled, the `trackEvent` method should send a payload (e.g., via a `fetch` POST request to an analytics endpoint) containing only anonymous data like the event name and a unique user ID (e.g., `vscode.env.machineId`).

 | 

`src/telemetry/telemetryService.ts`

 |
| 

**15.6**

 | 

☐ To Do

 | 

**Integrate Tracking - Search:** In `src/searchManager.ts`, after a search completes, call `telemetryService.trackEvent('search_performed', { latency: ... })`.

 | 

`src/searchManager.ts`

 |
| 

**15.7**

 | 

☐ To Do

 | 

**Integrate Tracking - Indexing:** In `src/indexing/indexingService.ts`, after indexing completes, call `telemetryService.trackEvent('indexing_completed', { duration: ..., fileCount: ... })`.

 | 

`src/indexing/indexingService.ts`

 |
| 

**15.8**

 | 

☐ To Do

 | 

**Integrate Tracking - UI Actions:** In the UI, call `postMessage` for key events like applying a filter or saving a search, and have the `messageRouter` call the `TelemetryService`.

 | 

`webview-react/src/components/QueryView.tsx`, `src/communication/messageRouter.ts`

 |

# PRD 16: Accessibility (A11y) Overhaul

**1\. Title & Overview**

- **Project:** Code Context Engine - Accessibility (A11y) Overhaul
    
- **Summary:** This foundational phase is dedicated to making the extension fully accessible to all users, including those who rely on screen readers or keyboard-only navigation. The work involves a comprehensive review of all UI components to ensure they adhere to WCAG standards, including proper ARIA labels, keyboard focus management, and high-contrast theme support.
    
- **Dependencies:** This work touches all existing UI components in the `webview-react` directory.
    

**2\. Goals & Success Metrics**

- **Business Objectives:**
    
    - Ensure the product is inclusive and usable by the widest possible audience.
        
    - Comply with accessibility standards, a requirement for many enterprise customers.
        
- **Developer & System Success Metrics:**
    
    - Every interactive element in the extension's UI is reachable and operable using only the keyboard (Tab, Shift+Tab, Enter, Space).
        
    - All UI controls have proper ARIA labels, roles, and states that are correctly announced by screen readers (e.g., NVDA, VoiceOver).
        
    - The UI is fully usable and legible when VS Code is switched to a high-contrast theme.
        

**3\. User Personas**

- **Kael (Keyboard-Only Developer):** Kael has a repetitive strain injury and avoids using a mouse. He relies on keyboard shortcuts and the Tab key to navigate all of his tools, including VS Code extensions.
    
- **Sofia (Visually Impaired Developer):** Sofia uses a screen reader to interact with her development environment. She needs all buttons, inputs, and results to be properly labeled so her screen reader can announce what they are and how to interact with them.
    

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

**Phase 6: Maintainability**

 | 

**Sprint 16: A11y Overhaul**

 | 

As Kael, I want to navigate the entire interface using my keyboard, so that I can use the extension without a mouse.

 | 

1\. A full audit of the UI is performed, tabbing through every element.<br>2. Logical focus order is established for all views (`QueryView`, `SettingsView`, etc.).<br>3. Custom components or non-semantic elements used as buttons are made focusable (`tabIndex="0"`) and respond to `Enter`/`Space` key presses.

 | 

**2 Weeks**

 |
| 

  


 | 

  


 | 

As Sofia, I want my screen reader to correctly announce all UI elements, so that I can understand and operate the interface.

 | 

1\. All interactive elements (buttons, inputs, tabs) are given descriptive `aria-label` attributes.<br>2. Dynamic regions, like the search results list, use `aria-live` attributes to announce when content has been updated.<br>3. All images or icons have appropriate alt text or ARIA labels.

 | 

  


 |
| 

  


 | 

  


 | 

As a developer with low vision, I want the UI to respect VS Code's high-contrast theme so that I can read the text clearly.

 | 

1\. The extension's CSS is reviewed to remove hardcoded colors.<br>2. It is updated to use VS Code's theme color variables (e.g., `var(--vscode-editor-foreground)`) for all text, borders, and backgrounds.<br>3. The UI is tested and verified to be legible in both light and dark high-contrast themes.

 | 

  


 |

**5\. Timeline & Sprints**

- **Total Estimated Time:** 2 Weeks
    
- **Sprint 16:** Accessibility Overhaul (2 Weeks)
    

**6\. Risks & Assumptions**

- **Risk:** Some UI components from external libraries (like Fluent UI) may have their own accessibility limitations.
    
    - **Mitigation:** Prioritize using components known for good accessibility. If issues are found, investigate workarounds or report the issues upstream to the library maintainers.

# Task List: Sprint 16 - Accessibility (A11y) Overhaul

**Goal:** To ensure the extension is fully navigable and usable with keyboards and screen readers, and respects high-contrast themes.

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

**16.1**

 | 

☐ To Do

 | 

**Audit Keyboard Navigation:** Manually go through every view of the extension using only the Tab and Shift+Tab keys. Document every element that cannot be reached or has an illogical focus order.

 | 

(Manual Testing)

 |
| 

**16.2**

 | 

☐ To Do

 | 

**Add `tabIndex`:** For any custom `div` or `span` elements that act as buttons but are not naturally focusable, add `tabIndex="0"`.

 | 

`webview-react/src/components/*.tsx`

 |
| 

**16.3**

 | 

☐ To Do

 | 

**Add Keyboard Event Handlers:** For elements with `tabIndex="0"`, add an `onKeyDown` handler that checks for `event.key === 'Enter'` or `' '` to trigger the element's `onClick` action.

 | 

`webview-react/src/components/*.tsx`

 |
| 

**16.4**

 | 

☐ To Do

 | 

**Audit ARIA Labels:** Use a screen reader (like NVDA on Windows or VoiceOver on macOS) to navigate the UI. Identify all buttons, inputs, and controls that have unclear or missing labels.

 | 

(Manual Testing)

 |
| 

**16.5**

 | 

☐ To Do

 | 

**Add `aria-label` Attributes:** Add descriptive `aria-label` props to all icon-only buttons and other interactive elements that lack clear text labels. For example, `<Button icon={<ShareIcon />} aria-label="Share result" />`.

 | 

`webview-react/src/components/*.tsx`

 |
| 

**16.6**

 | 

☐ To Do

 | 

**Implement `aria-live` for Results:** In `QueryView.tsx`, add an `aria-live="polite"` attribute to the container element that wraps the search results list, so that screen readers announce when results have been updated.

 | 

`webview-react/src/components/QueryView.tsx`

 |
| 

**16.7**

 | 

☐ To Do

 | 

**Replace Hardcoded Colors:** Search the entire `webview-react` CSS/styling for hardcoded color values (e.g., `#FFFFFF`, `black`).

 | 

`webview-react/**/*.css`, `webview-react/**/*.tsx`

 |
| 

**16.8**

 | 

☐ To Do

 | 

**Use VS Code Theme Variables:** Replace all hardcoded colors with their corresponding VS Code CSS theme variables (e.g., `color: var(--vscode-foreground)`).

 | 

`webview-react/**/*.css`, `webview-react/**/*.tsx`

 |
| 

**16.9**

 | 

☐ To Do

 | 

**Test in High Contrast:** Enable VS Code's high-contrast theme from the Command Palette and visually inspect every view to ensure all text and UI elements are clearly legible.

 | 

(Manual Testing)

 |