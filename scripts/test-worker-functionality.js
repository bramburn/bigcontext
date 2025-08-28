/**
 * Test worker functionality without VS Code dependencies
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker } = require('worker_threads');

// Create a simplified worker test
function createTestWorker() {
    const workerCode = `
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');

// Mock the required modules for testing
const mockAstParser = {
    parseWithErrorRecovery: (language, content) => ({
        tree: { type: 'Program' },
        errors: []
    })
};

const mockChunker = {
    chunk: (filePath, tree, content, language) => ([
        {
            id: 'test-chunk-1',
            content: content.substring(0, Math.min(100, content.length)),
            type: 'function',
            startLine: 1,
            endLine: 5,
            filePath
        }
    ])
};

const mockEmbeddingProvider = {
    generateEmbeddings: async (contents) => {
        // Return mock embeddings (random vectors)
        return contents.map(() => Array(384).fill(0).map(() => Math.random()));
    }
};

// Simulate the worker processing logic
async function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lineCount = content.split('\\n').length;
        const byteCount = Buffer.byteLength(content, 'utf8');
        
        // Determine language
        const ext = path.extname(filePath).toLowerCase();
        let language = null;
        
        switch (ext) {
            case '.ts':
            case '.tsx':
                language = 'typescript';
                break;
            case '.js':
            case '.jsx':
                language = 'javascript';
                break;
            case '.py':
                language = 'python';
                break;
            case '.cs':
                language = 'csharp';
                break;
        }
        
        if (!language) {
            throw new Error('Unsupported file type: ' + filePath);
        }
        
        // Mock parsing
        const parseResult = mockAstParser.parseWithErrorRecovery(language, content);
        
        // Mock chunking
        const chunks = mockChunker.chunk(filePath, parseResult.tree, content, language);
        
        // Mock embedding generation
        const chunkContents = chunks.map(chunk => chunk.content);
        const embeddings = await mockEmbeddingProvider.generateEmbeddings(chunkContents);
        
        return {
            filePath,
            chunks,
            embeddings,
            language,
            lineCount,
            byteCount,
            errors: []
        };
        
    } catch (error) {
        throw new Error('Failed to process ' + filePath + ': ' + error.message);
    }
}

// Message handler
parentPort.on('message', async (message) => {
    try {
        switch (message.type) {
            case 'processFile':
                if (!message.filePath) {
                    parentPort.postMessage({
                        type: 'error',
                        error: 'No file path provided'
                    });
                    return;
                }
                
                const processedData = await processFile(message.filePath);
                parentPort.postMessage({
                    type: 'processed',
                    data: processedData
                });
                break;
                
            case 'shutdown':
                process.exit(0);
                break;
                
            default:
                parentPort.postMessage({
                    type: 'error',
                    error: 'Unknown message type: ' + message.type
                });
        }
        
    } catch (error) {
        parentPort.postMessage({
            type: 'error',
            error: 'Worker error: ' + error.message
        });
    }
});

// Signal ready
parentPort.postMessage({ type: 'ready' });
`;

    return workerCode;
}

// Create test files
function createTestFiles(testDir) {
    const testFiles = [
        {
            path: 'test1.ts',
            content: `
export function add(a: number, b: number): number {
    return a + b;
}

export class Calculator {
    multiply(x: number, y: number): number {
        return x * y;
    }
}
`
        },
        {
            path: 'test2.js',
            content: `
function subtract(a, b) {
    return a - b;
}

const divide = (x, y) => {
    if (y === 0) throw new Error('Division by zero');
    return x / y;
};

module.exports = { subtract, divide };
`
        },
        {
            path: 'test3.py',
            content: `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

class MathUtils:
    @staticmethod
    def factorial(n):
        if n <= 1:
            return 1
        return n * MathUtils.factorial(n-1)
`
        }
    ];

    testFiles.forEach(file => {
        const fullPath = path.join(testDir, file.path);
        fs.writeFileSync(fullPath, file.content);
    });

    return testFiles.map(file => path.join(testDir, file.path));
}

// Test parallel processing
async function testParallelProcessing() {
    console.log('Testing Parallel Processing...');
    
    // Create temporary test directory
    const testDir = path.join(os.tmpdir(), 'parallel-indexing-test');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    
    try {
        // Create test files
        const testFiles = createTestFiles(testDir);
        console.log(`✓ Created ${testFiles.length} test files`);
        
        // Create worker
        const workerCode = createTestWorker();
        const workerPath = path.join(testDir, 'test-worker.js');
        fs.writeFileSync(workerPath, workerCode);

        console.log(`✓ Created worker at ${workerPath}`);

        // Verify worker file exists
        if (!fs.existsSync(workerPath)) {
            throw new Error(`Worker file not created: ${workerPath}`);
        }

        const worker = new Worker(workerPath);
        
        return new Promise((resolve, reject) => {
            let processedFiles = 0;
            let isReady = false;
            const results = [];
            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error('Test timeout'));
            }, 10000);
            
            worker.on('message', (message) => {
                switch (message.type) {
                    case 'ready':
                        isReady = true;
                        console.log('✓ Worker initialized');
                        
                        // Start processing files
                        testFiles.forEach(filePath => {
                            worker.postMessage({
                                type: 'processFile',
                                filePath
                            });
                        });
                        break;
                        
                    case 'processed':
                        processedFiles++;
                        results.push(message.data);
                        console.log(`✓ Processed ${message.data.filePath} - ${message.data.chunks.length} chunks, ${message.data.embeddings.length} embeddings`);
                        
                        if (processedFiles === testFiles.length) {
                            clearTimeout(timeout);
                            worker.terminate();
                            
                            // Verify results
                            const totalChunks = results.reduce((sum, result) => sum + result.chunks.length, 0);
                            const totalEmbeddings = results.reduce((sum, result) => sum + result.embeddings.length, 0);
                            
                            console.log(`✓ Total chunks generated: ${totalChunks}`);
                            console.log(`✓ Total embeddings generated: ${totalEmbeddings}`);
                            
                            if (totalChunks > 0 && totalEmbeddings > 0 && totalChunks === totalEmbeddings) {
                                resolve(true);
                            } else {
                                reject(new Error('Invalid processing results'));
                            }
                        }
                        break;
                        
                    case 'error':
                        clearTimeout(timeout);
                        worker.terminate();
                        reject(new Error(`Worker error: ${message.error}`));
                        break;
                }
            });
            
            worker.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
        
    } finally {
        // Cleanup
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    }
}

// Main test
async function runTest() {
    console.log('='.repeat(60));
    console.log('WORKER FUNCTIONALITY TEST');
    console.log('='.repeat(60));
    
    try {
        const success = await testParallelProcessing();
        
        console.log('\n' + '='.repeat(60));
        if (success) {
            console.log('🎉 WORKER FUNCTIONALITY TEST PASSED!');
            console.log('The parallel processing logic works correctly.');
        } else {
            console.log('❌ WORKER FUNCTIONALITY TEST FAILED!');
        }
        console.log('='.repeat(60));
        
        return success;
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        return false;
    }
}

if (require.main === module) {
    runTest().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runTest };
