import { test, expect } from '@playwright/test';

/**
 * Visual regression testing for UI components
 * Takes screenshots of components in different states and themes
 */

test.describe('Component Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to component test view
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Wait for components to load
    await page.waitForTimeout(1000);
  });

  test('should render component showcase in dark theme', async ({ page }) => {
    // Set dark theme
    await page.evaluate(() => {
      document.body.classList.remove('vscode-light', 'vscode-high-contrast', 'vscode-high-contrast-light');
      document.body.classList.add('vscode-dark');
    });
    
    await page.waitForTimeout(500);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('component-showcase-dark.png', {
      fullPage: true,
      threshold: 0.2
    });
  });

  test('should render component showcase in light theme', async ({ page }) => {
    // Set light theme
    await page.evaluate(() => {
      document.body.classList.remove('vscode-dark', 'vscode-high-contrast', 'vscode-high-contrast-light');
      document.body.classList.add('vscode-light');
    });
    
    await page.waitForTimeout(500);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('component-showcase-light.png', {
      fullPage: true,
      threshold: 0.2
    });
  });

  test('should render component showcase in high contrast theme', async ({ page }) => {
    // Set high contrast theme
    await page.evaluate(() => {
      document.body.classList.remove('vscode-light', 'vscode-dark', 'vscode-high-contrast-light');
      document.body.classList.add('vscode-high-contrast', 'vscode-high-contrast-dark');
    });
    
    await page.waitForTimeout(500);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('component-showcase-high-contrast.png', {
      fullPage: true,
      threshold: 0.2
    });
  });

  test('should render buttons in all variants', async ({ page }) => {
    // Create test buttons
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'button-test-container';
      container.className = 'p-4 space-y-4 bg-[var(--vscode-editor-background)]';
      container.innerHTML = `
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Button Variants</h3>
          <div class="flex gap-2 flex-wrap">
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)] h-8 px-3 py-1">Default</button>
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)] h-8 px-3 py-1">Secondary</button>
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-[var(--vscode-panel-border)] bg-transparent hover:bg-[var(--vscode-list-hoverBackground)] h-8 px-3 py-1">Outline</button>
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-[var(--vscode-list-hoverBackground)] h-8 px-3 py-1">Ghost</button>
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-[var(--vscode-errorForeground)] text-white hover:bg-[var(--vscode-errorForeground)]/90 h-8 px-3 py-1">Destructive</button>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] h-7 px-2 text-xs">Small</button>
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] h-8 px-5">Large</button>
            <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] h-8 w-8">🔍</button>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button disabled class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] h-8 px-3 py-1 opacity-50 pointer-events-none">Disabled</button>
          </div>
        </div>
      `;
      document.body.appendChild(container);
    });

    const buttonContainer = page.locator('#button-test-container');
    await expect(buttonContainer).toHaveScreenshot('buttons-all-variants.png');

    // Clean up
    await page.evaluate(() => {
      const container = document.getElementById('button-test-container');
      if (container) container.remove();
    });
  });

  test('should render form controls correctly', async ({ page }) => {
    // Create test form controls
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'form-test-container';
      container.className = 'p-4 space-y-4 bg-[var(--vscode-editor-background)] max-w-md';
      container.innerHTML = `
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Form Controls</h3>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">Text Input</label>
            <input class="flex h-9 w-full rounded-md border border-[var(--vscode-panel-border)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--vscode-input-placeholderForeground)] focus:outline-none focus:ring-2 focus:ring-[var(--vscode-focusBorder)]" placeholder="Enter text..." value="Sample text">
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">Select</label>
            <div class="flex h-9 w-full items-center justify-between rounded-md border border-[var(--vscode-panel-border)] bg-transparent px-3 py-2 text-sm">
              <span>Selected Option</span>
              <span>▼</span>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 border border-[var(--vscode-panel-border)] rounded bg-[var(--vscode-checkbox-selectBackground)] flex items-center justify-center">
              <span class="text-xs text-white">✓</span>
            </div>
            <label class="text-sm">Checkbox</label>
          </div>
          
          <div class="flex items-center space-x-2">
            <div class="w-8 h-4 bg-[var(--vscode-checkbox-selectBackground)] rounded-full relative">
              <div class="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5"></div>
            </div>
            <label class="text-sm">Switch</label>
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">Progress</label>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-[var(--vscode-progressBar-background)] h-2 rounded-full" style="width: 60%"></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
    });

    const formContainer = page.locator('#form-test-container');
    await expect(formContainer).toHaveScreenshot('form-controls.png');

    // Clean up
    await page.evaluate(() => {
      const container = document.getElementById('form-test-container');
      if (container) container.remove();
    });
  });

  test('should render typography correctly', async ({ page }) => {
    // Create typography test
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'typography-test-container';
      container.className = 'p-4 space-y-4 bg-[var(--vscode-editor-background)] max-w-lg';
      container.innerHTML = `
        <div class="space-y-4">
          <h1 class="text-2xl font-bold text-[var(--vscode-foreground)]">Heading 1</h1>
          <h2 class="text-xl font-semibold text-[var(--vscode-foreground)]">Heading 2</h2>
          <h3 class="text-lg font-medium text-[var(--vscode-foreground)]">Heading 3</h3>
          <p class="text-base text-[var(--vscode-foreground)]">Regular paragraph text with some content to show line height and spacing.</p>
          <p class="text-sm text-[var(--vscode-descriptionForeground)]">Small text for descriptions and secondary information.</p>
          <p class="text-xs text-[var(--vscode-descriptionForeground)]">Extra small text for fine print.</p>
          <code class="bg-[var(--vscode-textCodeBlock-background)] px-2 py-1 rounded text-sm font-mono text-[var(--vscode-textPreformat-foreground)]">
            Code snippet example
          </code>
          <blockquote class="border-l-4 border-[var(--vscode-panel-border)] pl-4 italic text-[var(--vscode-foreground)]">
            This is a blockquote example to show text styling.
          </blockquote>
        </div>
      `;
      document.body.appendChild(container);
    });

    const typographyContainer = page.locator('#typography-test-container');
    await expect(typographyContainer).toHaveScreenshot('typography.png');

    // Clean up
    await page.evaluate(() => {
      const container = document.getElementById('typography-test-container');
      if (container) container.remove();
    });
  });

  test('should render color swatches correctly', async ({ page }) => {
    // Create color swatch test
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'color-test-container';
      container.className = 'p-4 space-y-4 bg-[var(--vscode-editor-background)]';
      container.innerHTML = `
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-[var(--vscode-foreground)]">Color Swatches</h3>
          <div class="grid grid-cols-4 gap-4">
            <div class="space-y-2">
              <div class="w-full h-12 bg-[var(--vscode-button-background)] rounded border border-[var(--vscode-panel-border)]"></div>
              <p class="text-xs text-[var(--vscode-foreground)]">Button</p>
            </div>
            <div class="space-y-2">
              <div class="w-full h-12 bg-[var(--vscode-editor-background)] rounded border border-[var(--vscode-panel-border)]"></div>
              <p class="text-xs text-[var(--vscode-foreground)]">Editor</p>
            </div>
            <div class="space-y-2">
              <div class="w-full h-12 bg-[var(--vscode-list-hoverBackground)] rounded border border-[var(--vscode-panel-border)]"></div>
              <p class="text-xs text-[var(--vscode-foreground)]">Hover</p>
            </div>
            <div class="space-y-2">
              <div class="w-full h-12 bg-[var(--vscode-errorForeground)] rounded border border-[var(--vscode-panel-border)]"></div>
              <p class="text-xs text-[var(--vscode-foreground)]">Error</p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
    });

    const colorContainer = page.locator('#color-test-container');
    await expect(colorContainer).toHaveScreenshot('color-swatches.png');

    // Clean up
    await page.evaluate(() => {
      const container = document.getElementById('color-test-container');
      if (container) container.remove();
    });
  });

  test('should handle responsive design correctly', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Create responsive test content
      await page.evaluate(() => {
        const existing = document.getElementById('responsive-test-container');
        if (existing) existing.remove();
        
        const container = document.createElement('div');
        container.id = 'responsive-test-container';
        container.className = 'p-4 bg-[var(--vscode-editor-background)]';
        container.innerHTML = `
          <div class="w-full space-y-4">
            <h3 class="text-lg font-semibold text-[var(--vscode-foreground)]">Responsive Test</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="p-4 border border-[var(--vscode-panel-border)] rounded">Item 1</div>
              <div class="p-4 border border-[var(--vscode-panel-border)] rounded">Item 2</div>
              <div class="p-4 border border-[var(--vscode-panel-border)] rounded">Item 3</div>
            </div>
            <div class="flex flex-col sm:flex-row gap-2">
              <button class="flex-1 p-2 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] rounded">Button 1</button>
              <button class="flex-1 p-2 bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] rounded">Button 2</button>
            </div>
          </div>
        `;
        document.body.appendChild(container);
      });

      const responsiveContainer = page.locator('#responsive-test-container');
      await expect(responsiveContainer).toHaveScreenshot(`responsive-${viewport.name}.png`);
    }

    // Clean up
    await page.evaluate(() => {
      const container = document.getElementById('responsive-test-container');
      if (container) container.remove();
    });
  });
});
