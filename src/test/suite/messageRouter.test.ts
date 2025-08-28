import * as assert from 'assert';
import * as vscode from 'vscode';
import { MessageRouter } from '../../messageRouter';
import { StateManager } from '../../stateManager';

suite('MessageRouter Tests', () => {
    let messageRouter: MessageRouter;
    let mockContext: vscode.ExtensionContext;
    let mockStateManager: StateManager;
    let mockContextService: any;
    let mockIndexingService: any;
    let mockWebview: any;
    let receivedMessages: any[];

    setup(() => {
        // Create mock services
        mockContext = {
            extensionUri: vscode.Uri.file('/mock/extension/path'),
            extensionPath: '/mock/extension/path',
            subscriptions: []
        } as any;

        mockStateManager = new StateManager();

        mockContextService = {
            queryContext: (query: any) => Promise.resolve([
                { file: 'test.ts', content: 'test content', similarity: 0.8 }
            ]),
            findRelatedFiles: (query: string) => Promise.resolve([
                { file: 'related.ts', similarity: 0.7 }
            ])
        };

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

        // Mock webview that captures posted messages
        receivedMessages = [];
        mockWebview = {
            postMessage: (message: any) => {
                receivedMessages.push(message);
                return Promise.resolve();
            }
        };

        messageRouter = new MessageRouter(
            mockContextService,
            mockIndexingService,
            mockContext,
            mockStateManager
        );
    });

    teardown(() => {
        if (mockStateManager) {
            mockStateManager.dispose();
        }
        receivedMessages = [];
    });

    test('should create MessageRouter with required services', () => {
        assert.ok(messageRouter, 'MessageRouter should be created successfully');
    });

    test('should handle startIndexing message when not already indexing', async () => {
        // Ensure indexing is not in progress
        mockStateManager.setIndexing(false);

        const message = {
            command: 'startIndexing',
            requestId: 'test-123'
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that a response was sent
        assert.strictEqual(receivedMessages.length, 1, 'Should send one response message');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'startIndexing', 'Response should have correct command');
        assert.strictEqual(response.requestId, 'test-123', 'Response should have correct requestId');
        assert.ok(response.result, 'Response should contain result');
    });

    test('should reject startIndexing message when already indexing', async () => {
        // Set indexing state to true
        mockStateManager.setIndexing(true, 'Test indexing in progress');

        const message = {
            command: 'startIndexing',
            requestId: 'test-456'
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that an error response was sent
        assert.strictEqual(receivedMessages.length, 1, 'Should send one error response');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'startIndexing', 'Response should have correct command');
        assert.strictEqual(response.requestId, 'test-456', 'Response should have correct requestId');
        assert.ok(response.error, 'Response should contain error message');
        assert.ok(response.error.includes('already in progress'), 'Error should mention indexing in progress');
    });

    test('should handle search message correctly', async () => {
        const message = {
            command: 'search',
            requestId: 'search-123',
            query: 'test query'
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that a response was sent
        assert.strictEqual(receivedMessages.length, 1, 'Should send one response message');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'searchResponse', 'Response should have correct command');
        assert.strictEqual(response.requestId, 'search-123', 'Response should have correct requestId');
        assert.ok(response.data, 'Response should contain search results');
    });

    test('should handle unknown command gracefully', async () => {
        const message = {
            command: 'unknownCommand',
            requestId: 'unknown-123'
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that an error response was sent
        assert.strictEqual(receivedMessages.length, 1, 'Should send one error response');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'unknownCommand', 'Response should have correct command');
        assert.strictEqual(response.requestId, 'unknown-123', 'Response should have correct requestId');
        assert.ok(response.error, 'Response should contain error message');
        assert.ok(response.error.includes('Unknown command'), 'Error should mention unknown command');
    });

    test('should handle message with missing query parameter', async () => {
        const message = {
            command: 'search',
            requestId: 'search-no-query'
            // Missing query parameter
        };

        await messageRouter.handleMessage(message, mockWebview);

        // Check that an error response was sent
        assert.strictEqual(receivedMessages.length, 1, 'Should send one error response');
        const response = receivedMessages[0];
        assert.ok(response.error, 'Response should contain error message');
        assert.ok(response.error.includes('required'), 'Error should mention required parameter');
    });

    test('should verify StateManager integration', () => {
        // Test that StateManager methods work correctly
        assert.strictEqual(mockStateManager.isIndexing(), false, 'Initial indexing state should be false');
        
        mockStateManager.setIndexing(true, 'Test message');
        assert.strictEqual(mockStateManager.isIndexing(), true, 'Indexing state should be true after setting');
        assert.strictEqual(mockStateManager.getIndexingMessage(), 'Test message', 'Indexing message should be set');
        
        mockStateManager.setIndexing(false);
        assert.strictEqual(mockStateManager.isIndexing(), false, 'Indexing state should be false after clearing');
    });

    test('should handle error during message processing', async () => {
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
        assert.strictEqual(receivedMessages.length, 1, 'Should send one error response');
        const response = receivedMessages[0];
        assert.strictEqual(response.command, 'startIndexing', 'Response should have correct command');
        assert.ok(response.error, 'Response should contain error message');
        assert.ok(response.error.includes('Test indexing error'), 'Error should contain original error message');
    });

    test('should verify message routing architecture', () => {
        // This test verifies that the MessageRouter follows the expected architecture
        assert.strictEqual(typeof messageRouter.handleMessage, 'function', 'handleMessage should be a function');

        // Verify that the router can be used with different webview instances
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
