import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgressMessages, ProgressState } from './useProgressMessages';

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

describe('useProgressMessages', () => {
  let messageHandler: (event: MessageEvent) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Capture the message handler when addEventListener is called
    mockAddEventListener.mockImplementation((event: string, handler: any) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useProgressMessages());

      expect(result.current.progressState).toEqual({
        status: 'idle',
        scannedFiles: 0,
        ignoredFiles: 0,
      });
    });

    it('should set up message event listener', () => {
      renderHook(() => useProgressMessages());

      expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should clean up event listener on unmount', () => {
      const { unmount } = renderHook(() => useProgressMessages());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('message handling', () => {
    it('should handle scanStart message', () => {
      const { result } = renderHook(() => useProgressMessages());

      const scanStartMessage = {
        type: 'scanStart',
        payload: {
          message: 'Starting file scan...',
        },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: scanStartMessage }));
      });

      expect(result.current.progressState).toEqual({
        status: 'scanning',
        message: 'Starting file scan...',
        scannedFiles: 0,
        ignoredFiles: 0,
      });
    });

    it('should handle scanStart message with default message', () => {
      const { result } = renderHook(() => useProgressMessages());

      const scanStartMessage = {
        type: 'scanStart',
        payload: {},
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: scanStartMessage }));
      });

      expect(result.current.progressState.message).toBe('Scanning full file structure...');
      expect(result.current.progressState.status).toBe('scanning');
    });

    it('should handle scanProgress message', () => {
      const { result } = renderHook(() => useProgressMessages());

      // First start scanning
      const scanStartMessage = {
        type: 'scanStart',
        payload: { message: 'Starting...' },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: scanStartMessage }));
      });

      // Then send progress update
      const scanProgressMessage = {
        type: 'scanProgress',
        payload: {
          scannedFiles: 150,
          ignoredFiles: 25,
          message: 'Scanned 150 files, 25 ignored...',
        },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: scanProgressMessage }));
      });

      expect(result.current.progressState).toEqual({
        status: 'scanning',
        message: 'Scanned 150 files, 25 ignored...',
        scannedFiles: 150,
        ignoredFiles: 25,
      });
    });

    it('should handle scanProgress message with default message', () => {
      const { result } = renderHook(() => useProgressMessages());

      const scanProgressMessage = {
        type: 'scanProgress',
        payload: {
          scannedFiles: 100,
          ignoredFiles: 10,
        },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: scanProgressMessage }));
      });

      expect(result.current.progressState.message).toBe('Scanning in progress...');
      expect(result.current.progressState.scannedFiles).toBe(100);
      expect(result.current.progressState.ignoredFiles).toBe(10);
    });

    it('should handle scanComplete message', () => {
      const { result } = renderHook(() => useProgressMessages());

      // First start scanning
      const scanStartMessage = {
        type: 'scanStart',
        payload: { message: 'Starting...' },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: scanStartMessage }));
      });

      // Then complete scanning
      const scanCompleteMessage = {
        type: 'scanComplete',
        payload: {
          totalFiles: 500,
          ignoredFiles: 75,
          message: 'Scan complete: 500 files in repo, 75 files not considered.',
        },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: scanCompleteMessage }));
      });

      expect(result.current.progressState).toEqual({
        status: 'complete',
        message: 'Scan complete: 500 files in repo, 75 files not considered.',
        scannedFiles: 0, // From initial start
        ignoredFiles: 75,
        totalFiles: 500,
      });
    });

    it('should handle scanComplete message with default message', () => {
      const { result } = renderHook(() => useProgressMessages());

      const scanCompleteMessage = {
        type: 'scanComplete',
        payload: {
          totalFiles: 200,
          ignoredFiles: 30,
        },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: scanCompleteMessage }));
      });

      expect(result.current.progressState.message).toBe('Scan complete');
      expect(result.current.progressState.status).toBe('complete');
      expect(result.current.progressState.totalFiles).toBe(200);
      expect(result.current.progressState.ignoredFiles).toBe(30);
    });

    it('should ignore messages without type', () => {
      const { result } = renderHook(() => useProgressMessages());

      const initialState = result.current.progressState;

      const invalidMessage = {
        command: 'someCommand',
        data: { test: 'data' },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: invalidMessage }));
      });

      expect(result.current.progressState).toEqual(initialState);
    });

    it('should ignore unknown message types', () => {
      const { result } = renderHook(() => useProgressMessages());

      const initialState = result.current.progressState;

      const unknownMessage = {
        type: 'unknownType',
        payload: { data: 'test' },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: unknownMessage }));
      });

      expect(result.current.progressState).toEqual(initialState);
    });
  });

  describe('utility functions', () => {
    it('should reset progress state', () => {
      const { result } = renderHook(() => useProgressMessages());

      // First set some state
      const scanStartMessage = {
        type: 'scanStart',
        payload: { message: 'Starting...' },
      };

      act(() => {
        messageHandler(new MessageEvent('message', { data: scanStartMessage }));
      });

      // Then reset
      act(() => {
        result.current.resetProgress();
      });

      expect(result.current.progressState).toEqual({
        status: 'idle',
        scannedFiles: 0,
        ignoredFiles: 0,
      });
    });

    it('should start scanning manually', () => {
      const { result } = renderHook(() => useProgressMessages());

      act(() => {
        result.current.startScanning();
      });

      expect(result.current.progressState.status).toBe('scanning');
      expect(result.current.progressState.message).toBe('Initializing scan...');
    });
  });
});
