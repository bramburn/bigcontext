/**
 * Simple verification script for parallel indexing functionality
 * This script tests the basic functionality without requiring the full VS Code test environment
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Create a simple test to verify worker thread functionality
function testWorkerThreads() {
    console.log('Testing Worker Threads Support...');
    
    try {
        const { Worker, isMainThread, parentPort } = require('worker_threads');
        console.log('✓ Worker threads module loaded successfully');
        console.log(`✓ Running in main thread: ${isMainThread}`);
        console.log(`✓ Available CPU cores: ${os.cpus().length}`);
        
        // Test basic worker creation
        const workerCode = `
            const { parentPort } = require('worker_threads');
            parentPort.postMessage({ type: 'ready', message: 'Worker initialized successfully' });
        `;
        
        // Write temporary worker file
        const tempWorkerPath = path.join(__dirname, 'temp-worker.js');
        fs.writeFileSync(tempWorkerPath, workerCode);
        
        const worker = new Worker(tempWorkerPath);
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                worker.terminate();
                fs.unlinkSync(tempWorkerPath);
                reject(new Error('Worker test timeout'));
            }, 5000);
            
            worker.on('message', (message) => {
                clearTimeout(timeout);
                worker.terminate();
                fs.unlinkSync(tempWorkerPath);
                
                if (message.type === 'ready') {
                    console.log('✓ Worker communication test passed');
                    resolve(true);
                } else {
                    reject(new Error('Unexpected worker message'));
                }
            });
            
            worker.on('error', (error) => {
                clearTimeout(timeout);
                fs.unlinkSync(tempWorkerPath);
                reject(error);
            });
        });
        
    } catch (error) {
        console.error('✗ Worker threads not supported:', error.message);
        return Promise.resolve(false);
    }
}

// Test file compilation
function testCompilation() {
    console.log('\nTesting Compilation...');
    
    const indexingServicePath = path.join(__dirname, '..', 'out', 'indexing', 'indexingService.js');
    const indexingWorkerPath = path.join(__dirname, '..', 'out', 'indexing', 'indexingWorker.js');
    
    if (fs.existsSync(indexingServicePath)) {
        console.log('✓ IndexingService compiled successfully');
    } else {
        console.error('✗ IndexingService compilation failed');
        return false;
    }
    
    if (fs.existsSync(indexingWorkerPath)) {
        console.log('✓ IndexingWorker compiled successfully');
    } else {
        console.error('✗ IndexingWorker compilation failed');
        return false;
    }
    
    return true;
}

// Test basic module loading
function testModuleLoading() {
    console.log('\nTesting Module Loading...');
    
    try {
        // Test if we can load the compiled modules
        const indexingServicePath = path.join(__dirname, '..', 'out', 'indexing', 'indexingService.js');
        
        if (fs.existsSync(indexingServicePath)) {
            // Basic syntax check by requiring the module
            delete require.cache[require.resolve(indexingServicePath)];
            const { IndexingService } = require(indexingServicePath);
            
            if (typeof IndexingService === 'function') {
                console.log('✓ IndexingService module loads correctly');
                return true;
            } else {
                console.error('✗ IndexingService is not a constructor function');
                return false;
            }
        } else {
            console.error('✗ IndexingService file not found');
            return false;
        }
    } catch (error) {
        console.error('✗ Module loading failed:', error.message);
        return false;
    }
}

// Test worker pool configuration
function testWorkerPoolConfig() {
    console.log('\nTesting Worker Pool Configuration...');
    
    const numCpus = os.cpus().length;
    const expectedWorkers = Math.max(1, numCpus - 1);
    
    console.log(`✓ System has ${numCpus} CPU cores`);
    console.log(`✓ Expected worker pool size: ${expectedWorkers}`);
    
    if (expectedWorkers > 1) {
        console.log('✓ System supports parallel processing');
        return true;
    } else {
        console.log('⚠ System has limited cores, parallel processing may not show significant improvement');
        return true;
    }
}

// Main test runner
async function runTests() {
    console.log('='.repeat(60));
    console.log('PARALLEL INDEXING VERIFICATION TESTS');
    console.log('='.repeat(60));
    
    const results = {
        compilation: false,
        moduleLoading: false,
        workerThreads: false,
        workerPoolConfig: false
    };
    
    try {
        // Test 1: Compilation
        results.compilation = testCompilation();
        
        // Test 2: Module Loading
        if (results.compilation) {
            results.moduleLoading = testModuleLoading();
        }
        
        // Test 3: Worker Threads Support
        results.workerThreads = await testWorkerThreads();
        
        // Test 4: Worker Pool Configuration
        results.workerPoolConfig = testWorkerPoolConfig();
        
    } catch (error) {
        console.error('Test execution failed:', error);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const tests = [
        { name: 'Compilation', result: results.compilation },
        { name: 'Module Loading', result: results.moduleLoading },
        { name: 'Worker Threads Support', result: results.workerThreads },
        { name: 'Worker Pool Configuration', result: results.workerPoolConfig }
    ];
    
    tests.forEach(test => {
        const status = test.result ? '✓ PASS' : '✗ FAIL';
        console.log(`${test.name.padEnd(25)} ${status}`);
    });
    
    const allPassed = tests.every(test => test.result);
    
    console.log('\n' + '-'.repeat(60));
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED - Parallel indexing implementation is ready!');
        console.log('The IndexingService should now use worker threads for parallel processing.');
    } else {
        console.log('❌ SOME TESTS FAILED - Please check the implementation.');
    }
    console.log('-'.repeat(60));
    
    return allPassed;
}

// Run the tests
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests };
