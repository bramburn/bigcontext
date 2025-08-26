This guide provides implementation details for Sprint 2: Intuitive Settings & Diagnostics UI.

### 1. Backend: `SystemValidator.ts` Service

This service will live in the extension's backend and be responsible for checking for third-party dependencies on the user's machine.

**Location**: `src/validation/systemValidator.ts`

**Implementation Strategy**:
Use Node's built-in `child_process` module to execute shell commands and check for the presence and version of required tools. This is more reliable than checking for file paths.

**Example `SystemValidator.ts`**:
```typescript
import { exec } from 'child_process';
import * as util from 'util';

// Promisify exec for async/await usage
const execPromise = util.promisify(exec);

export interface ValidationResult {
  name: string;
  success: boolean;
  message: string;
}

export class SystemValidator {
  public async checkAll(): Promise<ValidationResult[]> {
    const results = await Promise.all([
      this.checkDocker(),
      this.checkNetwork(),
    ]);
    return results;
  }

  private async checkDocker(): Promise<ValidationResult> {
    try {
      const { stdout } = await execPromise('docker --version');
      return {
        name: 'Docker',
        success: true,
        message: stdout.trim(),
      };
    } catch (error) {
      return {
        name: 'Docker',
        success: false,
        message: 'Docker not found. Please install it to use local services.',
      };
    }
  }

  private async checkNetwork(): Promise<ValidationResult> {
    try {
      // A simple check against a reliable host
      await execPromise('ping -c 1 8.8.8.8');
      return {
        name: 'Internet Connectivity',
        success: true,
        message: 'Connected',
      };
    } catch (error) {
      return {
        name: 'Internet Connectivity',
        success: false,
        message: 'No internet connection detected.',
      };
    }
  }
}
```

### 2. Frontend-Backend Communication

Communication between the SvelteKit UI and the VS Code extension backend is handled via a message-passing interface.

1.  **Frontend (`.svelte` component)**: Uses `const vscode = acquireVsCodeApi();` and `vscode.postMessage({ command: 'myCommand' });` to send requests.
2.  **Backend (`MessageRouter.ts`)**: Listens for messages and routes them to the appropriate service.

**Adding a `validateSystem` command to `MessageRouter.ts`**:
```typescript
// In MessageRouter.ts, assuming you have a systemValidator instance
case 'validateSystem':
  const validationResults = await this.systemValidator.checkAll();
  webview.postMessage({
    command: 'systemValidationResult',
    payload: validationResults,
  });
  break;
```

### 3. Frontend: Reusable Svelte Components

Building small, reusable components is a core principle of Svelte.

**`ValidatedInput.svelte`**
This component encapsulates the logic for an input field with a label and validation.

**API Search**: A web search for "Svelte form validation" reveals common patterns like using a `validator` function prop and displaying conditional error messages, which is the approach adopted here.

**Example Usage**:
```html
<script lang="ts">
  import ValidatedInput from './ValidatedInput.svelte';
  let url = 'http://localhost:6333';
  const urlValidator = (val: string) => {
    try {
      new URL(val);
      return null; // a null error means valid
    } catch {
      return 'Invalid URL format';
    }
  };
</script>

<ValidatedInput label="Database URL" bind:value={url} validator={urlValidator} />
```

**`ConnectionTester.svelte`**
This component provides a button to trigger a backend test and displays the result.

**Implementation Strategy**:
-   The component takes a `testFunction` prop, which should be an `async` function that calls the backend via `postMessage` and waits for the result.
-   It manages its own state (`idle`, `testing`, `success`, `error`) to provide clear UI feedback.

**Example Usage in `SetupView.svelte`**:
```html
<script lang="ts">
  import ConnectionTester from './ConnectionTester.svelte';
  const vscode = acquireVsCodeApi();

  async function testDbConnection() {
    vscode.postMessage({ command: 'testDatabaseConnection' });
    // This requires a listener for the 'databaseConnectionResult' message
    return new Promise(resolve => {
      window.addEventListener('message', event => {
        if (event.data.command === 'databaseConnectionResult') {
          resolve(event.data.payload);
        }
      }, { once: true });
    });
  }
</script>

<ConnectionTester testFunction={testDbConnection} />
```

### 4. Assembling the `SetupView.svelte`

The final step is to combine these components into a single, user-friendly setup screen.

**`SetupView.svelte` Structure**:
```html
<script lang="ts">
  import SystemValidation from './SystemValidation.svelte';
  import ValidatedInput from './ValidatedInput.svelte';
  import ConnectionTester from './ConnectionTester.svelte';
  // ... other imports and logic
</script>

<div class="setup-container">
  <h2>1. System Checks</h2>
  <SystemValidation />

  <h2>2. Database Configuration</h2>
  <ValidatedInput ... />
  <ConnectionTester ... />

  <h2>3. Embedding Provider</h2>
  <!-- More inputs and testers here -->
</div>
```
This structure provides a clear, step-by-step process for the user, guided by automated checks and interactive testers.
