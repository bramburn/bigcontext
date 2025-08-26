/**
 * Connection Testing Utilities
 * 
 * Provides functionality to test database and provider connections
 * with real-time feedback and validation.
 */

import { postMessage } from '$lib/vscodeApi';
import type { ValidationResult } from './validation';

// Connection test result interface
export interface ConnectionTestResult {
    success: boolean;
    message: string;
    details?: string;
    latency?: number;
    version?: string;
    capabilities?: string[];
}

// Connection test status
export type ConnectionTestStatus = 'idle' | 'testing' | 'success' | 'error';

// Database configuration for testing
export interface DatabaseTestConfig {
    type: 'qdrant' | 'chromadb' | 'pinecone';
    host?: string;
    port?: number;
    apiKey?: string;
    environment?: string;
    collection?: string;
}

// Provider configuration for testing
export interface ProviderTestConfig {
    type: 'ollama' | 'openai' | 'azure';
    apiKey?: string;
    endpoint?: string;
    model?: string;
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(config: DatabaseTestConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
        // Send test request to extension
        const response = await sendConnectionTestRequest('testDatabase', config);
        const latency = Date.now() - startTime;
        
        if (response.success) {
            return {
                success: true,
                message: `Successfully connected to ${config.type}`,
                details: response.details || `Connection established in ${latency}ms`,
                latency,
                version: response.version,
                capabilities: response.capabilities
            };
        } else {
            return {
                success: false,
                message: response.message || `Failed to connect to ${config.type}`,
                details: response.details
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: 'Please check your configuration and try again'
        };
    }
}

/**
 * Test provider connection
 */
export async function testProviderConnection(config: ProviderTestConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
        // Send test request to extension
        const response = await sendConnectionTestRequest('testProvider', config);
        const latency = Date.now() - startTime;
        
        if (response.success) {
            return {
                success: true,
                message: `Successfully connected to ${config.type}`,
                details: response.details || `Connection established in ${latency}ms`,
                latency,
                version: response.version,
                capabilities: response.capabilities
            };
        } else {
            return {
                success: false,
                message: response.message || `Failed to connect to ${config.type}`,
                details: response.details
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: 'Please check your configuration and try again'
        };
    }
}

/**
 * Send connection test request to extension
 */
async function sendConnectionTestRequest(command: string, config: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const requestId = generateRequestId();
        const timeout = setTimeout(() => {
            reject(new Error('Connection test timed out'));
        }, 30000); // 30 second timeout

        // Listen for response
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.command === `${command}Response` && message.requestId === requestId) {
                clearTimeout(timeout);
                window.removeEventListener('message', handleMessage);
                resolve(message);
            }
        };

        window.addEventListener('message', handleMessage);

        // Send request
        postMessage(command, {
            requestId,
            config
        });
    });
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert connection test result to validation result
 */
export function connectionTestToValidation(testResult: ConnectionTestResult): ValidationResult {
    if (testResult.success) {
        const suggestions: string[] = [];
        
        if (testResult.latency && testResult.latency > 1000) {
            suggestions.push('Connection latency is high. Consider using a closer server.');
        }
        
        if (testResult.capabilities && testResult.capabilities.length > 0) {
            suggestions.push(`Available features: ${testResult.capabilities.join(', ')}`);
        }

        return {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [
                testResult.message,
                ...(testResult.details ? [testResult.details] : []),
                ...suggestions
            ]
        };
    } else {
        return {
            isValid: false,
            errors: [testResult.message],
            warnings: [],
            suggestions: testResult.details ? [testResult.details] : []
        };
    }
}

/**
 * Create a validator that includes connection testing
 */
export function createConnectionValidator<T extends DatabaseTestConfig | ProviderTestConfig>(
    testFunction: (config: T) => Promise<ConnectionTestResult>,
    baseValidator?: (config: T) => ValidationResult
): (config: T) => Promise<ValidationResult> {
    return async (config: T): Promise<ValidationResult> => {
        // First run base validation if provided
        if (baseValidator) {
            const baseResult = baseValidator(config);
            if (!baseResult.isValid) {
                return baseResult;
            }
        }

        // Then run connection test
        try {
            const testResult = await testFunction(config);
            return connectionTestToValidation(testResult);
        } catch (error) {
            return {
                isValid: false,
                errors: [`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
                warnings: [],
                suggestions: ['Please check your configuration and network connection']
            };
        }
    };
}

/**
 * Debounced connection tester
 */
export function createDebouncedConnectionTester<T>(
    testFunction: (config: T) => Promise<ConnectionTestResult>,
    delay: number = 2000
): (config: T) => Promise<ConnectionTestResult> {
    let timeoutId: NodeJS.Timeout;
    let currentPromise: Promise<ConnectionTestResult> | null = null;
    
    return (config: T): Promise<ConnectionTestResult> => {
        // Cancel previous test
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Return existing promise if still running
        if (currentPromise) {
            return currentPromise;
        }

        return new Promise((resolve, reject) => {
            timeoutId = setTimeout(async () => {
                try {
                    currentPromise = testFunction(config);
                    const result = await currentPromise;
                    currentPromise = null;
                    resolve(result);
                } catch (error) {
                    currentPromise = null;
                    reject(error);
                }
            }, delay);
        });
    };
}

/**
 * Quick connection health check
 */
export async function quickHealthCheck(type: 'database' | 'provider', config: any): Promise<boolean> {
    try {
        const command = type === 'database' ? 'quickDatabaseCheck' : 'quickProviderCheck';
        const response = await sendConnectionTestRequest(command, config);
        return response.success === true;
    } catch {
        return false;
    }
}

/**
 * Batch connection test for multiple configurations
 */
export async function batchConnectionTest(
    tests: Array<{
        name: string;
        type: 'database' | 'provider';
        config: DatabaseTestConfig | ProviderTestConfig;
    }>
): Promise<Array<{ name: string; result: ConnectionTestResult }>> {
    const results = await Promise.allSettled(
        tests.map(async (test) => {
            const result = test.type === 'database' 
                ? await testDatabaseConnection(test.config as DatabaseTestConfig)
                : await testProviderConnection(test.config as ProviderTestConfig);
            
            return { name: test.name, result };
        })
    );

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            return {
                name: tests[index].name,
                result: {
                    success: false,
                    message: 'Test failed to execute',
                    details: result.reason?.message || 'Unknown error'
                }
            };
        }
    });
}
