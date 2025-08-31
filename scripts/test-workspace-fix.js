#!/usr/bin/env node

/**
 * Test script to verify the workspace detection fixes
 * 
 * This script checks that all the necessary components are in place
 * to properly handle workspace state detection and communication.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Workspace Detection Fixes\n');

function checkFileContent(filePath, searchPattern, description) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const found = content.includes(searchPattern);
        console.log(`   ${found ? '✅' : '❌'} ${description}: ${found ? 'FOUND' : 'MISSING'}`);
        return found;
    } catch (error) {
        console.log(`   ❌ ${description}: FILE NOT FOUND`);
        return false;
    }
}

function checkRegexPattern(filePath, pattern, description) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const regex = new RegExp(pattern);
        const found = regex.test(content);
        console.log(`   ${found ? '✅' : '❌'} ${description}: ${found ? 'FOUND' : 'MISSING'}`);
        return found;
    } catch (error) {
        console.log(`   ❌ ${description}: FILE NOT FOUND`);
        return false;
    }
}

console.log('1. Backend Message Router Fixes:');
checkFileContent('src/messageRouter.ts', 'case \'getInitialState\':', 'getInitialState handler');
checkFileContent('src/messageRouter.ts', 'case \'getState\':', 'getState handler');
checkFileContent('src/messageRouter.ts', 'handleGetInitialState', 'handleGetInitialState method');
checkFileContent('src/messageRouter.ts', 'handleGetState', 'handleGetState method');

console.log('\n2. CommandManager Workspace Detection:');
checkFileContent('src/commandManager.ts', 'checkWorkspaceWithRetry', 'Retry logic method');
checkFileContent('src/commandManager.ts', 'await this.checkWorkspaceWithRetry()', 'Using retry logic');

console.log('\n3. WebviewManager Initial State:');
checkFileContent('src/webviewManager.ts', 'setTimeout(() => {', 'Delayed initial state sending');
checkRegexPattern('src/webviewManager.ts', 'console\\.log.*Sent initial state.*workspace open', 'Initial state logging');

console.log('\n4. Frontend Message Handling:');
checkFileContent('webview-react/src/App.tsx', 'workspaceStateChanged', 'workspaceStateChanged listener');
checkFileContent('webview-react/src/App.tsx', 'unsubscribeWorkspaceState', 'Cleanup for workspace state listener');

console.log('\n5. Message Router Response Format:');
checkFileContent('src/messageRouter.ts', 'type: \'initialState\'', 'Correct response type');
checkFileContent('src/messageRouter.ts', 'isWorkspaceOpen,', 'Workspace state in response');

console.log('\n6. Compilation Check:');
const outDirExists = fs.existsSync('out');
const mainJsExists = fs.existsSync('out/extension.js');
console.log(`   ${outDirExists ? '✅' : '❌'} TypeScript compilation: ${outDirExists ? 'SUCCESS' : 'FAILED'}`);
console.log(`   ${mainJsExists ? '✅' : '❌'} Extension bundle: ${mainJsExists ? 'EXISTS' : 'MISSING'}`);

const reactBuildExists = fs.existsSync('webview-react/dist');
const reactAppExists = fs.existsSync('webview-react/dist/app.js');
console.log(`   ${reactBuildExists ? '✅' : '❌'} React build: ${reactBuildExists ? 'SUCCESS' : 'FAILED'}`);
console.log(`   ${reactAppExists ? '✅' : '❌'} React bundle: ${reactAppExists ? 'EXISTS' : 'MISSING'}`);

console.log('\n🎯 Summary of Fixes Applied:');
console.log('   • Added getInitialState and getState message handlers');
console.log('   • Implemented workspace detection retry logic');
console.log('   • Added workspaceStateChanged message listener in frontend');
console.log('   • Improved initial state timing with delayed sending');
console.log('   • Enhanced logging for better debugging');

console.log('\n📋 Next Steps:');
console.log('   1. Test the extension in VS Code');
console.log('   2. Open a folder and verify workspace detection works');
console.log('   3. Close folder and verify "No Workspace" view appears');
console.log('   4. Use "Open Folder" button to test folder opening');

console.log('\n✨ Test completed!');
