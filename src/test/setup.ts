/**
 * Test Setup for Vitest
 *
 * This file sets up mocks and global configurations for running tests
 * in the Node.js environment without VS Code dependencies.
 */

import { vi } from 'vitest';

// Mock VS Code API
const mockVscode = {
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
    createFileSystemWatcher: vi.fn(() => ({
      onDidCreate: vi.fn(),
      onDidChange: vi.fn(),
      onDidDelete: vi.fn(),
      dispose: vi.fn(),
    })),
    onDidChangeConfiguration: vi.fn(),
    getConfiguration: vi.fn(() => ({
      get: vi.fn(),
      update: vi.fn(),
      has: vi.fn(),
    })),
  },
  window: {
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    withProgress: vi.fn(),
  },
  commands: {
    registerCommand: vi.fn(),
  },
  Uri: {
    file: (path: string) => ({ fsPath: path, toString: () => path }),
    parse: (path: string) => ({ fsPath: path, toString: () => path }),
    joinPath: (...paths: any[]) => ({ fsPath: paths.join('/'), toString: () => paths.join('/') }),
  },
  Disposable: class {
    constructor(private callback: () => void) {}
    dispose() {
      this.callback();
    }
  },
  CancellationTokenSource: class {
    token = { isCancellationRequested: false };
    cancel() {
      this.token.isCancellationRequested = true;
    }
    dispose() {}
  },
  FileSystemWatcher: class {
    onDidCreate = vi.fn();
    onDidChange = vi.fn();
    onDidDelete = vi.fn();
    dispose = vi.fn();
  },
  ConfigurationChangeEvent: class {
    constructor(public affectsConfiguration: (section: string) => boolean) {}
  },
  ProgressLocation: {
    Notification: 15,
    SourceControl: 1,
    Window: 10,
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
    Active: -1,
    Beside: -2,
  },
};

// Mock the vscode module
vi.mock('vscode', () => mockVscode);

// Export for use in tests
export { mockVscode };
