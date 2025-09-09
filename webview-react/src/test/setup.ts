import '@testing-library/jest-dom';

// Mock VS Code API for testing
global.acquireVsCodeApi = () => ({
  postMessage: vi.fn(),
  setState: vi.fn(),
  getState: vi.fn()
});

// Mock window.vscode
Object.defineProperty(window, 'vscode', {
  value: global.acquireVsCodeApi(),
  writable: true
});
