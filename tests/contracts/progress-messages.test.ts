import { describe, it, expect, vi } from 'vitest';

describe('File Scanning Progress Message Contracts', () => {
  // Mock the postMessage function that would typically be provided by VS Code API
  const mockPostMessage = vi.fn();

  // Simulate the backend sending a message to the webview
  const sendMessageToWebview = (message: any) => {
    mockPostMessage(message);
  };

  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it('should send a valid scanStart message', () => {
    const message = {
      type: 'scanStart',
      payload: {
        message: 'Scanning full file structure...',
      },
    };
    sendMessageToWebview(message);

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scanStart',
      payload: expect.objectContaining({
        message: expect.any(String),
      }),
    }));
  });

  it('should send a valid scanProgress message', () => {
    const message = {
      type: 'scanProgress',
      payload: {
        scannedFiles: 100,
        ignoredFiles: 10,
        message: 'Scanned 100 files, 10 ignored...',
      },
    };
    sendMessageToWebview(message);

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scanProgress',
      payload: expect.objectContaining({
        scannedFiles: expect.any(Number),
        ignoredFiles: expect.any(Number),
        message: expect.any(String),
      }),
    }));
  });

  it('should send a valid scanComplete message', () => {
    const message = {
      type: 'scanComplete',
      payload: {
        totalFiles: 1000,
        ignoredFiles: 50,
        message: 'Scan complete: 1000 files in repo, 50 files not considered.',
      },
    };
    sendMessageToWebview(message);

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scanComplete',
      payload: expect.objectContaining({
        totalFiles: expect.any(Number),
        ignoredFiles: expect.any(Number),
        message: expect.any(String),
      }),
    }));
  });
});
