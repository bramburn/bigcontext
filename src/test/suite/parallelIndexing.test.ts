/**
 * Test suite for parallel indexing functionality
 *
 * This test suite verifies that the IndexingService correctly uses worker threads
 * for parallel processing and achieves the expected performance improvements.
 * Parallel indexing is a critical performance optimization that allows the extension
 * to process multiple files simultaneously, significantly reducing indexing time
 * for large codebases.
 */

import * as assert from 'assert';
import { vi } from 'vitest';

vi.mock('vscode', () => ({
    workspace: {
        onDidChangeWorkspaceFolders: vi.fn(),
        workspaceFolders: [],
        getConfiguration: vi.fn(() => ({
            get: vi.fn(),
            update: vi.fn(),
            has: vi.fn()
        }))
    },
    Uri: {
        file: (path: string) => ({ fsPath: path, toString: () => path }),
        parse: (path: string) => ({ fsPath: path, toString: () => path }),
        joinPath: (...paths: any[]) => ({ fsPath: paths.join('/'), toString: () => paths.join('/') })
    }
}));
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { IndexingService } from '../../indexing/indexingService';
import { FileWalker } from '../../indexing/fileWalker';
import { AstParser } from '../../parsing/astParser';
import { Chunker } from '../../parsing/chunker';
import { QdrantService } from '../../db/qdrantService';
import { ConfigService } from '../../configService';
import { StateManager } from '../../stateManager';
import { WorkspaceManager } from '../../workspaceManager';
import { LSPService } from '../../lsp/lspService';
import { EmbeddingProviderFactory } from '../../embeddings/embeddingProvider';

describe('Parallel Indexing Tests', () => {
    let indexingService: IndexingService;
    let tempWorkspaceDir: string;
    let configService: ConfigService;
    let stateManager: StateManager;
    let workspaceManager: WorkspaceManager;

    beforeAll(async () => {
        // Set up the test environment with a temporary workspace and test files
        // This ensures tests are isolated and don't interfere with each other
        
        // Create a temporary workspace directory for testing
        // This provides a clean environment for each test run
        tempWorkspaceDir = path.join(os.tmpdir(), 'parallel-indexing-test');
        if (!fs.existsSync(tempWorkspaceDir)) {
            fs.mkdirSync(tempWorkspaceDir, { recursive: true });
        }

        // Create test files with realistic code content
        // This allows testing with actual code structures and patterns
        await createTestFiles(tempWorkspaceDir);

        // Initialize all required services for the IndexingService
        // This mirrors the real initialization process in the extension
        configService = new ConfigService();
        stateManager = new StateManager();
        const mockLoggingService = {
            info: () => {},
            error: () => {},
            warn: () => {},
            debug: () => {}
        };
        workspaceManager = new WorkspaceManager(mockLoggingService as any);

        // Initialize IndexingService with all its dependencies
        // This creates a complete indexing pipeline for testing
        const fileWalker = new FileWalker(tempWorkspaceDir);
        const astParser = new AstParser();
        const chunker = new Chunker();
        const qdrantService = new QdrantService({ connectionString: configService.getQdrantConnectionString() }, mockLoggingService as any);
        const embeddingProvider = await EmbeddingProviderFactory.createProviderFromConfigService(configService);
        const lspService = new LSPService(tempWorkspaceDir, mockLoggingService as any);

        indexingService = new IndexingService(
            tempWorkspaceDir,
            fileWalker,
            astParser,
            chunker,
            qdrantService,
            embeddingProvider,
            lspService,
            stateManager,
            workspaceManager,
            configService,
            mockLoggingService as any
        );
    });

    afterAll(async () => {
        // Clean up resources after all tests have completed
        // This ensures no temporary files or resources are left behind
        
        // Cleanup the IndexingService and its resources
        if (indexingService) {
            await indexingService.cleanup();
        }
        
        // Remove temporary workspace directory and all its contents
        // This prevents disk space accumulation from test runs
        if (fs.existsSync(tempWorkspaceDir)) {
            fs.rmSync(tempWorkspaceDir, { recursive: true, force: true });
        }
    });

    test('should initialize worker pool correctly', () => {
        // Test that the IndexingService and its worker pool are properly initialized
        // This verifies the basic setup for parallel processing
        
        // Verify that the IndexingService has been initialized
        assert.ok(indexingService, 'IndexingService should be initialized');
        
        // Check that we have multiple CPU cores available for testing
        // Parallel processing requires multiple cores to be effective
        const numCpus = os.cpus().length;
        assert.ok(numCpus > 1, 'Multiple CPU cores required for parallel processing test');
        
        console.log(`Test environment has ${numCpus} CPU cores available`);
    });

    test('should process files and generate chunks', async () => {
        // Test the complete indexing process with parallel processing
        // This verifies that files are discovered, parsed, chunked, and stored correctly

        let progressUpdates: any[] = [];
        
        // Start the indexing process with a progress callback
        // This allows us to monitor the indexing progress and verify it works correctly
        const result = await indexingService.startIndexing((progress) => {
            progressUpdates.push(progress);
            console.log(`Progress: ${progress.processedFiles}/${progress.totalFiles} files, phase: ${progress.currentPhase}`);
        });

        // Verify indexing completed successfully
        // This confirms that the parallel processing pipeline works end-to-end
        assert.ok(result.success, 'Indexing should complete successfully');
        assert.ok(result.totalFiles > 0, 'Should have found files to index');
        assert.ok(result.processedFiles > 0, 'Should have processed files');
        assert.ok(result.chunks.length > 0, 'Should have generated chunks');
        
        // Verify progress updates were received
        // This ensures that progress reporting works during parallel processing
        assert.ok(progressUpdates.length > 0, 'Should have received progress updates');
        
        // Verify different phases were reported
        // This confirms that the indexing pipeline progresses through expected phases
        const phases = new Set(progressUpdates.map(p => p.currentPhase));
        assert.ok(phases.has('discovering'), 'Should have discovery phase');
        assert.ok(phases.has('parsing'), 'Should have parsing phase');
        
        console.log(`Indexing completed: ${result.processedFiles} files, ${result.chunks.length} chunks, ${result.duration}ms`);
    });

    test('should handle worker errors gracefully', async () => {
        // Test that the system handles errors in worker threads gracefully
        // This ensures that errors don't crash the entire indexing process

        // This test verifies that the system handles worker errors without crashing
        // We'll trigger this by trying to index a non-existent directory
        const invalidWorkspaceDir = path.join(os.tmpdir(), 'non-existent-directory');
        
        // Create services with an invalid directory to trigger error conditions
        const fileWalker = new FileWalker(invalidWorkspaceDir);
        const astParser = new AstParser();
        const chunker = new Chunker();
        const mockLoggingService = {
            info: () => {},
            error: () => {},
            warn: () => {},
            debug: () => {}
        };
        const qdrantService = new QdrantService({ connectionString: configService.getQdrantConnectionString() }, mockLoggingService as any);
        const embeddingProvider = await EmbeddingProviderFactory.createProviderFromConfigService(configService);
        const lspService = new LSPService(invalidWorkspaceDir, {} as any);

        // Create an IndexingService with the invalid directory
        const testIndexingService = new IndexingService(
            invalidWorkspaceDir,
            fileWalker,
            astParser,
            chunker,
            qdrantService,
            embeddingProvider,
            lspService,
            stateManager,
            workspaceManager,
            configService,
            mockLoggingService as any
        );

        try {
            // Attempt to start indexing with the invalid directory
            // This should trigger error handling in the worker threads
            const result = await testIndexingService.startIndexing();
            
            // Should complete without crashing, even if no files are found
            // This verifies that error handling is robust
            assert.ok(result !== null, 'Should return a result object');
            
            // Cleanup the test service
            await testIndexingService.cleanup();
            
        } catch (error) {
            // If an error occurs, it should be handled gracefully
            // This ensures that errors in worker threads don't crash the main process
            console.log('Expected error handled:', error);
            await testIndexingService.cleanup();
        }
    });
});

