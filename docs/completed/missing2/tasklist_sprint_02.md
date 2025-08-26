# Task List: Sprint 2 - Intuitive Settings & Diagnostics UI

**Goal:** To build a rich, interactive setup UI that validates the user's system and allows them to test their configuration before committing to an index.

| Task ID | Status | Task Description (Sequential & Atomic Steps) | File(s) To Modify |
| :--- | :--- | :--- | :--- |
| **2.1** | ☐ To Do | **Create Validation Directory:** Create a new directory at `src/validation`. | `src/validation/` |
| **2.2** | ☐ To Do | **Create `SystemValidator.ts`:** Create a new file `SystemValidator.ts` in the `validation` directory. Add the class definition and an async method `checkDocker()` that executes `docker --version` and returns the result. | `src/validation/systemValidator.ts` |
| **2.3** | ☐ To Do | **Integrate `SystemValidator`:** In `src/extensionManager.ts`, import and create an instance of `SystemValidator`. Pass this instance to the `MessageRouter`'s constructor. | `src/extensionManager.ts` |
| **2.4** | ☐ To Do | **Add `validateSystem` Handler:** In `src/messageRouter.ts`, add a new `case 'validateSystem'` to the `handleMessage` method. This handler should call the `systemValidator` and post the results back to the webview. | `src/messageRouter.ts` |
| **2.5** | ☐ To Do | **Create `SystemValidation.svelte` Component:** Create the file `webview/src/lib/components/SystemValidation.svelte`. In the `<script>` section, use `onMount` to call `vscode.postMessage({ command: 'validateSystem' })` and a `window.addEventListener` to listen for the results. | `webview/src/lib/components/SystemValidation.svelte` |
| **2.6** | ☐ To Do | **Implement `SystemValidation.svelte` UI:** In the same file, add HTML to iterate over the validation results and display each check's name, status (success/failure), and message. | `webview/src/lib/components/SystemValidation.svelte` |
| **2.7** | ☐ To Do | **Create `ValidatedInput.svelte` Component:** Create the file `webview/src/lib/components/ValidatedInput.svelte`. Implement a reusable input with props for `label`, `value`, and a `validator` function. It should display an error message if validation fails on blur. | `webview/src/lib/components/ValidatedInput.svelte` |
| **2.8** | ☐ To Do | **Create `ConnectionTester.svelte` Component:** Create `webview/src/lib/components/ConnectionTester.svelte`. Implement a component with a "Test" button that calls a `testFunction` prop and displays the status (e.g., loading, success, error) and result message. | `webview/src/lib/components/ConnectionTester.svelte` |
| **2.9** | ☐ To Do | **Add `testDatabaseConnection` Handler:** In `src/messageRouter.ts`, add a `case 'testDatabaseConnection'`. This handler should attempt to connect to the Qdrant database and return a success or error message to the webview. | `src/messageRouter.ts` |
| **2.10**| ☐ To Do | **Update `SetupView.svelte`:** Import `SystemValidation.svelte` and add it to the top of the view. | `webview/src/lib/components/SetupView.svelte` |
| **2.11**| ☐ To Do | **Add Database Config to `SetupView`:** In `SetupView.svelte`, import and use `ValidatedInput` for the database connection string. Add a `ConnectionTester` component wired to the `testDatabaseConnection` command. | `webview/src/lib/components/SetupView.svelte` |
| **2.12**| ☐ To Do | **Add Provider Config to `SetupView`:** In `SetupView.svelte`, add another `ValidatedInput` for the embedding provider API key (if applicable) and a corresponding `ConnectionTester`. | `webview/src/lib/components/SetupView.svelte` |
| **2.13**| ☐ To Do | **Test System Validation:** Launch the extension and open the main panel. Verify the `SystemValidation` component appears and correctly reports the status of Docker on your machine. | `(Manual Test)` |
| **2.14**| ☐ To Do | **Test Connection Testers:** Enter a valid/invalid database URL and click the "Test" button. Verify that the correct success/error feedback is displayed. | `(Manual Test)` |
