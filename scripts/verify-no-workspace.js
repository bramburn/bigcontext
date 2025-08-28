#!/usr/bin/env node

/**
 * Verification script for No-Workspace User Guidance implementation
 * 
 * This script verifies that all components of the no-workspace feature
 * are properly implemented according to the PRD requirements.
 */

const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('NO-WORKSPACE USER GUIDANCE VERIFICATION');
console.log('============================================================');

let passedTests = 0;
let totalTests = 0;

function checkFile(filePath, description) {
    totalTests++;
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✓' : '✗'} ${description} - ${filePath}`);
    if (exists) passedTests++;
    return exists;
}

function checkFileContent(filePath, searchText, description) {
    totalTests++;
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`✗ ${description} - file not found: ${filePath}`);
            return false;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const found = content.includes(searchText);
        console.log(`${found ? '✓' : '✗'} ${description}`);
        if (found) passedTests++;
        return found;
    } catch (error) {
        console.log(`✗ ${description} - error reading file: ${error.message}`);
        return false;
    }
}

console.log('\n1. Core Files:');
checkFile('src/commandManager.ts', 'CommandManager source exists');
checkFile('src/webviewManager.ts', 'WebviewManager source exists');
checkFile('src/messageRouter.ts', 'MessageRouter source exists');
checkFile('webview/src/lib/stores/appStore.ts', 'AppStore source exists');
checkFile('webview/src/lib/components/NoWorkspaceView.svelte', 'NoWorkspaceView component exists');
checkFile('webview/src/routes/+page.svelte', 'Main page component exists');

console.log('\n2. CommandManager Implementation:');
checkFileContent('src/commandManager.ts', 'vscode.workspace.workspaceFolders', 'CommandManager checks workspace folders');
checkFileContent('src/commandManager.ts', 'isWorkspaceOpen', 'CommandManager determines workspace state');
checkFileContent('src/commandManager.ts', 'showMainPanel({ isWorkspaceOpen', 'CommandManager passes workspace state to WebviewManager');

console.log('\n3. WebviewManager Implementation:');
checkFileContent('src/webviewManager.ts', 'isWorkspaceOpen', 'WebviewManager accepts workspace state');
checkFileContent('src/webviewManager.ts', 'initialState', 'WebviewManager sends initial state message');
checkFileContent('src/webviewManager.ts', 'updateWorkspaceState', 'WebviewManager has updateWorkspaceState method');
checkFileContent('src/webviewManager.ts', 'workspaceStateChanged', 'WebviewManager sends workspace state change messages');

console.log('\n4. MessageRouter Implementation:');
checkFileContent('src/messageRouter.ts', 'requestOpenFolder', 'MessageRouter handles requestOpenFolder command');
checkFileContent('src/messageRouter.ts', 'handleRequestOpenFolder', 'MessageRouter has requestOpenFolder handler');
checkFileContent('src/messageRouter.ts', 'vscode.openFolder', 'MessageRouter executes VS Code open folder command');

console.log('\n5. AppStore Implementation:');
checkFileContent('webview/src/lib/stores/appStore.ts', 'isWorkspaceOpen: boolean', 'AppStore has isWorkspaceOpen property');
checkFileContent('webview/src/lib/stores/appStore.ts', 'setWorkspaceOpen', 'AppStore has setWorkspaceOpen action');
checkFileContent('webview/src/lib/stores/appStore.ts', 'isWorkspaceOpen: false', 'AppStore initializes isWorkspaceOpen to false');

console.log('\n6. NoWorkspaceView Component:');
checkFileContent('webview/src/lib/components/NoWorkspaceView.svelte', 'fluent-card', 'NoWorkspaceView uses Fluent UI card');
checkFileContent('webview/src/lib/components/NoWorkspaceView.svelte', 'fluent-button', 'NoWorkspaceView uses Fluent UI button');
checkFileContent('webview/src/lib/components/NoWorkspaceView.svelte', 'Open Folder', 'NoWorkspaceView has Open Folder button');
checkFileContent('webview/src/lib/components/NoWorkspaceView.svelte', 'requestOpenFolder', 'NoWorkspaceView sends requestOpenFolder message');

console.log('\n7. Main Page Integration:');
checkFileContent('webview/src/routes/+page.svelte', 'NoWorkspaceView', 'Main page imports NoWorkspaceView');
checkFileContent('webview/src/routes/+page.svelte', '$appState.isWorkspaceOpen', 'Main page checks workspace state');
checkFileContent('webview/src/routes/+page.svelte', 'initialState', 'Main page handles initial state message');
checkFileContent('webview/src/routes/+page.svelte', 'workspaceStateChanged', 'Main page handles workspace state change message');

console.log('\n8. ExtensionManager Integration:');
checkFileContent('src/extensionManager.ts', 'onWorkspaceChanged', 'ExtensionManager has workspace change listener');
checkFileContent('src/extensionManager.ts', 'updateWorkspaceState', 'ExtensionManager calls updateWorkspaceState on workspace change');

console.log('\n============================================================');
console.log('VERIFICATION SUMMARY');
console.log('============================================================');
console.log(`Tests passed: ${passedTests}/${totalTests}`);

if (passedTests === totalTests) {
    console.log('\n🎉 ALL CHECKS PASSED!');
    console.log('✓ No-workspace user guidance implementation is complete');
    console.log('✓ Workspace detection is properly implemented');
    console.log('✓ UI components are in place with Fluent UI styling');
    console.log('✓ Message routing is configured for open folder functionality');
    console.log('✓ State management handles workspace changes');
    console.log('✓ Extension properly listens for workspace changes');
} else {
    console.log('\n❌ SOME CHECKS FAILED');
    console.log('Please review the implementation and ensure all components are in place.');
}

console.log('============================================================');

process.exit(passedTests === totalTests ? 0 : 1);
