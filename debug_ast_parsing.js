/**
 * Debug script to test AST parsing for Python files
 * This will help us identify the specific issue with the IndexingWorker
 */

const fs = require('fs');
const Parser = require('tree-sitter');
const Python = require('tree-sitter-python');

// Test the AST parsing directly
function testPythonParsing() {
    console.log('Starting Python AST parsing test...');
    
    try {
        // Initialize parser
        const parser = new Parser();
        console.log('Parser created successfully');
        
        // Set Python language
        parser.setLanguage(Python);
        console.log('Python language set successfully');
        
        // Read the test Python file
        const filePath = './test_python_file.py';
        const content = fs.readFileSync(filePath, 'utf-8');
        console.log(`File read successfully, length: ${content.length} characters`);
        
        // Parse the content
        console.log('Attempting to parse Python content...');
        const tree = parser.parse(content);
        
        if (!tree) {
            console.error('ERROR: Parser returned null tree');
            return false;
        }
        
        console.log('✅ Parsing successful!');
        console.log(`Root node type: ${tree.rootNode.type}`);
        console.log(`Has errors: ${tree.rootNode.hasError}`);
        console.log(`Child count: ${tree.rootNode.childCount}`);
        
        // Check for syntax errors
        if (tree.rootNode.hasError) {
            console.log('⚠️  Tree has syntax errors, walking to find them...');
            findErrors(tree.rootNode);
        } else {
            console.log('✅ No syntax errors found');
        }
        
        // Print some basic structure
        console.log('\nFirst few child nodes:');
        for (let i = 0; i < Math.min(5, tree.rootNode.childCount); i++) {
            const child = tree.rootNode.child(i);
            console.log(`  ${i}: ${child.type} (${child.startPosition.row + 1}:${child.startPosition.column + 1})`);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error during parsing:', error);
        console.error('Error stack:', error.stack);
        return false;
    }
}

function findErrors(node) {
    if (node.hasError) {
        if (node.type === 'ERROR') {
            console.log(`  ERROR node at line ${node.startPosition.row + 1}, column ${node.startPosition.column + 1}`);
            console.log(`  Text: "${node.text.substring(0, 50)}..."`);
        }
        
        // Recursively check children
        for (let i = 0; i < node.childCount; i++) {
            findErrors(node.child(i));
        }
    }
}

// Test different scenarios
function testEdgeCases() {
    console.log('\n=== Testing Edge Cases ===');
    
    const parser = new Parser();
    parser.setLanguage(Python);
    
    // Test empty file
    console.log('\nTesting empty file...');
    const emptyTree = parser.parse('');
    console.log(`Empty file result: ${emptyTree ? 'Success' : 'Failed'}`);
    
    // Test simple Python
    console.log('\nTesting simple Python...');
    const simpleTree = parser.parse('print("hello world")');
    console.log(`Simple Python result: ${simpleTree ? 'Success' : 'Failed'}`);
    if (simpleTree) {
        console.log(`Has errors: ${simpleTree.rootNode.hasError}`);
    }
    
    // Test Python with syntax error
    console.log('\nTesting Python with syntax error...');
    const errorTree = parser.parse('def broken_function(\nprint("missing closing paren")');
    console.log(`Syntax error test result: ${errorTree ? 'Success' : 'Failed'}`);
    if (errorTree) {
        console.log(`Has errors: ${errorTree.rootNode.hasError}`);
    }
}

// Run the tests
console.log('=== Python AST Parsing Debug ===');
console.log(`Node.js version: ${process.version}`);
console.log(`Tree-sitter version: ${require('tree-sitter/package.json').version}`);
console.log(`Tree-sitter-python version: ${require('tree-sitter-python/package.json').version}`);

const success = testPythonParsing();
testEdgeCases();

console.log(`\n=== Test Complete ===`);
console.log(`Overall result: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
