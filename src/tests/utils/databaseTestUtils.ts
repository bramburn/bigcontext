/**
 * Database Test Utilities
 * 
 * Provides utilities for testing database connectivity, performance,
 * and functionality. Includes test data generation, connection validation,
 * and performance benchmarking.
 */

import { QdrantService, QdrantServiceConfig } from '../../db/qdrantService';
import { QdrantConnectionPool, ConnectionPoolConfig } from '../../db/qdrantConnectionPool';
import { CentralizedLoggingService } from '../../logging/centralizedLoggingService';
import { QdrantPoint } from '@qdrant/js-client-rest';

export interface DatabaseTestConfig {
  connectionString: string;
  testCollectionPrefix: string;
  cleanupAfterTests: boolean;
  performanceTestSize: number;
  timeoutMs: number;
}

export interface ConnectionTestResult {
  success: boolean;
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
}

export interface PerformanceTestResult {
  operation: string;
  totalTime: number;
  averageTime: number;
  throughput: number;
  success: boolean;
  error?: string;
}

export interface DatabaseHealthReport {
  isHealthy: boolean;
  connectionTest: ConnectionTestResult;
  collectionTests: ConnectionTestResult[];
  performanceTests: PerformanceTestResult[];
  recommendations: string[];
}

export class DatabaseTestUtils {
  private qdrantService: QdrantService;
  private connectionPool?: QdrantConnectionPool;
  private loggingService: CentralizedLoggingService;
  private config: DatabaseTestConfig;
  private testCollections: string[] = [];

  constructor(
    config: DatabaseTestConfig,
    loggingService: CentralizedLoggingService
  ) {
    this.config = config;
    this.loggingService = loggingService;

    const qdrantConfig: QdrantServiceConfig = {
      connectionString: config.connectionString,
      retryConfig: {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      },
      batchSize: 100,
      healthCheckIntervalMs: 30000,
    };

    this.qdrantService = new QdrantService(qdrantConfig, loggingService);
  }

  /**
   * Test basic database connectivity
   */
  public async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      this.loggingService.info(
        'Testing database connection',
        { connectionString: this.config.connectionString },
        'DatabaseTestUtils'
      );

      const isHealthy = await this.qdrantService.healthCheck(true);
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        const collections = await this.qdrantService.getCollections();
        
