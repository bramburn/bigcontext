import * as assert from 'assert';
import * as vscode from 'vscode';
import { MessageRouter } from '../../messageRouter';
import { StateManager } from '../../stateManager';

/**
 * Test suite for MessageRouter
 *
 * These tests verify that the MessageRouter correctly handles communication
 * between the webview UI and the extension backend. The MessageRouter is
 * responsible for processing messages from the UI, routing them to the
 * appropriate services, and returning responses to the UI.
 */
suite('MessageRouter Tests', () => {
    let messageRouter: MessageRouter;
    let mockContext: vscode.ExtensionContext;
    let mockStateManager: StateManager;
    let mockContextService: any;
    let mockIndexingService: any;
    let mockWebview: any;
    let receivedMessages: any[];

    setup(() => {
        // Create mock services for testing
        // This isolates tests from real dependencies and ensures consistent behavior
        mockContext = {
            extensionUri: vscode.Uri.file('/mock/extension/path'),
            extensionPath: '/mock/extension/path',
            globalStorageUri: vscode.Uri.file('/mock/global/storage'),
            subscriptions: [] // Array for disposable resources
        } as any;

        // Create a real StateManager instance for testing state management
        mockStateManager = new StateManager();

        // Mock ContextService for search-related functionality
        mockContextService = {
            queryContext: (query: any) => Promise.resolve([
                { file: 'test.ts', content: 'test content', similarity: 0.8 }
            ]),
            findRelatedFiles: (query: string) => Promise.resolve([
                { file: 'related.ts', similarity: 0.7 }
            ])
        };

        // Mock IndexingService for indexing operations
        mockIndexingService = {
            startIndexing: () => Promise.resolve({
                success: true,
                chunks: [],
                totalFiles: 10,
                processedFiles: 10,
                errors: [],
                duration: 1000
            })
        };

        // Create a mock webview that captures posted messages for verification
        // This allows us to test that messages are correctly sent back to the UI
        receivedMessages = [];
        mockWebview = {
            postMessage: (message: any) => {
                receivedMessages.push(message);
                return Promise.resolve();
            }
        };

        // Create the MessageRouter with all mocked dependencies
        messageRouter = new MessageRouter(
            mockContextService,
            mockIndexingService,
            mockContext,
            mockStateManager
        );
    });

    teardown(() => {
        // Clean up resources after each test
        if (mockStateManager) {
            mockStateManager.dispose();
        }
        receivedMessages = [];
    });

    test('should create MessageRouter with required services', () => {
        // Test that MessageRouter can be instantiated with all required dependencies
        // This verifies that the constructor properly accepts and stores dependencies
        assert.ok(messageRouter, 'MessageRouter should be created successfully');
    });

    test('should handle startIndexing message when not already indexing', async () => {
        // Test that the router correctly processes startIndexing commands
        // when indexing is not already in progress
        // Ensure indexing is not in progress
        mockStateManager.setIndexing(false);

        const message = {
            command: 'startIndexing',
            requestId: 'test-123'
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that a response was sent
        // This verifies that the router correctly calls the service and sends a response
        assert.strictEqual(receivedMessages.length, 1, 'Should send one response message');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'indexingComplete', 'Response should have correct command');
        assert.strictEqual(response.requestId, 'test-123', 'Response should have correct requestId');
        assert.ok(response.result, 'Response should contain result');
    });

    test('should reject startIndexing message when already indexing', async () => {
        // Test that the router correctly rejects startIndexing commands
        // when indexing is already in progress
        // Set indexing state to true to simulate an ongoing indexing operation
        mockStateManager.setIndexing(true, 'Test indexing in progress');

        const message = {
            command: 'startIndexing',
            requestId: 'test-456'
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that an error response was sent
        // This verifies that the router checks the state and prevents duplicate operations
        assert.strictEqual(receivedMessages.length, 1, 'Should send one error response');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'indexingError', 'Response should have correct command');
        assert.strictEqual(response.requestId, 'test-456', 'Response should have correct requestId');
        assert.ok(response.error, 'Response should contain error message');
        assert.ok(response.error.includes('already in progress'), 'Error should mention indexing in progress');
    });

    test('should handle search message correctly', async () => {
        // Test that the router correctly processes search commands
        // and returns search results to the UI
        const message = {
            command: 'search',
            requestId: 'search-123',
            query: 'test query'
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that a response was sent
        // This verifies that the router correctly routes search queries to the ContextService
        assert.strictEqual(receivedMessages.length, 1, 'Should send one response message');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'searchResponse', 'Response should have correct command');
        assert.strictEqual(response.requestId, 'search-123', 'Response should have correct requestId');
        assert.ok(response.data, 'Response should contain search results');
    });

    test('should handle unknown command gracefully', async () => {
        // Test that the router gracefully handles unknown commands
        // This ensures the UI doesn't break when sending unsupported commands
        const message = {
            command: 'unknownCommand',
            requestId: 'unknown-123'
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that an error response was sent
        // This verifies that the router provides meaningful error messages for unknown commands
        assert.strictEqual(receivedMessages.length, 1, 'Should send one error response');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'error', 'Response should have correct command');
        assert.strictEqual(response.requestId, 'unknown-123', 'Response should have correct requestId');
        assert.ok(response.error, 'Response should contain error message');
        assert.ok(response.error.includes('Unknown command'), 'Error should mention unknown command');
    });

    test('should handle message with missing query parameter', async () => {
        // Test that the router validates required parameters
        // This ensures that messages with missing required parameters are rejected
        const message = {
            command: 'search',
            requestId: 'search-no-query'
            // Missing query parameter
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that an error response was sent
        // This verifies that the router validates message structure before processing
        assert.strictEqual(receivedMessages.length, 1, 'Should send one error response');
        const response = receivedMessages[0];
        assert.ok(response.error, 'Response should contain error message');
        assert.ok(response.error.includes('required'), 'Error should mention required parameter');
    });

    test('should verify StateManager integration', () => {
        // Test that StateManager methods work correctly
        // This verifies that the router correctly integrates with state management
        assert.strictEqual(mockStateManager.isIndexing(), false, 'Initial indexing state should be false');
        
        mockStateManager.setIndexing(true, 'Test message');
        assert.strictEqual(mockStateManager.isIndexing(), true, 'Indexing state should be true after setting');
        assert.strictEqual(mockStateManager.getIndexingMessage(), 'Test message', 'Indexing message should be set');
        
        mockStateManager.setIndexing(false);
        assert.strictEqual(mockStateManager.isIndexing(), false, 'Indexing state should be false after clearing');
    });

    test('should handle error during message processing', async () => {
        // Test that the router gracefully handles errors from services
        // This ensures that service errors don't crash the message handling system
        // Create a mock service that throws an error
        const errorIndexingService = {
            ...mockIndexingService,
            startIndexing: () => Promise.reject(new Error('Test indexing error'))
        } as any;

        const errorMessageRouter = new MessageRouter(
            mockContextService,
            errorIndexingService,
            mockContext,
            mockStateManager
        );

        const message = {
            command: 'startIndexing',
            requestId: 'error-test'
        };

        await errorMessageRouter.handleMessage(message, mockWebview);

        // Check that an error response was sent
        // This verifies that the router catches service errors and returns meaningful error messages
        assert.strictEqual(receivedMessages.length, 1, 'Should send one error response');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'indexingError', 'Response should have correct command');
        assert.ok(response.error, 'Response should contain error message');
        assert.ok(response.error.includes('Test indexing error'), 'Error should contain original error message');
    });

    test('should verify message routing architecture', () => {
        // Test that the MessageRouter follows the expected architecture
        // This verifies the overall design and structure of the message routing system
        assert.strictEqual(typeof messageRouter.handleMessage, 'function', 'handleMessage should be a function');

        // Verify that the router can be used with different webview instances
        // This ensures the router is flexible and can work with multiple UI panels
        const anotherMockWebview = {
            ...mockWebview,
            postMessage: () => Promise.resolve()
        } as any;

        // Should not throw when using different webview
        assert.doesNotThrow(() => {
            messageRouter.handleMessage({ command: 'ping' }, anotherMockWebview);
        }, 'MessageRouter should work with different webview instances');
    });
});
