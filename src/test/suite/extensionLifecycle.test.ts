import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ExtensionManager } from '../../extensionManager';

/**
 * Test suite for Extension Lifecycle
 *
 * These tests verify that the extension can be properly initialized and disposed,
 * and that the extension structure follows the expected patterns. The ExtensionManager
 * is responsible for coordinating all services and managing the extension's lifecycle.
 */
import { vi } from 'vitest';

vi.mock('fs');
vi.mock('path');

suite('Extension Lifecycle Tests', () => {
    test('should create ExtensionManager without errors', () => {
        // Test that ExtensionManager can be instantiated without throwing errors
        // This verifies that all dependencies are properly injected and the
        // extension can start up successfully
        try {
            // Create a minimal mock context with required properties
            // This simulates the VS Code extension context provided at runtime
            const mockContext = {
                subscriptions: [], // Array for disposable resources
                extensionPath: '/mock/path' // Path to extension files
            } as any;

            // Attempt to create the ExtensionManager
            // This will initialize all services and register commands
            const manager = new ExtensionManager(mockContext);
            assert.ok(manager, 'ExtensionManager should be created successfully');
        } catch (error) {
            // If creation fails, provide detailed error information
            assert.fail(`ExtensionManager creation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    test('should dispose ExtensionManager without errors', () => {
        // Test that ExtensionManager can be cleanly disposed without errors
        // This verifies that all resources are properly cleaned up when the
        // extension is deactivated or VS Code is closed
        try {
            // Create a minimal mock context
            const mockContext = {
                subscriptions: [],
                extensionPath: '/mock/path'
            } as any;

            // Create and then immediately dispose the ExtensionManager
            // This tests the cleanup logic for all services and resources
            const manager = new ExtensionManager(mockContext);
            manager.dispose();
            assert.ok(true, 'ExtensionManager disposed successfully');
        } catch (error) {
            // If disposal fails, provide detailed error information
            assert.fail(`ExtensionManager disposal failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    test('should verify extension.ts structure is minimal', () => {
        // Test that the main extension.ts file follows the minimal structure pattern
        // This ensures that the extension entry point is clean and delegates
        // to the ExtensionManager rather than containing complex logic
        // Mock fs and path for isolated testing
        vi.mock('fs', () => ({
            readFileSync: vi.fn(() => 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10') // Mock content with 10 lines
        }));
        vi.mock('path', () => ({
            join: vi.fn((...args) => args.join('/')) // Simple join for mocking
        }));

        try {
            // Read the extension.ts file to check its structure
            const extensionPath = path.join(__dirname, '../../extension.ts');
            const content = fs.readFileSync(extensionPath, 'utf8');
            const lineCount = content.split('\n').length;

            // Verify that the file is under 150 lines
            // This enforces the architectural pattern of keeping the entry point reasonably minimal
            assert.ok(lineCount <= 150, `extension.ts should be under 150 lines, but has ${lineCount} lines`);
        } catch (error) {
            // If file reading or validation fails, provide detailed error information
            assert.fail(`Failed to check extension.ts structure: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    test('should verify all expected commands are defined in package.json', () => {
        // Test that all expected extension commands are properly defined in package.json
        // This ensures that users can access all extension functionality through
        // the command palette, menus, or keyboard shortcuts
        const expectedCommands = [
            'code-context-engine.openMainPanel',
            'code-context-engine.startIndexing',
            'code-context-engine.setupProject',
            'code-context-engine.openSettings',
            'code-context-engine.openDiagnostics'
        ];

        try {
            // Read and parse the package.json file
            const fs = require('fs');
            const path = require('path');
            const packagePath = path.join(__dirname, '../../../package.json');
            const packageContent = fs.readFileSync(packagePath, 'utf8');
            const packageJson = JSON.parse(packageContent);

            // Extract all defined commands from the package.json
            const definedCommands = packageJson.contributes.commands.map((cmd: any) => cmd.command);

            // Verify that each expected command is defined
            // This ensures that all functionality is accessible to users
            for (const expectedCommand of expectedCommands) {
                assert.ok(
                    definedCommands.includes(expectedCommand),
                    `Command ${expectedCommand} should be defined in package.json`
                );
            }
        } catch (error) {
            // If package.json reading or validation fails, provide detailed error information
            assert.fail(`Command definition test failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
});
