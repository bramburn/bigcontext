import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionManager } from '../../extensionManager';

suite('Extension Lifecycle Tests', () => {
    test('should create ExtensionManager without errors', () => {
        // This test verifies that ExtensionManager can be instantiated
        try {
            // Create a minimal mock context
            const mockContext = {
                subscriptions: [],
                extensionPath: '/mock/path'
            } as any;

            const manager = new ExtensionManager(mockContext);
            assert.ok(manager, 'ExtensionManager should be created successfully');
        } catch (error) {
            assert.fail(`ExtensionManager creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    test('should dispose ExtensionManager without errors', () => {
        // This test verifies that ExtensionManager can be disposed cleanly
        try {
            const mockContext = {
                subscriptions: [],
                extensionPath: '/mock/path'
            } as any;

            const manager = new ExtensionManager(mockContext);
            manager.dispose();
            assert.ok(true, 'ExtensionManager disposed successfully');
        } catch (error) {
            assert.fail(`ExtensionManager disposal failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    test('should verify extension.ts structure is minimal', () => {
        // This test verifies that extension.ts meets the line count requirement
        const fs = require('fs');
        const path = require('path');

        try {
            const extensionPath = path.join(__dirname, '../../extension.ts');
            const content = fs.readFileSync(extensionPath, 'utf8');
            const lineCount = content.split('\n').length;

            assert.ok(lineCount <= 50, `extension.ts should be under 50 lines, but has ${lineCount} lines`);
        } catch (error) {
            assert.fail(`Failed to check extension.ts structure: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    test('should verify all expected commands are defined in package.json', () => {
        // This test verifies that all commands are properly defined
        const expectedCommands = [
            'code-context-engine.openMainPanel',
            'code-context-engine.startIndexing',
            'code-context-engine.setupProject',
            'code-context-engine.openSettings',
            'code-context-engine.openDiagnostics'
        ];

        try {
            const fs = require('fs');
            const path = require('path');
            const packagePath = path.join(__dirname, '../../../package.json');
            const packageContent = fs.readFileSync(packagePath, 'utf8');
            const packageJson = JSON.parse(packageContent);

            const definedCommands = packageJson.contributes.commands.map((cmd: any) => cmd.command);

            for (const expectedCommand of expectedCommands) {
                assert.ok(
                    definedCommands.includes(expectedCommand),
                    `Command ${expectedCommand} should be defined in package.json`
                );
            }
        } catch (error) {
            assert.fail(`Command definition test failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
});
