#!/usr/bin/env node

/**
 * Comprehensive Test Script for All BigContext Improvements
 * 
 * This script validates all the major improvements implemented:
 * 1. Global Configuration Persistence
 * 2. Enhanced Qdrant Robustness
 * 3. Indexing Stop/Cancel Functionality
 * 4. Type-Safe Communication
 * 5. Health Monitoring
 * 
 * Usage:
 * npm run test:all-improvements
 * or
 * QDRANT_URL=http://localhost:6333 node dist/scripts/testAllImprovements.js
 */

import * as vscode from 'vscode';
import { GlobalConfigurationManager } from '../configuration/globalConfigurationManager';
import { QdrantService, QdrantServiceConfig } from '../db/qdrantService';
import { QdrantHealthMonitor } from '../db/qdrantHealthMonitor';
import { TypeSafeCommunicationService } from '../communication/typeSafeCommunicationService';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';
import { IndexingService } from '../indexing/indexingService';

class ComprehensiveTestSuite {
  private loggingService: CentralizedLoggingService;
  private globalConfigManager: GlobalConfigurationManager;
  private qdrantService: QdrantService;
  private healthMonitor: QdrantHealthMonitor;
  private communicationService: TypeSafeCommunicationService;
  private testResults: Map<string, { passed: boolean; message: string; duration: number }> = new Map();

