#!/usr/bin/env node

/**
 * Test script to validate Qdrant robustness improvements
 *
 * This script tests the enhanced QdrantService with various scenarios
 * including error conditions, retry mechanisms, and health monitoring.
 *
 * Usage:
 * npm run test:qdrant-robustness
 * or
 * QDRANT_URL=http://localhost:6333 node dist/scripts/testQdrantRobustness.js
 */

import { QdrantService, QdrantServiceConfig } from '../db/qdrantService';
import { QdrantHealthMonitor } from '../db/qdrantHealthMonitor';
import { CentralizedLoggingService } from '../logging/centralizedLoggingService';
import { CodeChunk, ChunkType } from '../parsing/chunker';

class QdrantRobustnessTest {
  private qdrantService: QdrantService;
  private healthMonitor: QdrantHealthMonitor;
  private loggingService: CentralizedLoggingService;
  private testCollectionName: string;

  constructor() {
    // Create a mock ConfigService for testing
    const mockConfigService = {
      getFullConfig: () => ({
        logging: {
          level: 'Info',
          enableFileLogging: true,
          enableConsoleLogging: true,
          enableOutputChannel: true,
        },
      }),
    } as any;

    this.loggingService = new CentralizedLoggingService(mockConfigService);
    this.testCollectionName = `robustness_test_${Date.now()}`;

    const config: QdrantServiceConfig = {
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

    this.qdrantService = new QdrantService(config, this.loggingService);
    this.healthMonitor = new QdrantHealthMonitor(this.qdrantService, this.loggingService);
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Qdrant Robustness Tests...\n');

    try {
      await this.testBasicConnectivity();
      await this.testCollectionManagement();
      await this.testDataValidation();
      await this.testBatchOperations();
      await this.testSearchFunctionality();
      await this.testHealthMonitoring();
      await this.testErrorRecovery();

      console.log('✅ All tests completed successfully!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async testBasicConnectivity(): Promise<void> {
    console.log('🔍 Testing basic connectivity...');

    const isHealthy = await this.qdrantService.healthCheck(true);
    if (!isHealthy) {
      throw new Error('Qdrant service is not accessible');
    }

    console.log('✅ Basic connectivity test passed\n');
  }

  private async testCollectionManagement(): Promise<void> {
    console.log('🗂️  Testing collection management...');

    // Test collection creation
    const created = await this.qdrantService.createCollectionIfNotExists(
      this.testCollectionName,
      384
    );
    if (!created) {
      throw new Error('Failed to create test collection');
    }

    // Test collection info retrieval
    const info = await this.qdrantService.getCollectionInfo(this.testCollectionName);
    if (!info || info.config?.params?.vectors?.size !== 384) {
      throw new Error('Collection info is incorrect');
    }

    // Test collection listing
    const collections = await this.qdrantService.getCollections();
    if (!collections.includes(this.testCollectionName)) {
      throw new Error('Collection not found in list');
    }

    console.log('✅ Collection management test passed\n');
  }

  private async testDataValidation(): Promise<void> {
    console.log('🔍 Testing data validation...');

    // Test invalid collection name
    const invalidResult1 = await this.qdrantService.createCollectionIfNotExists('', 384);
    if (invalidResult1) {
      throw new Error('Should have failed with empty collection name');
    }

    // Test invalid vector size
    const invalidResult2 = await this.qdrantService.createCollectionIfNotExists('test_invalid', 0);
    if (invalidResult2) {
      throw new Error('Should have failed with invalid vector size');
    }

    // Test invalid chunk data
    const invalidChunk = {
      filePath: '',
      content: 'test',
      startLine: 1,
      endLine: 1,
      type: ChunkType.FUNCTION,
      language: 'typescript',
    } as CodeChunk;

    const invalidVector = [1, 2, 3];
    const invalidResult3 = await this.qdrantService.upsertChunks(
      this.testCollectionName,
      [invalidChunk],
      [invalidVector]
    );
    if (invalidResult3) {
      throw new Error('Should have failed with invalid chunk data');
    }

    console.log('✅ Data validation test passed\n');
  }

  private async testBatchOperations(): Promise<void> {
    console.log('📦 Testing batch operations...');

    // Create test data
    const chunks: CodeChunk[] = [];
    const vectors: number[][] = [];

    for (let i = 0; i < 125; i++) {
      // More than batch size to test batching
      chunks.push({
        filePath: `/test/file${i}.ts`,
        content: `export function func${i}() { return ${i}; }`,
        startLine: i * 5,
        endLine: i * 5 + 2,
        type: ChunkType.FUNCTION,
        name: `func${i}`,
        language: 'typescript',
      });

      vectors.push(
        Array(384)
          .fill(0)
          .map(() => Math.random())
      );
    }

    // Test batch upsert
    const upserted = await this.qdrantService.upsertChunks(
      this.testCollectionName,
      chunks,
      vectors
    );
    if (!upserted) {
      throw new Error('Batch upsert failed');
    }

    // Verify data was stored
    const searchResults = await this.qdrantService.search(this.testCollectionName, vectors[0], 10);
    if (searchResults.length === 0) {
      throw new Error('No search results found after batch upsert');
    }

    console.log('✅ Batch operations test passed\n');
  }

  private async testSearchFunctionality(): Promise<void> {
    console.log('🔍 Testing search functionality...');

    // Test basic search
    const queryVector = Array(384)
      .fill(0)
      .map(() => Math.random());
    const results = await this.qdrantService.search(this.testCollectionName, queryVector, 5);

    if (results.length === 0) {
      throw new Error('Search returned no results');
    }

    // Test search with filters
    const filter = {
      must: [
        {
          key: 'language',
          match: { value: 'typescript' },
        },
      ],
    };

    const filteredResults = await this.qdrantService.search(
      this.testCollectionName,
      queryVector,
      5,
      filter
    );

    if (filteredResults.length === 0) {
      throw new Error('Filtered search returned no results');
    }

    // Test search in non-existent collection
    const emptyResults = await this.qdrantService.search('nonexistent', queryVector, 5);
    if (emptyResults.length !== 0) {
      throw new Error('Search in non-existent collection should return empty results');
    }

    console.log('✅ Search functionality test passed\n');
  }

  private async testHealthMonitoring(): Promise<void> {
    console.log('💓 Testing health monitoring...');

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
    const unsubscribe = this.healthMonitor.onHealthChange(newStatus => {
      listenerCalled = true;
      console.log('Health status changed:', newStatus.isHealthy);
    });

    // Get health stats
    const stats = this.healthMonitor.getHealthStats();
    if (typeof stats.uptime !== 'number') {
      throw new Error('Health stats are invalid');
    }

    unsubscribe();
    this.healthMonitor.stopMonitoring();

    console.log('✅ Health monitoring test passed\n');
  }

  private async testErrorRecovery(): Promise<void> {
    console.log('🔄 Testing error recovery...');

    // Test retry mechanism by simulating temporary failures
    // This is a simplified test - in real scenarios, we'd need to simulate network issues

    // Test search with invalid parameters
    const invalidResults = await this.qdrantService.search(this.testCollectionName, [], -1);
    if (invalidResults.length !== 0) {
      throw new Error('Invalid search should return empty results');
    }

    // Test health check recovery
    const healthyAfterError = await this.qdrantService.healthCheck(true);
    if (!healthyAfterError) {
      throw new Error('Service should recover after error');
    }

    console.log('✅ Error recovery test passed\n');
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up...');

    try {
      await this.qdrantService.deleteCollection(this.testCollectionName);
      this.healthMonitor.dispose();
      console.log('✅ Cleanup completed\n');
    } catch (error) {
      console.warn('⚠️  Cleanup warning:', error);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const test = new QdrantRobustnessTest();
  test.runAllTests().catch(console.error);
}

export { QdrantRobustnessTest };
