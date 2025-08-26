hat# Implementation Guidance: Sub-Sprint 1 - SvelteKit Project Scaffolding

**Objective:** To replace the existing `webview/` content with a new, properly configured SvelteKit project and add the Fluent UI component library.

---

### 1. Overview

This guide provides the technical steps to scaffold a new SvelteKit project within the `webview` directory. The goal is to create a modern frontend foundation that builds to a static site, which can be loaded directly by the VS Code extension's webview panel.

### 2. Step-by-Step Implementation

#### Step 2.1: Clear and Initialize the SvelteKit Project

First, ensure the `webview/` directory is empty. Then, use the official SvelteKit scaffolding tool to create a new project.

```bash
# Navigate to the project root
# Make sure the webview directory is empty
rm -rf webview/*

# Run the SvelteKit initializer
npm create svelte@latest webview
```

When prompted by the `create-svelte` wizard, choose the following options:
-   **Which Svelte app template?** `Skeleton project`
-   **Add type checking with TypeScript?** `Yes`
-   **Select additional options:** (You can skip ESLint, Prettier, etc. for now if desired)

#### Step 2.2: Install Dependencies

Navigate into the newly created `webview` directory and install the necessary dependencies for static site generation and the Fluent UI component library.

```bash
# Navigate into the new webview directory
cd webview

# Install the static adapter for SvelteKit
npm install -D @sveltejs/adapter-static

# Install the Fluent UI web components library
npm install @fluentui/web-components
```

#### Step 2.3: Configure the Static Adapter

Modify the `svelte.config.js` file to use the static adapter. This is critical for ensuring the SvelteKit application builds into a set of static files that the VS Code extension can serve.

**File:** `webview/svelte.config.js`
```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      // The output directory for the build.
      pages: 'build',
      assets: 'build',

      // A fallback page is crucial for SPA-like behavior in a webview.
      // It ensures that all routes are directed to index.html.
      fallback: 'index.html',

      precompress: false,
      strict: true
    }),
    // This is important for VS Code webviews to correctly resolve asset paths.
    // It tells SvelteKit that all paths are relative to the root.
    paths: {
      relative: true
    }
  }
};

export default config;
```
**Note on `paths: { relative: true }`**: While the PRD doesn't explicitly mention this, using relative paths is often a good practice for webviews to avoid issues with `file://` protocols or custom URI schemes used by VS Code. However, the ultimate solution in Sprint 2 will involve the extension rewriting paths, so this can be considered a preliminary setup.

### 3. Integrating Fluent UI

With `@fluentui/web-components` installed, you can begin using its components in your Svelte files. Fluent UI Web Components are standard Custom Elements, so they can be used directly in your markup.

You may need to define the custom elements in a root layout or component. A common practice is to import the necessary component definitions in your main `+layout.svelte` or `+page.svelte`.

**Example:** `webview/src/routes/+layout.svelte`
```html
<script>
  import { provideFluentDesignSystem, fluentButton, fluentTextField } from "@fluentui/web-components";
  import { onMount } from "svelte";

  // It's good practice to only interact with the design system after the component has mounted.
  onMount(() => {
    provideFluentDesignSystem().register(fluentButton(), fluentTextField());
  });
</script>

<slot></slot>

<style>
  /* Add any global styles here */
</style>
```

### 4. External Resources

-   **SvelteKit Static Adapter:** [Official Documentation](https://kit.svelte.dev/docs/adapter-static)
-   **Fluent UI Web Components:** [Official Documentation & Storybook](https://fluentui.dev/)

After completing these steps, you can run `npm run build` inside the `webview` directory to generate the static output in the `webview/build` folder, verifying the setup is correct.
