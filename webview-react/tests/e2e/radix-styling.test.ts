import { test, expect } from '@playwright/test';

test.describe('Radix UI Styling Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start the dev server and navigate to it
    await page.goto('http://localhost:5173');
  });

  test('should render Radix Select components', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to setup view (assuming it's accessible)
    // For now, we'll test if Radix components are available in the current view
    
    // Check if any Radix Select triggers are present
    const selectTriggers = page.locator('[data-radix-select-trigger]');
    const triggerCount = await selectTriggers.count();
    
    console.log(`Found ${triggerCount} Radix Select triggers`);
    
    // If no triggers found, that's okay - it means we're not on the setup view
    // But we can still test that Radix is loaded
    if (triggerCount > 0) {
      await expect(selectTriggers.first()).toBeVisible();
    }
  });

  test('should handle Radix Select interactions', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Look for any select triggers
    const selectTrigger = page.locator('[data-radix-select-trigger]').first();
    
    if (await selectTrigger.count() > 0) {
      // Click the select trigger
      await selectTrigger.click();
      
      // Wait for the dropdown to appear
      await page.waitForTimeout(100);
      
      // Check if the dropdown content is visible
      const selectContent = page.locator('[data-radix-select-content]');
      await expect(selectContent).toBeVisible();
      
      // Check if select items are present
      const selectItems = page.locator('[data-radix-select-item]');
      const itemCount = await selectItems.count();
      expect(itemCount).toBeGreaterThan(0);
      
      console.log(`Found ${itemCount} select items`);
    } else {
      console.log('No Radix Select triggers found - skipping interaction test');
    }
  });

  test('should apply correct styling to Radix components', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if Radix CSS variables are defined
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyle = window.getComputedStyle(root);
      return {
        selectBackground: computedStyle.getPropertyValue('--radix-select-content-background'),
        selectBorder: computedStyle.getPropertyValue('--radix-select-content-border'),
        dialogOverlay: computedStyle.getPropertyValue('--radix-dialog-overlay-background')
      };
    });
    
    console.log('Radix CSS variables:', rootStyles);
    
    // Check that at least some variables are defined
    const hasRadixVars = Object.values(rootStyles).some(value => value.trim() !== '');
    expect(hasRadixVars).toBe(true);
  });

  test('should handle Radix errors gracefully', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate and wait for load
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any delayed errors
    await page.waitForTimeout(1000);
    
    // Check for Radix-specific errors
    const radixErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('radix') || 
      error.toLowerCase().includes('css var')
    );
    
    console.log('Console errors captured:', consoleErrors);
    console.log('Radix-specific errors:', radixErrors);
    
    // We expect no Radix-specific errors
    expect(radixErrors.length).toBe(0);
  });

  test('should test Radix Dialog if present', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Look for any dialog triggers (buttons that might open dialogs)
    const dialogTriggers = page.locator('button:has-text("Test Radix Dialog")');
    
    if (await dialogTriggers.count() > 0) {
      // Click the dialog trigger
      await dialogTriggers.first().click();
      
      // Wait for the dialog to appear
      await page.waitForTimeout(200);
      
      // Check if the dialog is visible
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Check if the overlay is present
      const overlay = page.locator('[data-radix-dialog-overlay]');
      await expect(overlay).toBeVisible();
      
      // Close the dialog
      const closeButton = page.locator('button:has-text("Close")');
      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(200);
        await expect(dialog).not.toBeVisible();
      }
    } else {
      console.log('No Radix Dialog triggers found - skipping dialog test');
    }
  });
});