        return {
          success: true,
          responseTime,
          details: {
            collectionsCount: collections.length,
            collections: collections.slice(0, 10), // First 10 collections
          },
        };
      } else {
        return {
          success: false,
          responseTime,
          error: 'Health check failed',
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.loggingService.error(
        'Database connection test failed',
        { error: errorMessage, responseTime },
        'DatabaseTestUtils'
      );

      return {
        success: false,
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Test collection operations
   */
  public async testCollectionOperations(): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];
    const testCollectionName = `${this.config.testCollectionPrefix}_test_${Date.now()}`;
    
    try {
      // Test collection creation
      const createResult = await this.testCollectionCreation(testCollectionName);
      results.push(createResult);

      if (createResult.success) {
        this.testCollections.push(testCollectionName);

        // Test point insertion
        const insertResult = await this.testPointInsertion(testCollectionName);
        results.push(insertResult);

        // Test search operations
        const searchResult = await this.testSearchOperations(testCollectionName);
        results.push(searchResult);

        // Test collection deletion
        const deleteResult = await this.testCollectionDeletion(testCollectionName);
        results.push(deleteResult);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        success: false,
        responseTime: 0,
        error: `Collection operations test failed: ${errorMessage}`,
      });
    }

    return results;
  }

  /**
   * Test collection creation
   */
  private async testCollectionCreation(collectionName: string): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const success = await this.qdrantService.createCollectionIfNotExists(
        collectionName,
        768,
        'Cosine'
      );
      
      const responseTime = Date.now() - startTime;
      
      return {
        success,
        responseTime,
        details: { operation: 'createCollection', collectionName },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        responseTime,
        error: `Collection creation failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Test point insertion
   */
  private async testPointInsertion(collectionName: string): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const testPoints = this.generateTestPoints(10);
      await this.qdrantService.upsertPoints(collectionName, testPoints);
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
        details: { operation: 'insertPoints', pointCount: testPoints.length },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        responseTime,
        error: `Point insertion failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Test search operations
   */
  private async testSearchOperations(collectionName: string): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const searchVector = Array.from({ length: 768 }, () => Math.random());
      const results = await this.qdrantService.search(collectionName, searchVector, 5);
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
        details: { operation: 'search', resultCount: results.length },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        responseTime,
        error: `Search operation failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Test collection deletion
   */
  private async testCollectionDeletion(collectionName: string): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      await this.qdrantService.deleteCollection(collectionName);
      
      const responseTime = Date.now() - startTime;
      const index = this.testCollections.indexOf(collectionName);
      if (index > -1) {
        this.testCollections.splice(index, 1);
      }
      
      return {
        success: true,
        responseTime,
        details: { operation: 'deleteCollection', collectionName },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        responseTime,
        error: `Collection deletion failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Run performance tests
   */
  public async runPerformanceTests(): Promise<PerformanceTestResult[]> {
    const results: PerformanceTestResult[] = [];
    const testCollectionName = `${this.config.testCollectionPrefix}_perf_${Date.now()}`;
    
    try {
      // Create test collection
      await this.qdrantService.createCollectionIfNotExists(testCollectionName, 768, 'Cosine');
      this.testCollections.push(testCollectionName);

      // Test bulk insertion performance
      const insertResult = await this.testBulkInsertionPerformance(testCollectionName);
      results.push(insertResult);

      // Test search performance
      const searchResult = await this.testSearchPerformance(testCollectionName);
      results.push(searchResult);

      // Test batch search performance
      const batchSearchResult = await this.testBatchSearchPerformance(testCollectionName);
      results.push(batchSearchResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        operation: 'performanceTests',
        totalTime: 0,
        averageTime: 0,
        throughput: 0,
        success: false,
        error: errorMessage,
      });
    }

    return results;
  }

  /**
   * Test bulk insertion performance
   */
  private async testBulkInsertionPerformance(collectionName: string): Promise<PerformanceTestResult> {
    const startTime = Date.now();
    const pointCount = this.config.performanceTestSize;
    
    try {
      const testPoints = this.generateTestPoints(pointCount);
      await this.qdrantService.upsertPoints(collectionName, testPoints);
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / pointCount;
      const throughput = pointCount / (totalTime / 1000); // points per second
      
      return {
        operation: 'bulkInsertion',
        totalTime,
        averageTime,
        throughput,
        success: true,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        operation: 'bulkInsertion',
        totalTime,
        averageTime: 0,
        throughput: 0,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Test search performance
   */
  private async testSearchPerformance(collectionName: string): Promise<PerformanceTestResult> {
    const searchCount = 100;
    const startTime = Date.now();
    
    try {
      const searchPromises = Array.from({ length: searchCount }, () => {
        const searchVector = Array.from({ length: 768 }, () => Math.random());
        return this.qdrantService.search(collectionName, searchVector, 10);
      });
      
      await Promise.all(searchPromises);
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / searchCount;
      const throughput = searchCount / (totalTime / 1000); // searches per second
      
      return {
        operation: 'search',
        totalTime,
        averageTime,
        throughput,
        success: true,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        operation: 'search',
        totalTime,
        averageTime: 0,
        throughput: 0,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Test batch search performance
   */
  private async testBatchSearchPerformance(collectionName: string): Promise<PerformanceTestResult> {
    const batchSize = 10;
    const batchCount = 10;
    const startTime = Date.now();
    
    try {
      for (let i = 0; i < batchCount; i++) {
        const searchPromises = Array.from({ length: batchSize }, () => {
          const searchVector = Array.from({ length: 768 }, () => Math.random());
          return this.qdrantService.search(collectionName, searchVector, 5);
        });
        
        await Promise.all(searchPromises);
      }
      
      const totalTime = Date.now() - startTime;
      const totalSearches = batchSize * batchCount;
      const averageTime = totalTime / totalSearches;
      const throughput = totalSearches / (totalTime / 1000);
      
      return {
        operation: 'batchSearch',
        totalTime,
        averageTime,
        throughput,
        success: true,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        operation: 'batchSearch',
        totalTime,
        averageTime: 0,
        throughput: 0,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate comprehensive health report
   */
  public async generateHealthReport(): Promise<DatabaseHealthReport> {
    this.loggingService.info(
      'Generating database health report',
      {},
      'DatabaseTestUtils'
    );

    const connectionTest = await this.testConnection();
    const collectionTests = await this.testCollectionOperations();
    const performanceTests = await this.runPerformanceTests();

    const isHealthy = connectionTest.success && 
                     collectionTests.every(test => test.success) &&
                     performanceTests.every(test => test.success);

    const recommendations = this.generateRecommendations(
      connectionTest,
      collectionTests,
      performanceTests
    );

    return {
      isHealthy,
      connectionTest,
      collectionTests,
      performanceTests,
      recommendations,
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(
    connectionTest: ConnectionTestResult,
    collectionTests: ConnectionTestResult[],
    performanceTests: PerformanceTestResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Connection recommendations
    if (!connectionTest.success) {
      recommendations.push('Database connection failed - check connection string and network connectivity');
    } else if (connectionTest.responseTime > 5000) {
      recommendations.push('Database connection is slow - consider optimizing network or database configuration');
    }

    // Performance recommendations
    const insertTest = performanceTests.find(test => test.operation === 'bulkInsertion');
    if (insertTest && insertTest.success && insertTest.throughput < 100) {
      recommendations.push('Bulk insertion performance is low - consider increasing batch size or optimizing database configuration');
    }

    const searchTest = performanceTests.find(test => test.operation === 'search');
    if (searchTest && searchTest.success && searchTest.throughput < 10) {
      recommendations.push('Search performance is low - consider optimizing indexes or reducing vector dimensions');
    }

    // Collection operation recommendations
    const failedCollectionTests = collectionTests.filter(test => !test.success);
    if (failedCollectionTests.length > 0) {
      recommendations.push('Some collection operations failed - check database permissions and configuration');
    }

    if (recommendations.length === 0) {
      recommendations.push('Database is performing well - no immediate optimizations needed');
    }

    return recommendations;
  }

  /**
   * Generate test points for testing
   */
  private generateTestPoints(count: number): QdrantPoint[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `test_point_${index}_${Date.now()}`,
      vector: Array.from({ length: 768 }, () => Math.random()),
      payload: {
        test: true,
        index,
        timestamp: Date.now(),
        content: `Test content for point ${index}`,
      },
    }));
  }

  /**
   * Cleanup test collections
   */
  public async cleanup(): Promise<void> {
    if (!this.config.cleanupAfterTests) {
      return;
    }

    this.loggingService.info(
      'Cleaning up test collections',
      { collectionCount: this.testCollections.length },
      'DatabaseTestUtils'
    );

    for (const collectionName of this.testCollections) {
      try {
        await this.qdrantService.deleteCollection(collectionName);
        this.loggingService.debug(
          'Deleted test collection',
          { collectionName },
          'DatabaseTestUtils'
        );
      } catch (error) {
        this.loggingService.warn(
          'Failed to delete test collection',
          {
            collectionName,
            error: error instanceof Error ? error.message : String(error),
          },
          'DatabaseTestUtils'
        );
      }
    }

    this.testCollections = [];
  }
}