  constructor() {
    // Create a mock ConfigService for testing
    const mockConfigService = {
      getFullConfig: () => ({
        logging: {
          level: 'Info',
          enableFileLogging: true,
          enableConsoleLogging: true,
          enableOutputChannel: true,
        }
      })
    } as any;

    this.loggingService = new CentralizedLoggingService(mockConfigService);
    
    // Mock VS Code context for testing
    const mockContext = {
      globalState: {
        get: () => undefined,
        update: async () => {},
      },
    } as any;

    this.globalConfigManager = new GlobalConfigurationManager(mockContext, this.loggingService);
    
    const qdrantConfig: QdrantServiceConfig = {
      connectionString: process.env.QDRANT_URL || 'http://localhost:6333',
      retryConfig: {
        maxRetries: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      },
      batchSize: 50,
      healthCheckIntervalMs: 5000,
    };

    this.qdrantService = new QdrantService(qdrantConfig, this.loggingService);
    this.healthMonitor = new QdrantHealthMonitor(this.qdrantService, this.loggingService);
    this.communicationService = new TypeSafeCommunicationService({
      defaultTimeout: 10000,
      maxRetries: 2,
      retryDelay: 1000,
      enableMetrics: true,
    }, this.loggingService);
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive BigContext Test Suite...\n');

    try {
      await this.testGlobalConfiguration();
      await this.testQdrantRobustness();
      await this.testHealthMonitoring();
      await this.testCommunicationService();
      await this.testIndexingControls();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed with error:', error);
      process.exit(1);
    }
  }

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      console.log(`🔍 Running ${testName}...`);
      await testFn();
      const duration = Date.now() - startTime;
      this.testResults.set(testName, { passed: true, message: 'Passed', duration });
      console.log(`✅ ${testName} passed (${duration}ms)\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      this.testResults.set(testName, { passed: false, message, duration });
      console.log(`❌ ${testName} failed: ${message} (${duration}ms)\n`);
    }
  }

  private async testGlobalConfiguration(): Promise<void> {
    await this.runTest('Global Configuration Persistence', async () => {
      // Test global configuration
      const initialConfig = this.globalConfigManager.getGlobalConfiguration();
      if (!initialConfig) {
        throw new Error('Failed to get initial global configuration');
      }

      // Test updating configuration
      await this.globalConfigManager.updateGlobalConfiguration({
        qdrant: {
          connectionString: 'http://test:6333',
          isConfigured: true,
          lastValidated: Date.now(),
        },
      });

      const updatedConfig = this.globalConfigManager.getGlobalConfiguration();
      if (updatedConfig.qdrant.connectionString !== 'http://test:6333') {
        throw new Error('Global configuration update failed');
      }

      // Test repository configuration
      const repoPath = '/test/repository';
      await this.globalConfigManager.updateRepositoryConfiguration(repoPath, {
        indexingEnabled: true,
        customFilters: ['*.ts', '*.js'],
      });

      const repoConfig = this.globalConfigManager.getRepositoryConfiguration(repoPath);
      if (!repoConfig || !repoConfig.indexingEnabled) {
        throw new Error('Repository configuration failed');
      }

      // Test setup completion
      if (this.globalConfigManager.isSetupCompleted()) {
        throw new Error('Setup should not be completed yet');
      }

      await this.globalConfigManager.markSetupCompleted();
      if (!this.globalConfigManager.isSetupCompleted()) {
        throw new Error('Setup completion marking failed');
      }
    });
  }

  private async testQdrantRobustness(): Promise<void> {
    await this.runTest('Qdrant Robustness', async () => {
      // Test health check
      const isHealthy = await this.qdrantService.healthCheck(true);
      if (!isHealthy) {
        throw new Error('Qdrant service is not healthy');
      }

      // Test collection creation with validation
      const testCollectionName = `test_robustness_${Date.now()}`;
      const created = await this.qdrantService.createCollectionIfNotExists(testCollectionName, 384);
      if (!created) {
        throw new Error('Failed to create test collection');
      }

      // Test invalid collection name (should fail gracefully)
      const invalidCreated = await this.qdrantService.createCollectionIfNotExists('', 384);
      if (invalidCreated) {
        throw new Error('Should have failed with invalid collection name');
      }

      // Test search in non-existent collection (should return empty results)
      const emptyResults = await this.qdrantService.search('nonexistent_collection', [0.1, 0.2, 0.3], 5);
      if (emptyResults.length !== 0) {
        throw new Error('Search in non-existent collection should return empty results');
      }

      // Cleanup
      await this.qdrantService.deleteCollection(testCollectionName);
    });
  }

  private async testHealthMonitoring(): Promise<void> {
    await this.runTest('Health Monitoring', async () => {
      // Start monitoring
      this.healthMonitor.startMonitoring();

      // Wait for initial health check
      await new Promise(resolve => setTimeout(resolve, 1000));

      const status = this.healthMonitor.getHealthStatus();
      if (!status.isHealthy) {
        throw new Error('Health monitor reports service as unhealthy');
      }

      // Test health change listener
      let listenerCalled = false;
      const unsubscribe = this.healthMonitor.onHealthChange((newStatus) => {
        listenerCalled = true;
      });

      // Get health stats
      const stats = this.healthMonitor.getHealthStats();
      if (typeof stats.uptime !== 'number') {
        throw new Error('Health stats are invalid');
      }

      unsubscribe();
      this.healthMonitor.stopMonitoring();
    });
  }

  private async testCommunicationService(): Promise<void> {
    await this.runTest('Type-Safe Communication', async () => {
      // Test configuration
      const config = this.communicationService.getConfiguration();
      if (!config || config.maxRetries !== 2) {
        throw new Error('Communication service configuration is incorrect');
      }

      // Test metrics (if enabled)
      const metrics = this.communicationService.getMetrics();
      if (!metrics || typeof metrics.totalRequests !== 'number') {
        throw new Error('Communication metrics are not available');
      }

      // Test message validation
      const isValid = this.communicationService.validateMessage({
        id: 'test-id',
        timestamp: Date.now(),
        type: 'test',
      });
      if (!isValid) {
        throw new Error('Valid message failed validation');
      }

      // Test invalid message
      const isInvalid = this.communicationService.validateMessage({
        id: '',
        timestamp: 0,
        type: '',
      });
      if (isInvalid) {
        throw new Error('Invalid message passed validation');
      }
    });
  }

  private async testIndexingControls(): Promise<void> {
    await this.runTest('Indexing Stop/Cancel Controls', async () => {
      // Mock indexing service for testing
      const mockWorkspaceRoot = '/test/workspace';
      const mockFileWalker = {} as any;
      const mockAstParser = {} as any;
      const mockChunker = {} as any;
      const mockEmbeddingProvider = {} as any;
      const mockLspService = {} as any;
      const mockStateManager = {
        isIndexing: () => false,
        setIndexing: () => {},
        setPaused: () => {},
        setIndexingMessage: () => {},
      } as any;
      const mockWorkspaceManager = {} as any;
      const mockConfigService = {} as any;

      const indexingService = new IndexingService(
        mockWorkspaceRoot,
        mockFileWalker,
        mockAstParser,
        mockChunker,
        this.qdrantService,
        mockEmbeddingProvider,
        mockLspService,
        mockStateManager,
        mockWorkspaceManager,
        mockConfigService,
        this.loggingService
      );

      // Test initial state
      const initialStatus = indexingService.getIndexingStatus();
      if (initialStatus.isIndexing) {
        throw new Error('Indexing should not be active initially');
      }

      // Test cancellable/stoppable checks
      if (indexingService.isCancellable()) {
        throw new Error('Should not be cancellable when not indexing');
      }

      if (indexingService.isStoppable()) {
        throw new Error('Should not be stoppable when not indexing');
      }

      // Test pause/resume/stop/cancel methods (they should handle non-indexing state gracefully)
      indexingService.pause(); // Should warn but not throw
      indexingService.stop();  // Should warn but not throw
      indexingService.cancel(); // Should warn but not throw

      // Test status after operations
      const finalStatus = indexingService.getIndexingStatus();
      if (finalStatus.isCancelled || finalStatus.isStopped) {
        throw new Error('Status should not be cancelled or stopped when not indexing');
      }
    });
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary');
    console.log('========================\n');

    let totalTests = 0;
    let passedTests = 0;
    let totalDuration = 0;

    this.testResults.forEach((result, testName) => {
      totalTests++;
      totalDuration += result.duration;
      
      if (result.passed) {
        passedTests++;
        console.log(`✅ ${testName} - ${result.duration}ms`);
      } else {
        console.log(`❌ ${testName} - ${result.message} (${result.duration}ms)`);
      }
    });

    console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed`);
    console.log(`⏱️  Total duration: ${totalDuration}ms`);
    console.log(`📊 Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! BigContext improvements are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the failures above.');
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite();
  testSuite.runAllTests().catch(console.error);
}

export { ComprehensiveTestSuite };
