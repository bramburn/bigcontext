/**
 * File Scan Service
 * 
 * This service orchestrates file scanning operations and integrates with the
 * communication system to provide real-time progress updates to the webview.
 * It manages the FileScanner and FileScanMessageSender to provide a complete
 * file scanning solution.
 */

import * as vscode from 'vscode';
import { FileScanner, ScanStatistics } from '../indexing/fileScanner';
import { FileScanMessageSender } from '../communication/fileScanMessageSender';
import { TypeSafeCommunicationService } from '../communication/typeSafeCommunicationService';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';
import { WorkspaceManager } from '../workspaceManager';

/**
 * File scan service for managing file scanning operations
 */
export class FileScanService {
  private communicationService: TypeSafeCommunicationService;
  private loggingService?: CentralizedLoggingService;
  private workspaceManager: WorkspaceManager;
  private messageSender: FileScanMessageSender;
  private isScanning: boolean = false;

  constructor(
    communicationService: TypeSafeCommunicationService,
    workspaceManager: WorkspaceManager,
    loggingService?: CentralizedLoggingService
  ) {
    this.communicationService = communicationService;
    this.workspaceManager = workspaceManager;
    this.loggingService = loggingService;
    this.messageSender = new FileScanMessageSender(communicationService, loggingService);
  }

  /**
   * Start file scanning for the current workspace
   */
  public async startFileScan(): Promise<ScanStatistics | null> {
    if (this.isScanning) {
      this.loggingService?.warn(
        'File scan already in progress',
        {},
        'FileScanService'
      );
      return null;
    }

    try {
      this.isScanning = true;

      // Get the current workspace root
      const currentWorkspace = this.workspaceManager.getCurrentWorkspace();
      if (!currentWorkspace) {
        this.loggingService?.error(
          'No workspace root available for file scanning',
          {},
          'FileScanService'
        );
        
        // Send error message
        this.messageSender.sendScanComplete(
          0,
          0,
          'Error: No workspace open'
        );
        
        return null;
      }

      const workspaceRoot = currentWorkspace.path;

      this.loggingService?.info(
        'Starting file scan',
        { workspaceRoot },
        'FileScanService'
      );

      // Create file scanner with message sender
      const fileScanner = new FileScanner(workspaceRoot, this.messageSender);

      // Start scanning with progress updates
      const statistics = await fileScanner.scanWithProgress();

      this.loggingService?.info(
        'File scan completed',
        { 
          totalFiles: statistics.totalFiles,
          ignoredFiles: statistics.ignoredFiles,
          isEmpty: statistics.isEmpty
        },
        'FileScanService'
      );

      return statistics;

    } catch (error) {
      this.loggingService?.error(
        'Error during file scan',
        { error: error instanceof Error ? error.message : String(error) },
        'FileScanService'
      );

      // Send error completion message
      this.messageSender.sendScanComplete(
        0,
        0,
        `Scan failed: ${error instanceof Error ? error.message : String(error)}`
      );

      return null;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Check if file scanning is currently in progress
   */
  public isFileScanInProgress(): boolean {
    return this.isScanning;
  }

  /**
   * Get scan statistics for the current workspace
   * This is a lightweight operation that doesn't send progress messages
   */
  public async getWorkspaceStatistics(): Promise<ScanStatistics | null> {
    try {
      const currentWorkspace = this.workspaceManager.getCurrentWorkspace();
      if (!currentWorkspace) {
        return null;
      }

      const workspaceRoot = currentWorkspace.path;

      // Create file scanner without message sender for statistics only
      const fileScanner = new FileScanner(workspaceRoot);
      return await fileScanner.scanWithProgress();

    } catch (error) {
      this.loggingService?.error(
        'Error getting workspace statistics',
        { error: error instanceof Error ? error.message : String(error) },
        'FileScanService'
      );
      return null;
    }
  }
}
