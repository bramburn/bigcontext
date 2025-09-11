import { test, expect } from '@playwright/test';

/**
 * Comprehensive styling verification test suite
 * Tests Tailwind CSS, Radix UI components, and font loading
 */

test.describe('Styling Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('CSS')) {
        console.log('CSS Log:', msg.text());
      }
    });
    
    // Navigate to the webview
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should load CSS assets correctly', async ({ page }) => {
    // Check if CSS files are loaded
    const cssLinks = await page.locator('link[rel="stylesheet"]').count();
    expect(cssLinks).toBeGreaterThan(0);

    // Check if CSS content is accessible
    const cssLink = page.locator('link[rel="stylesheet"]').first();
    const href = await cssLink.getAttribute('href');
    expect(href).toBeTruthy();

    // Verify CSS file loads without errors
    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
  });

  test('should apply Tailwind utility classes correctly', async ({ page }) => {
    // Create test elements with Tailwind classes
    await page.evaluate(() => {
      const testContainer = document.createElement('div');
      testContainer.id = 'tailwind-test-container';
      testContainer.innerHTML = `
        <div class="flex p-4 bg-blue-500 text-white rounded-lg shadow-md">
          <div class="w-full h-16 min-h-screen"></div>
        </div>
      `;
      document.body.appendChild(testContainer);
    });

    // Test flex layout
    const flexElement = page.locator('#tailwind-test-container .flex');
    await expect(flexElement).toHaveCSS('display', 'flex');

    // Test padding
    await expect(flexElement).toHaveCSS('padding', '16px');

    // Test background color (blue-500)
    const bgColor = await flexElement.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toMatch(/rgb\(59,\s*130,\s*246\)|#3b82f6/i);

    // Test text color
    await expect(flexElement).toHaveCSS('color', /rgb\(255,\s*255,\s*255\)|#ffffff/);

    // Test border radius
    const borderRadius = await flexElement.evaluate(el => 
      window.getComputedStyle(el).borderRadius
    );
    expect(borderRadius).toBe('8px');

    // Test width and height
    const childElement = flexElement.locator('div');
    await expect(childElement).toHaveCSS('width', /100%/);
    await expect(childElement).toHaveCSS('height', '64px');
    await expect(childElement).toHaveCSS('min-height', /100vh/);

    // Clean up
    await page.evaluate(() => {
      const container = document.getElementById('tailwind-test-container');
      if (container) container.remove();
    });
  });

  test('should load fonts correctly', async ({ page }) => {
    // Check if VS Code font variables are defined
    const fontFamily = await page.evaluate(() => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      return rootStyles.getPropertyValue('--vscode-font-family');
    });
    
    expect(fontFamily).toBeTruthy();
    expect(fontFamily).toContain('Segoe UI');

    // Test font rendering on body
    const bodyFontFamily = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).fontFamily
    );
    expect(bodyFontFamily).toMatch(/Segoe UI|system-ui|sans-serif/i);

    // Check font smoothing
    const fontSmoothing = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).webkitFontSmoothing
    );
    expect(fontSmoothing).toBe('antialiased');
  });

  test('should apply VS Code theme variables', async ({ page }) => {
    // Check if VS Code CSS variables are defined
    const themeVars = await page.evaluate(() => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      return {
        fontFamily: rootStyles.getPropertyValue('--vscode-font-family'),
        foreground: rootStyles.getPropertyValue('--vscode-foreground'),
        background: rootStyles.getPropertyValue('--vscode-editor-background'),
        border: rootStyles.getPropertyValue('--vscode-panel-border')
      };
    });

    expect(themeVars.fontFamily).toBeTruthy();
    expect(themeVars.foreground).toBeTruthy();
    expect(themeVars.background).toBeTruthy();
    expect(themeVars.border).toBeTruthy();

    // Test that body uses theme variables
    const bodyStyles = await page.locator('body').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });

    expect(bodyStyles.color).toMatch(/rgb\(204,\s*204,\s*204\)|#cccccc/i);
    expect(bodyStyles.backgroundColor).toMatch(/rgb\(30,\s*30,\s*30\)|#1e1e1e/i);
  });

  test('should handle responsive design correctly', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Create responsive test element
      await page.evaluate(() => {
        const existing = document.getElementById('responsive-test');
        if (existing) existing.remove();
        
        const testElement = document.createElement('div');
        testElement.id = 'responsive-test';
        testElement.className = 'w-full min-h-screen p-4 md:p-8 lg:p-12';
        document.body.appendChild(testElement);
      });

      const element = page.locator('#responsive-test');
      await expect(element).toHaveCSS('width', /100%/);
      await expect(element).toHaveCSS('min-height', /100vh/);
      
      // Check padding based on viewport
      const padding = await element.evaluate(el => 
        window.getComputedStyle(el).padding
      );
      
      if (viewport.width >= 1024) {
        expect(padding).toBe('48px'); // lg:p-12
      } else if (viewport.width >= 768) {
        expect(padding).toBe('32px'); // md:p-8
      } else {
        expect(padding).toBe('16px'); // p-4
      }
    }

    // Clean up
    await page.evaluate(() => {
      const element = document.getElementById('responsive-test');
      if (element) element.remove();
    });
  });

  test('should handle CSS loading diagnostics', async ({ page }) => {
    // Wait for CSS diagnostics to run
    await page.waitForTimeout(1000);

    // Check if diagnostics were logged
    const diagnosticsLogs = await page.evaluate(() => {
      return window.cssLoadingDiagnostics || null;
    });

    expect(diagnosticsLogs).toBeTruthy();
    expect(diagnosticsLogs.startTime).toBeTruthy();
    expect(diagnosticsLogs.cssLoaded).toBe(true);
    expect(diagnosticsLogs.errors).toHaveLength(0);
  });

  test('should not have CSS-related console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Filter for CSS-related errors
    const cssErrors = errors.filter(error => 
      error.toLowerCase().includes('css') || 
      error.toLowerCase().includes('stylesheet') ||
      error.toLowerCase().includes('font')
    );

    expect(cssErrors).toHaveLength(0);
  });

  test('should maintain consistent styling across page reloads', async ({ page }) => {
    // Get initial styles
    const initialStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        fontFamily: styles.fontFamily,
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get styles after reload
    const reloadedStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        fontFamily: styles.fontFamily,
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });

    // Compare styles
    expect(reloadedStyles.fontFamily).toBe(initialStyles.fontFamily);
    expect(reloadedStyles.color).toBe(initialStyles.color);
    expect(reloadedStyles.backgroundColor).toBe(initialStyles.backgroundColor);
  });
});