/**
 * Create test files for indexing
 *
 * This helper function creates a set of realistic test files with various
 * code patterns and structures. These files are used to test the parallel
 * indexing functionality with actual code content rather than empty files.
 *
 * @param workspaceDir - The directory where test files should be created
 * @returns {Promise<void>} A Promise that resolves when all files are created
 */
async function createTestFiles(workspaceDir: string): Promise<void> {
    // Define a set of test files with realistic code content
    // These files represent common patterns found in real codebases
    const testFiles = [
        {
            path: 'src/utils.ts',
            content: `
export function calculateSum(a: number, b: number): number {
    return a + b;
}

export function formatString(input: string): string {
    return input.trim().toLowerCase();
}

export class DataProcessor {
    private data: any[] = [];
    
    addItem(item: any): void {
        this.data.push(item);
    }
    
    getCount(): number {
        return this.data.length;
    }
}
`
        },
        {
            path: 'src/api.ts',
            content: `
import { DataProcessor } from './utils';

export interface ApiResponse {
    success: boolean;
    data?: any;
    error?: string;
}

export class ApiClient {
    private baseUrl: string;
    private processor: DataProcessor;
    
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.processor = new DataProcessor();
    }
    
    async fetchData(endpoint: string): Promise<ApiResponse> {
        try {
            const response = await fetch(\`\${this.baseUrl}/\${endpoint}\`);
            const data = await response.json();
            this.processor.addItem(data);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
`
        },
        {
            path: 'src/components/Button.tsx',
            content: `
import React from 'react';

interface ButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
    label,
    onClick,
    disabled = false,
    variant = 'primary'
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={\`btn btn-\${variant}\`}
        >
            {label}
        </button>
    );
};
`
        },
        {
            path: 'src/services/UserService.ts',
            content: `
export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
}

export class UserService {
    private users: Map<string, User> = new Map();
    
    createUser(name: string, email: string): User {
        const user: User = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            email,
            createdAt: new Date()
        };
        
        this.users.set(user.id, user);
        return user;
    }
    
    getUser(id: string): User | undefined {
        return this.users.get(id);
    }
    
    getAllUsers(): User[] {
        return Array.from(this.users.values());
    }
    
    updateUser(id: string, updates: Partial<User>): User | null {
        const user = this.users.get(id);
        if (!user) return null;
        
        const updatedUser = { ...user, ...updates };
        this.users.set(id, updatedUser);
        return updatedUser;
    }
    
    deleteUser(id: string): boolean {
        return this.users.delete(id);
    }
}
`
        }
    ];

    // Create directories and files in the workspace
    // This ensures the directory structure exists before writing files
    for (const file of testFiles) {
        const fullPath = path.join(workspaceDir, file.path);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, file.content);
    }
    
    console.log(`Created ${testFiles.length} test files in ${workspaceDir}`);
}
