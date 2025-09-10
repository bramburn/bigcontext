/**
 * File Scan Message Sender
 * 
 * This service handles sending file scanning progress messages from the extension
 * backend to the webview frontend. It integrates with the existing communication
 * infrastructure to provide real-time updates during file scanning operations.
 */

import { TypeSafeCommunicationService } from './typeSafeCommunicationService';
import { 
  ExtensionToWebviewMessageType,
  ScanStartPayload,
  ScanProgressPayload,
  ScanCompletePayload
} from '../shared/communicationTypes';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';

/**
 * File scan message sender service
 */
export class FileScanMessageSender {
  private communicationService: TypeSafeCommunicationService;
  private loggingService?: CentralizedLoggingService;

  constructor(
    communicationService: TypeSafeCommunicationService,
    loggingService?: CentralizedLoggingService
  ) {
    this.communicationService = communicationService;
    this.loggingService = loggingService;
  }

  /**
   * Send scan start message
   */
  public sendScanStart(message: string): void {
    try {
      const payload: ScanStartPayload = { message };
      
      this.communicationService.sendMessage(
        ExtensionToWebviewMessageType.SCAN_START,
        payload
      );

      this.loggingService?.debug(
        'Sent scan start message',
        { message },
        'FileScanMessageSender'
      );
    } catch (error) {
      this.loggingService?.error(
        'Failed to send scan start message',
        { error: error instanceof Error ? error.message : String(error) },
        'FileScanMessageSender'
      );
    }
  }

  /**
   * Send scan progress message
   */
  public sendScanProgress(
    scannedFiles: number,
    ignoredFiles: number,
    message: string
  ): void {
    try {
      const payload: ScanProgressPayload = {
        scannedFiles,
        ignoredFiles,
        message
      };

      this.communicationService.sendMessage(
        ExtensionToWebviewMessageType.SCAN_PROGRESS,
        payload
      );

      this.loggingService?.debug(
        'Sent scan progress message',
        { scannedFiles, ignoredFiles, message },
        'FileScanMessageSender'
      );
    } catch (error) {
      this.loggingService?.error(
        'Failed to send scan progress message',
        { error: error instanceof Error ? error.message : String(error) },
        'FileScanMessageSender'
      );
    }
  }

  /**
   * Send scan complete message
   */
  public sendScanComplete(
    totalFiles: number,
    ignoredFiles: number,
    message: string
  ): void {
    try {
      const payload: ScanCompletePayload = {
        totalFiles,
        ignoredFiles,
        message
      };

      this.communicationService.sendMessage(
        ExtensionToWebviewMessageType.SCAN_COMPLETE,
        payload
      );

      this.loggingService?.debug(
        'Sent scan complete message',
        { totalFiles, ignoredFiles, message },
        'FileScanMessageSender'
      );
    } catch (error) {
      this.loggingService?.error(
        'Failed to send scan complete message',
        { error: error instanceof Error ? error.message : String(error) },
        'FileScanMessageSender'
      );
    }
  }
}
