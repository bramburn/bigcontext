/**
 * Progress Messages Hook
 * 
 * This hook manages the state and event listeners for file scanning progress messages.
 * It listens for postMessage events from the extension backend and updates the
 * component state accordingly.
 */

import { useState, useEffect, useCallback } from 'react';

export interface ProgressState {
  status: 'idle' | 'scanning' | 'complete' | 'error';
  message?: string;
  scannedFiles: number;
  ignoredFiles: number;
  totalFiles?: number;
}

export interface ProgressMessage {
  type: 'scanStart' | 'scanProgress' | 'scanComplete';
  payload: {
    message: string;
    scannedFiles?: number;
    ignoredFiles?: number;
    totalFiles?: number;
  };
}

export const useProgressMessages = () => {
  const [progressState, setProgressState] = useState<ProgressState>({
    status: 'idle',
    scannedFiles: 0,
    ignoredFiles: 0,
  });

  const handleProgressMessage = useCallback((event: MessageEvent) => {
    const message = event.data;

    // Check if this is a progress message
    if (!message || !message.type) {
      return;
    }

    switch (message.type) {
      case 'scanStart':
        setProgressState({
          status: 'scanning',
          message: message.payload?.message || 'Scanning full file structure...',
          scannedFiles: 0,
          ignoredFiles: 0,
        });
        break;

      case 'scanProgress':
        setProgressState(prev => ({
          ...prev,
          status: 'scanning',
          message: message.payload?.message || 'Scanning in progress...',
          scannedFiles: message.payload?.scannedFiles || prev.scannedFiles,
          ignoredFiles: message.payload?.ignoredFiles || prev.ignoredFiles,
        }));
        break;

      case 'scanComplete':
        setProgressState(prev => ({
          ...prev,
          status: 'complete',
          message: message.payload?.message || 'Scan complete',
          totalFiles: message.payload?.totalFiles || prev.scannedFiles,
          ignoredFiles: message.payload?.ignoredFiles || prev.ignoredFiles,
        }));
        break;

      default:
        // Handle other message types if needed
        break;
    }
  }, []);

  useEffect(() => {
    // Add event listener for messages from the extension
    window.addEventListener('message', handleProgressMessage);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('message', handleProgressMessage);
    };
  }, [handleProgressMessage]);

  const resetProgress = useCallback(() => {
    setProgressState({
      status: 'idle',
      scannedFiles: 0,
      ignoredFiles: 0,
    });
  }, []);

  const startScanning = useCallback(() => {
    setProgressState(prev => ({
      ...prev,
      status: 'scanning',
      message: 'Initializing scan...',
    }));
  }, []);

  return {
    progressState,
    resetProgress,
    startScanning,
  };
};
