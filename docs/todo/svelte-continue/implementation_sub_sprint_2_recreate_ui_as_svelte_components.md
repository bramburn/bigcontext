# Implementation Guidance: Sub-Sprint 2 - Recreate UI as Svelte Components

**Objective:** To build the three primary UI views as distinct Svelte components, replicating the functionality and layout from the original inline HTML.

---

### 1. Overview

This guide details how to translate the raw HTML found in `src/extension.ts` into modular and reusable Svelte components. This is a foundational step in decoupling the frontend from the backend. We will create three core components and a simple state management system to control which component is visible.

### 2. Step-by-Step Implementation

#### Step 2.1: Create the View State Store

First, create a centralized store to manage the application's current state. This allows components to be decoupled while sharing the global state of which view should be active.

**File:** `webview/src/lib/stores/viewStore.ts` (New File)
```typescript
import { writable } from 'svelte/store';

// This type definition ensures we only use valid view names
export type View = 'setup' | 'indexing' | 'query';

// The store holds the current active view. 'setup' is the default.
export const currentView = writable<View>('setup');
```

#### Step 2.2: Create the Svelte View Components

Next, create the three Svelte components. For each component, you will copy the relevant HTML structure from `src/extension.ts` and convert it to Svelte syntax, using Fluent UI components.

**1. Setup View**

This component replicates the UI from the `getSetupWebviewContent` function.

**File:** `webview/src/lib/components/SetupView.svelte` (New File)
```html
<script lang="ts">
  // Import specific Fluent UI components you will use
  import { fluentSelect, fluentTextField, fluentButton } from "@fluentui/web-components";
  import { onMount } from "svelte";

  onMount(() => {
    // Register components with the Fluent Design System
    fluentSelect();
    fluentTextField();
    fluentButton();
  });

  // In future sprints, you will add logic here to handle button clicks
  // and post messages to the VS Code extension.
</script>

<div class="setup-step">
    <h3>Step 1: Vector Database Configuration</h3>
    <fluent-select id="databaseType">
        <fluent-option value="qdrant">Qdrant (Recommended)</fluent-option>
    </fluent-select>
    <fluent-text-field id="databaseConnectionString" value="http://localhost:6333" placeholder="http://localhost:6333">Connection String</fluent-text-field>
    <fluent-button appearance="secondary">Start Local Qdrant</fluent-button>
</div>

<div class="setup-step">
    <h3>Step 2: Embedding Provider Configuration</h3>
    <fluent-select id="embeddingProvider">
        <fluent-option value="ollama">Ollama (Local)</fluent-option>
        <fluent-option value="openai">OpenAI (Cloud)</fluent-option>
    </fluent-select>
</div>

<div class="final-step">
    <h3>Ready to Index?</h3>
    <fluent-button appearance="accent">Save & Start Indexing</fluent-button>
</div>

<style>
  .setup-step, .final-step {
    margin-bottom: 30px;
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
  }
  h3 {
    margin-top: 0;
  }
</style>
```

**2. Indexing View**

This component shows the progress of an indexing operation, taken from the `getWebviewContent` function.

**File:** `webview/src/lib/components/IndexingView.svelte` (New File)
```html
<script lang="ts">
  import { fluentProgress, fluentProgressBar } from "@fluentui/web-components";
  import { onMount } from "svelte";

  onMount(() => {
    fluentProgress();
    fluentProgressBar();
  });

  // This will be driven by messages from the extension in a future sprint
  export let progress = 50; // Example progress value
  export let statusText = "Indexing file_name.ts...";
</script>

<div class="section">
    <h2>Repository Indexing</h2>
    <p>Please wait while your repository is being indexed.</p>
    
    <fluent-progress-bar value={progress}></fluent-progress-bar>
    <p>{statusText}</p>
</div>

<style>
  .section {
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
  }
</style>
```

**3. Query View**

This component provides the main search interface, also from `getWebviewContent`.

**File:** `webview/src/lib/components/QueryView.svelte` (New File)
```html
<script lang="ts">
  import { fluentTextField, fluentButton } from "@fluentui/web-components";
  import { onMount } from "svelte";

  onMount(() => {
    fluentTextField();
    fluentButton();
  });
</script>

<div class="section">
    <h2>Search & Context</h2>
    <p>Search through your indexed code and get AI-powered context.</p>
    <fluent-text-field placeholder="Search your code..." style="width: 100%; margin-bottom: 10px;"></fluent-text-field>
    <fluent-button appearance="accent">Search</fluent-button>

    <div id="search-results" style="margin-top: 20px;">
        <!-- Search results will be rendered here based on extension messages -->
    </div>
</div>

<style>
  .section {
    padding: 20px;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
  }
</style>
```

#### Step 2.3: Create the View Manager

Finally, update the main `+page.svelte` to act as a controller that renders the correct view based on the state in `viewStore`.

**File:** `webview/src/routes/+page.svelte` (Modify)
```html
<script lang="ts">
  import SetupView from '$lib/components/SetupView.svelte';
  import IndexingView from '$lib/components/IndexingView.svelte';
  import QueryView from '$lib/components/QueryView.svelte';
  import { currentView } from '$lib/stores/viewStore';

  // To test, you can expose the store to the window object
  import { onMount } from 'svelte';
  onMount(() => {
    if (typeof window !== 'undefined') {
      (window as any).currentView = currentView;
    }
  });
</script>

<main>
  {#if $currentView === 'setup'}
    <SetupView />
  {:else if $currentView === 'indexing'}
    <IndexingView />
  {:else if $currentView === 'query'}
    <QueryView />
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
</style>
```

### 3. Verification

After creating these files, run the SvelteKit development server from within the `webview` directory:

```bash
cd webview
npm run dev
```

Open your browser to the specified localhost address. You should see the `SetupView` component rendered by default. You can test the view switching by opening the browser's developer console and running `window.currentView.set('query')` or `window.currentView.set('indexing')`. The UI should update instantly to show the corresponding component.
