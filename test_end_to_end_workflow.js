/**
 * End-to-End Workflow Test
 * 
 * This script tests the complete indexing workflow:
 * 1. startSetup command handling
 * 2. Setup completion and automatic indexing start
 * 3. IndexingWorker processing files
 * 4. Progress updates and completion
 */

const { MessageRouter } = require('./out/messageRouter');
const { ContextService } = require('./out/context/contextService');
const { IndexingService } = require('./out/indexing/indexingService');
const { StateManager } = require('./out/stateManager');
const { QdrantService } = require('./out/db/qdrantService');
const { EmbeddingProviderFactory } = require('./out/embeddings/embeddingProvider');
const { ConfigService } = require('./out/configService');
const { CentralizedLoggingService } = require('./out/logging/centralizedLoggingService');
const path = require('path');

// Mock VS Code context and webview
const mockContext = {
    globalState: {
        get: () => false,
        update: () => Promise.resolve()
    },
    subscriptions: []
};

const mockWebview = {
    messages: [],
    postMessage: function(message) {
        this.messages.push(message);
        console.log('📤 Webview message:', JSON.stringify(message, null, 2));
        return Promise.resolve();
    }
};

async function testEndToEndWorkflow() {
    console.log('🚀 Starting End-to-End Workflow Test');
    console.log('=====================================');
    
    try {
        // Step 1: Initialize services
        console.log('\n📋 Step 1: Initializing services...');
        
        const workspaceRoot = __dirname;
        const loggingService = new CentralizedLoggingService();
        const configService = new ConfigService();
        const stateManager = new StateManager();
        
        // Mock embedding provider config
        const embeddingConfig = {
            provider: 'ollama',
            model: 'nomic-embed-text',
            baseUrl: 'http://localhost:11434'
        };
        
        const embeddingProvider = await EmbeddingProviderFactory.createProvider(embeddingConfig);
        const qdrantService = new QdrantService('http://localhost:6333', loggingService);
        
        const indexingService = new IndexingService(
            workspaceRoot,
            qdrantService,
            embeddingProvider,
            configService,
            stateManager,
            loggingService
        );
        
        const contextService = new ContextService(
            workspaceRoot,
            qdrantService,
            embeddingProvider,
            indexingService,
            configService,
            loggingService
        );
        
        const messageRouter = new MessageRouter(
            contextService,
            indexingService,
            stateManager,
            mockContext
        );
        
        console.log('✅ Services initialized successfully');
        
        // Step 2: Test startSetup command
        console.log('\n📋 Step 2: Testing startSetup command...');
        
        const setupMessage = {
            command: 'startSetup',
            database: 'qdrant',
            provider: 'ollama',
            databaseConfig: {
                url: 'http://localhost:6333'
            },
            providerConfig: {
                baseUrl: 'http://localhost:11434',
                model: 'nomic-embed-text'
            }
        };
        
        await messageRouter.handleMessage(setupMessage, mockWebview);
        
        // Check if setupComplete message was sent
        const setupCompleteMessage = mockWebview.messages.find(msg => msg.command === 'setupComplete');
        if (setupCompleteMessage) {
            console.log('✅ Setup completed successfully');
        } else {
            console.log('❌ Setup completion message not found');
            return false;
        }
        
        // Step 3: Check for indexing progress messages
        console.log('\n📋 Step 3: Checking indexing progress...');
        
        // Wait a bit for indexing to start and send progress messages
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const progressMessages = mockWebview.messages.filter(msg => msg.command === 'indexingProgress');
        const completeMessages = mockWebview.messages.filter(msg => msg.command === 'indexingComplete');
        const errorMessages = mockWebview.messages.filter(msg => msg.command === 'indexingError');
        
        console.log(`📊 Progress messages: ${progressMessages.length}`);
        console.log(`✅ Complete messages: ${completeMessages.length}`);
        console.log(`❌ Error messages: ${errorMessages.length}`);
        
        // Step 4: Verify final state
        console.log('\n📋 Step 4: Verifying final state...');
        
        if (completeMessages.length > 0) {
            const completeMessage = completeMessages[0];
            console.log(`✅ Indexing completed with ${completeMessage.chunksCreated} chunks`);
            console.log(`⏱️  Duration: ${completeMessage.duration}ms`);
            console.log(`⚠️  Errors: ${completeMessage.errors?.length || 0}`);
            return true;
        } else if (errorMessages.length > 0) {
            console.log(`❌ Indexing failed with error: ${errorMessages[0].error}`);
            return false;
        } else {
            console.log('⏳ Indexing still in progress or no completion message received');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Run the test
console.log('🧪 End-to-End Workflow Test');
console.log('Testing: startup form → startSetup command → indexing page → file processing');

testEndToEndWorkflow()
    .then((success) => {
        console.log('\n=====================================');
        console.log(`🏁 Test Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log('=====================================');
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('\n❌ Test crashed:', error);
        process.exit(1);
    });
