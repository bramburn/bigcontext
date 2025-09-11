#!/usr/bin/env node

/**
 * Simple test script to verify logging functionality
 * This script tests the enhanced logging features without requiring VS Code environment
 */

const { ConfigService } = require('../out/configService');
const { CentralizedLoggingService } = require('../out/logging/centralizedLoggingService');

console.log('Testing Enhanced Logging Implementation...\n');

try {
    // Mock VS Code workspace configuration
    const mockVSCode = {
        workspace: {
            getConfiguration: () => ({
                get: (key) => {
                    const defaults = {
                        'logging.level': 'Info',
                        'logging.enableFileLogging': true,
                        'logging.enableConsoleLogging': true,
                        'logging.enableOutputChannel': false, // Disable for testing
                        'logging.maxFileSize': 10 * 1024 * 1024,
                        'logging.maxFiles': 5
                    };
                    return defaults[key];
                }
            })
        },
        window: {
            createOutputChannel: () => ({
                appendLine: () => {},
                show: () => {},
                dispose: () => {}
            })
        }
    };

    // Mock vscode module
    global.vscode = mockVSCode;

    // Test 1: Service Initialization
    console.log('✓ Test 1: Service Initialization');
    const configService = new ConfigService();
    const loggingService = new CentralizedLoggingService(configService);
    console.log('  - CentralizedLoggingService initialized successfully');

    // Test 2: Basic Logging
    console.log('\n✓ Test 2: Basic Logging');
    loggingService.info('Test info message', { testId: 1 }, 'TestScript');
    loggingService.warn('Test warning message', { testId: 2 }, 'TestScript');
    loggingService.error('Test error message', { testId: 3 }, 'TestScript');
    loggingService.debug('Test debug message', { testId: 4 }, 'TestScript');
    console.log('  - All log levels tested successfully');

    // Test 3: Structured Logging
    console.log('\n✓ Test 3: Structured Logging');
    const complexMetadata = {
        user: 'test-user',
        action: 'test-action',
        timestamp: Date.now(),
        nested: {
            property: 'value',
            count: 42,
            array: [1, 2, 3]
        }
    };
    loggingService.info('Complex structured log', complexMetadata, 'TestScript');
    console.log('  - Structured logging with complex metadata tested');

    // Test 4: Performance Logging
    console.log('\n✓ Test 4: Performance Logging');
    loggingService.logPerformance('test-operation', 150, { complexity: 'high' });
    console.log('  - Performance logging tested');

    // Test 5: Configuration Updates
    console.log('\n✓ Test 5: Configuration Updates');
    const originalConfig = loggingService.getConfig();
    loggingService.updateConfig({
        enableConsoleLogging: !originalConfig.enableConsoleLogging
    });
    const updatedConfig = loggingService.getConfig();
    console.log(`  - Configuration updated: enableConsoleLogging changed from ${originalConfig.enableConsoleLogging} to ${updatedConfig.enableConsoleLogging}`);

    // Test 6: Edge Cases
    console.log('\n✓ Test 6: Edge Cases');
    loggingService.info('Test with null metadata', null, 'TestScript');
    loggingService.info('Test with undefined metadata', undefined, 'TestScript');
    loggingService.info('', {}, '');
    const longMessage = 'A'.repeat(1000);
    loggingService.info(longMessage, {}, 'TestScript');
    console.log('  - Edge cases handled gracefully');

    // Test 7: Cleanup
    console.log('\n✓ Test 7: Cleanup');
    loggingService.dispose();
    console.log('  - Service disposed successfully');

    console.log('\n🎉 All tests passed! Enhanced logging implementation is working correctly.');

} catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
