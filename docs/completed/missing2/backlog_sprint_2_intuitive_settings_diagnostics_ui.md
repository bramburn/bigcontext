### User Story 1: Interactive Configuration UI
**As a** developer (Devin), **I want** a single, intuitive setup page that validates my system and lets me configure and test my database and provider connections in one place, **so that** I can be confident my setup is correct before starting a long indexing process.

**Actions to Undertake:**
1.  **Filepath**: `webview/src/lib/components/ValidatedInput.svelte` (New File)
    -   **Action**: Create a reusable Svelte component for form inputs that provides real-time validation feedback.
    -   **Implementation**:
        ```html
        <script lang="ts">
          export let value: string;
          export let label: string;
          export let validator: (val: string) => string | null;
          let error: string | null = null;

          function validate() {
            error = validator(value);
          }
        </script>

        <div>
          <label>{label}</label>
          <input bind:value on:blur={validate} />
          {#if error}
            <p class="error">{error}</p>
          {/if}
        </div>
        ```
    -   **Imports**: N/A
2.  **Filepath**: `webview/src/lib/components/ConnectionTester.svelte` (New File)
    -   **Action**: Create a component that can test a given configuration and display the status (success, error, latency).
    -   **Implementation**:
        ```html
        <script lang="ts">
          import { onMount } from 'svelte';

          export let testFunction: () => Promise<{ok: boolean, message: string, latency?: number}>;
          let status: 'idle' | 'testing' | 'success' | 'error' = 'idle';
          let resultMessage: string = '';

          async function runTest() {
            status = 'testing';
            const result = await testFunction();
            status = result.ok ? 'success' : 'error';
            resultMessage = result.message + (result.latency ? ` (${result.latency}ms)` : '');
          }
        </script>

        <button on:click={runTest} disabled={status === 'testing'}>
          Test Connection
        </button>
        {#if status === 'success' || status === 'error'}
          <p class={status}>{resultMessage}</p>
        {/if}
        ```
    -   **Imports**: `import { onMount } from 'svelte';`
3.  **Filepath**: `webview/src/lib/components/SetupView.svelte`
    -   **Action**: Enhance the `SetupView` to use the new `ValidatedInput` and `ConnectionTester` components for database and provider configuration.
    -   **Implementation**: Import and integrate the new components within the setup form, binding them to configuration stores and backend test functions.
    -   **Imports**: `import ValidatedInput from './ValidatedInput.svelte';`, `import ConnectionTester from './ConnectionTester.svelte';`

**Acceptance Criteria:**
-   The `SetupView` contains input fields for database connection string and provider API keys.
-   Input fields show validation errors on blur if the format is incorrect (e.g., invalid URL).
-   A "Test Connection" button exists for the database and embedding provider.
-   Clicking the test button provides visual feedback (e.g., "Success", "Error: Connection refused").

**Testing Plan:**
-   **Test Case 1**: Enter an invalid URL in the database connection string field and verify an error message appears.
-   **Test Case 2**: With a valid but incorrect database URL, click "Test Connection" and verify a connection error is displayed.
-   **Test Case 3**: With a correct database URL, click "Test Connection" and verify a success message and latency are shown.

---

### User Story 2: Automated System Prerequisite Checks
**As a** developer (Devin), **I want** the extension to automatically check my system for prerequisites like Docker before I start the setup, **so that** I know if my environment is ready.

**Actions to Undertake:**
1.  **Filepath**: `src/validation/systemValidator.ts` (New File)
    -   **Action**: Create a new service in the extension backend to check for system prerequisites.
    -   **Implementation**:
        ```typescript
        import { exec } from 'child_process';

        export class SystemValidator {
          public async checkDocker(): Promise<{installed: boolean, version: string}> {
            return new Promise((resolve) => {
              exec('docker --version', (error, stdout) => {
                if (error) {
                  return resolve({ installed: false, version: '' });
                }
                resolve({ installed: true, version: stdout.trim() });
              });
            });
          }
        }
        ```
    -   **Imports**: `import { exec } from 'child_process';`
2.  **Filepath**: `src/messageRouter.ts`
    -   **Action**: Add a new message handler to expose the `SystemValidator`'s functionality to the webview.
    -   **Implementation**: Add a case for `validateSystem` that calls the `systemValidator.checkAll()` method and posts the results back to the webview.
    -   **Imports**: `import { SystemValidator } from './validation/systemValidator';`
3.  **Filepath**: `webview/src/lib/components/SystemValidation.svelte` (New File)
    -   **Action**: Create a UI component to display the results of the system validation checks.
    -   **Implementation**: The component will message the backend on mount to get validation status and display a list of checks and their results (e.g., "Docker: Found (version 20.10.7)").
    -   **Imports**: `import { onMount } from 'svelte';`
4.  **Filepath**: `webview/src/lib/components/SetupView.svelte`
    -   **Action**: Integrate the `SystemValidation` component at the top of the `SetupView`.
    -   **Implementation**: `<SystemValidation />`
    -   **Imports**: `import SystemValidation from './SystemValidation.svelte';`

**Acceptance Criteria:**
-   A `SystemValidator.ts` service exists in the backend.
-   When the `SetupView` loads, it automatically displays a list of prerequisite checks (e.g., Docker).
-   The UI correctly shows whether each prerequisite is met or not.

**Testing Plan:**
-   **Test Case 1**: On a machine with Docker installed, load the `SetupView` and verify it shows a success status for Docker.
-   **Test Case 2**: On a machine without Docker installed, load the `SetupView` and verify it shows a failure/warning status for Docker.
