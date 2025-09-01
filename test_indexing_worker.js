/**
 * Test script to debug the IndexingWorker with a Python file
 */

const { Worker } = require('worker_threads');
const path = require('path');

async function testIndexingWorker() {
    console.log('=== Testing IndexingWorker ===');
    
    // Create worker with embedding configuration
    const workerData = {
        embeddingConfig: {
            provider: 'ollama',
            model: 'nomic-embed-text',
            baseUrl: 'http://localhost:11434'
        }
    };
    
    const workerPath = path.join(__dirname, 'out', 'indexing', 'indexingWorker.js');
    console.log(`Worker path: ${workerPath}`);
    
    const worker = new Worker(workerPath, { workerData });
    
    return new Promise((resolve, reject) => {
        let workerReady = false;
        
        worker.on('message', (message) => {
            console.log('Received message from worker:', message);
            
            if (message.type === 'ready') {
                workerReady = true;
                console.log('✅ Worker is ready, sending test file...');
                
                // Send our test Python file for processing
                const testFilePath = path.join(__dirname, 'test_python_file.py');
                worker.postMessage({
                    type: 'processFile',
                    filePath: testFilePath,
                    workspaceRoot: __dirname
                });
                
            } else if (message.type === 'processed') {
                console.log('✅ File processed successfully!');
                console.log(`Chunks created: ${message.data.chunks.length}`);
                console.log(`Embeddings generated: ${message.data.embeddings.length}`);
                console.log(`Language detected: ${message.data.language}`);
                console.log(`Errors: ${message.data.errors.length}`);
                
                worker.terminate();
                resolve(true);
                
            } else if (message.type === 'error') {
                console.error('❌ Worker error:', message.error);
                worker.terminate();
                resolve(false);
            }
        });
        
        worker.on('error', (error) => {
            console.error('❌ Worker thread error:', error);
            reject(error);
        });
        
        worker.on('exit', (code) => {
            console.log(`Worker exited with code: ${code}`);
            if (!workerReady) {
                reject(new Error('Worker failed to initialize'));
            }
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
            console.error('❌ Test timed out');
            worker.terminate();
            reject(new Error('Test timeout'));
        }, 30000);
    });
}

// Run the test
testIndexingWorker()
    .then((success) => {
        console.log(`\n=== Test Complete ===`);
        console.log(`Result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    });
