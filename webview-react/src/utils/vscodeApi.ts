/**
 * VS Code API utilities for React webview
 * 
 * This module provides utilities for communicating with the VS Code extension
 * from the React webview. It handles message passing, state management, and
 * provides a clean interface for webview-extension communication.
 */

interface VSCodeAPI {
  postMessage: (message: any) => void;
  setState: (state: any) => void;
  getState: () => any;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VSCodeAPI;
  }
}

let vscodeApi: VSCodeAPI | null = null;

/**
 * Initialize the VS Code API
 * @returns The VS Code API instance or null if not available
 */
export function initializeVSCodeApi(): VSCodeAPI | null {
  if (typeof window !== 'undefined' && window.acquireVsCodeApi && !vscodeApi) {
    try {
      vscodeApi = window.acquireVsCodeApi();
      console.log('VS Code API initialized successfully');
      return vscodeApi;
    } catch (error) {
      console.error('Failed to acquire VS Code API:', error);
      return null;
    }
  }
  return vscodeApi;
}

/**
 * Get the current VS Code API instance
 * @returns The VS Code API instance or null if not initialized
 */
export function getVSCodeApi(): VSCodeAPI | null {
  return vscodeApi;
}

/**
 * Post a message to the VS Code extension
 * @param command - The command to send
 * @param data - Optional data to send with the command
 */
export function postMessage(command: string, data?: any): void {
  const api = vscodeApi || initializeVSCodeApi();
  if (api) {
    api.postMessage({
      command,
      ...data
    });
  } else {
    console.warn('VS Code API not available, cannot send message:', command);
  }
}

/**
 * Set up a message listener for messages from the extension
 * @param callback - Function to call when a message is received
 * @returns Cleanup function to remove the listener
 */
export function onMessage(callback: (message: any) => void): () => void {
  const handleMessage = (event: MessageEvent) => {
    callback(event.data);
  };

  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}

/**
 * Set up a message listener for a specific command
 * @param command - The command to listen for
 * @param callback - Function to call when the command is received
 * @returns Cleanup function to remove the listener
 */
export function onMessageCommand(commandOrType: string, callback: (data: any) => void): () => void {
  return onMessage((message) => {
    // Support both 'command' and 'type' properties for compatibility
    if (message.command === commandOrType || message.type === commandOrType) {
      callback(message);
    }
  });
}

/**
 * Save state to VS Code's webview state
 * @param state - The state to save
 */
export function setState(state: any): void {
  const api = vscodeApi || initializeVSCodeApi();
  if (api) {
    api.setState(state);
  }
}

/**
 * Get state from VS Code's webview state
 * @returns The saved state or null if not available
 */
export function getState(): any {
  const api = vscodeApi || initializeVSCodeApi();
  if (api) {
    return api.getState();
  }
  return null;
}

/**
 * Check if VS Code API is available
 * @returns True if the API is available, false otherwise
 */
export function isVSCodeApiAvailable(): boolean {
  return vscodeApi !== null || (typeof window !== 'undefined' && !!window.acquireVsCodeApi);
}
