/**
 * Test Script for Telemetry & Accessibility Implementation
 * 
 * This script validates the implementation of Sprint 15 (Telemetry) and Sprint 16 (Accessibility)
 * Run with: node scripts/test-telemetry-accessibility.js
 */

const fs = require('fs');
const path = require('path');

class ImplementationTester {
    constructor() {
        this.results = {
            telemetry: {
                passed: 0,
                failed: 0,
                tests: []
            },
            accessibility: {
                passed: 0,
                failed: 0,
                tests: []
            }
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting Telemetry & Accessibility Implementation Tests\n');
        
        await this.testTelemetryImplementation();
        await this.testAccessibilityImplementation();
        
        this.printResults();
    }

    /**
     * Test telemetry implementation
     */
    async testTelemetryImplementation() {
        console.log('📊 Testing Telemetry Implementation...\n');

        // Test 1: TelemetryService exists
        this.testFileExists(
            'src/telemetry/telemetryService.ts',
            'TelemetryService file exists',
            'telemetry'
        );

        // Test 2: SettingsView exists
        this.testFileExists(
            'webview-react/src/components/SettingsView.tsx',
            'SettingsView component exists',
            'telemetry'
        );

        // Test 3: Package.json has telemetry setting
        this.testPackageJsonTelemetrySetting();

        // Test 4: SearchManager has telemetry integration
        this.testSearchManagerTelemetry();

        // Test 5: IndexingService has telemetry integration
        this.testIndexingServiceTelemetry();

        // Test 6: MessageRouter has settings handlers
        this.testMessageRouterHandlers();
    }

    /**
     * Test accessibility implementation
     */
    async testAccessibilityImplementation() {
        console.log('\n♿ Testing Accessibility Implementation...\n');

        // Test 1: CSS has screen reader classes
        this.testScreenReaderCSS();

        // Test 2: SettingsView has ARIA attributes
        this.testSettingsViewAccessibility();

        // Test 3: QueryView has ARIA attributes
        this.testQueryViewAccessibility();

        // Test 4: VS Code theme variables are used
        this.testVSCodeThemeVariables();
    }

    /**
     * Test if file exists
     */
    testFileExists(filePath, testName, category) {
        const fullPath = path.join(process.cwd(), filePath);
        const exists = fs.existsSync(fullPath);
        
        this.recordTest(category, testName, exists, 
            exists ? `✅ ${filePath} exists` : `❌ ${filePath} not found`);
    }

    /**
     * Test package.json telemetry setting
     */
    testPackageJsonTelemetrySetting() {
        try {
            const packagePath = path.join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            const hasTelemetrySetting = packageJson.contributes?.configuration?.properties?.['code-context-engine.enableTelemetry'];
            
            this.recordTest('telemetry', 'Package.json has telemetry setting', !!hasTelemetrySetting,
                hasTelemetrySetting ? '✅ Telemetry setting found in package.json' : '❌ Telemetry setting missing');
        } catch (error) {
            this.recordTest('telemetry', 'Package.json has telemetry setting', false, `❌ Error reading package.json: ${error.message}`);
        }
    }

    /**
     * Test SearchManager telemetry integration
     */
    testSearchManagerTelemetry() {
        try {
            const searchManagerPath = path.join(process.cwd(), 'src/searchManager.ts');
            const content = fs.readFileSync(searchManagerPath, 'utf8');
            
            const hasTelemetryImport = content.includes('TelemetryService');
            const hasTelemetryTracking = content.includes('trackEvent');
            
            this.recordTest('telemetry', 'SearchManager has telemetry integration', 
                hasTelemetryImport && hasTelemetryTracking,
                `${hasTelemetryImport ? '✅' : '❌'} Import found, ${hasTelemetryTracking ? '✅' : '❌'} Tracking calls found`);
        } catch (error) {
            this.recordTest('telemetry', 'SearchManager has telemetry integration', false, `❌ Error: ${error.message}`);
        }
    }

    /**
     * Test IndexingService telemetry integration
     */
    testIndexingServiceTelemetry() {
        try {
            const indexingServicePath = path.join(process.cwd(), 'src/indexing/indexingService.ts');
            const content = fs.readFileSync(indexingServicePath, 'utf8');
            
            const hasTelemetryImport = content.includes('TelemetryService');
            const hasTelemetryTracking = content.includes('trackEvent');
            
            this.recordTest('telemetry', 'IndexingService has telemetry integration', 
                hasTelemetryImport && hasTelemetryTracking,
                `${hasTelemetryImport ? '✅' : '❌'} Import found, ${hasTelemetryTracking ? '✅' : '❌'} Tracking calls found`);
        } catch (error) {
            this.recordTest('telemetry', 'IndexingService has telemetry integration', false, `❌ Error: ${error.message}`);
        }
    }

    /**
     * Test MessageRouter handlers
     */
    testMessageRouterHandlers() {
        try {
            const messageRouterPath = path.join(process.cwd(), 'src/messageRouter.ts');
            const content = fs.readFileSync(messageRouterPath, 'utf8');
            
            const hasGetSettings = content.includes('handleGetSettings');
            const hasUpdateSettings = content.includes('handleUpdateSettings');
            const hasTrackTelemetry = content.includes('handleTrackTelemetry');
            
            this.recordTest('telemetry', 'MessageRouter has settings handlers', 
                hasGetSettings && hasUpdateSettings && hasTrackTelemetry,
                `${hasGetSettings ? '✅' : '❌'} Get, ${hasUpdateSettings ? '✅' : '❌'} Update, ${hasTrackTelemetry ? '✅' : '❌'} Track handlers`);
        } catch (error) {
            this.recordTest('telemetry', 'MessageRouter has settings handlers', false, `❌ Error: ${error.message}`);
        }
    }

    /**
     * Test screen reader CSS
     */
    testScreenReaderCSS() {
        try {
            const cssPath = path.join(process.cwd(), 'webview-react/src/index.css');
            const content = fs.readFileSync(cssPath, 'utf8');
            
            const hasSrOnly = content.includes('.sr-only');
            const hasHighContrast = content.includes('@media (prefers-contrast: high)');
            const hasReducedMotion = content.includes('@media (prefers-reduced-motion: reduce)');
            
            this.recordTest('accessibility', 'CSS has accessibility features', 
                hasSrOnly && hasHighContrast && hasReducedMotion,
                `${hasSrOnly ? '✅' : '❌'} SR-only, ${hasHighContrast ? '✅' : '❌'} High contrast, ${hasReducedMotion ? '✅' : '❌'} Reduced motion`);
        } catch (error) {
            this.recordTest('accessibility', 'CSS has accessibility features', false, `❌ Error: ${error.message}`);
        }
    }

    /**
     * Test SettingsView accessibility
     */
    testSettingsViewAccessibility() {
        try {
            const settingsPath = path.join(process.cwd(), 'webview-react/src/components/SettingsView.tsx');
            const content = fs.readFileSync(settingsPath, 'utf8');
            
            const hasAriaLabels = content.includes('aria-label');
            const hasAriaLive = content.includes('aria-live');
            const hasSemanticHTML = content.includes('role="main"') && content.includes('<section');
            
            this.recordTest('accessibility', 'SettingsView has accessibility features', 
                hasAriaLabels && hasAriaLive && hasSemanticHTML,
                `${hasAriaLabels ? '✅' : '❌'} ARIA labels, ${hasAriaLive ? '✅' : '❌'} Live regions, ${hasSemanticHTML ? '✅' : '❌'} Semantic HTML`);
        } catch (error) {
            this.recordTest('accessibility', 'SettingsView has accessibility features', false, `❌ Error: ${error.message}`);
        }
    }

    /**
     * Test QueryView accessibility
     */
    testQueryViewAccessibility() {
        try {
            const queryPath = path.join(process.cwd(), 'webview-react/src/components/QueryView.tsx');
            const content = fs.readFileSync(queryPath, 'utf8');
            
            const hasAriaLabels = content.includes('aria-label');
            const hasKeyboardHandlers = content.includes('onKeyDown');
            const hasSemanticHTML = content.includes('role="main"') && content.includes('<section');
            
            this.recordTest('accessibility', 'QueryView has accessibility features', 
                hasAriaLabels && hasKeyboardHandlers && hasSemanticHTML,
                `${hasAriaLabels ? '✅' : '❌'} ARIA labels, ${hasKeyboardHandlers ? '✅' : '❌'} Keyboard handlers, ${hasSemanticHTML ? '✅' : '❌'} Semantic HTML`);
        } catch (error) {
            this.recordTest('accessibility', 'QueryView has accessibility features', false, `❌ Error: ${error.message}`);
        }
    }

    /**
     * Test VS Code theme variables
     */
    testVSCodeThemeVariables() {
        try {
            const cssPath = path.join(process.cwd(), 'webview-react/src/index.css');
            const content = fs.readFileSync(cssPath, 'utf8');
            
            const hasVSCodeVars = content.includes('--vscode-');
            const hasFocusBorder = content.includes('--vscode-focusBorder');
            const hasThemeColors = content.includes('--vscode-foreground');
            
            this.recordTest('accessibility', 'VS Code theme variables are used', 
                hasVSCodeVars && hasFocusBorder && hasThemeColors,
                `${hasVSCodeVars ? '✅' : '❌'} VS Code vars, ${hasFocusBorder ? '✅' : '❌'} Focus border, ${hasThemeColors ? '✅' : '❌'} Theme colors`);
        } catch (error) {
            this.recordTest('accessibility', 'VS Code theme variables are used', false, `❌ Error: ${error.message}`);
        }
    }

    /**
     * Record test result
     */
    recordTest(category, name, passed, message) {
        this.results[category].tests.push({ name, passed, message });
        if (passed) {
            this.results[category].passed++;
        } else {
            this.results[category].failed++;
        }
        console.log(`  ${message}`);
    }

    /**
     * Print final results
     */
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n📊 TELEMETRY TESTS:`);
        console.log(`   ✅ Passed: ${this.results.telemetry.passed}`);
        console.log(`   ❌ Failed: ${this.results.telemetry.failed}`);
        
        console.log(`\n♿ ACCESSIBILITY TESTS:`);
        console.log(`   ✅ Passed: ${this.results.accessibility.passed}`);
        console.log(`   ❌ Failed: ${this.results.accessibility.failed}`);
        
        const totalPassed = this.results.telemetry.passed + this.results.accessibility.passed;
        const totalFailed = this.results.telemetry.failed + this.results.accessibility.failed;
        const totalTests = totalPassed + totalFailed;
        
        console.log(`\n🎯 OVERALL:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);
        
        if (totalFailed === 0) {
            console.log('\n🎉 All tests passed! Implementation is complete.');
        } else {
            console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review the implementation.`);
        }
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    const tester = new ImplementationTester();
    tester.runAllTests().catch(console.error);
}

module.exports = ImplementationTester;
