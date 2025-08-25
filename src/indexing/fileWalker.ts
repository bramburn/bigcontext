import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import ignore from 'ignore';

export class FileWalker {
    private workspaceRoot: string;
    private ignoreInstance: ReturnType<typeof ignore>;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.ignoreInstance = ignore();
        
        // Add common patterns to ignore by default
        this.ignoreInstance.add([
            'node_modules/**',
            '.git/**',
            'dist/**',
            'build/**',
            'out/**',
            '*.min.js',
            '*.map',
            '.vscode/**',
            '.idea/**',
            '*.log',
            'coverage/**',
            '.nyc_output/**'
        ]);
    }

    private async loadGitignore(): Promise<void> {
        const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
        
        try {
            const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf8');
            const lines = gitignoreContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
            
            this.ignoreInstance.add(lines);
        } catch (error) {
            // .gitignore file not found or not readable, continue with default patterns
            console.log('No .gitignore file found or not readable, using default ignore patterns');
        }
    }

    public async findAllFiles(): Promise<string[]> {
        await this.loadGitignore();

        // Define patterns for code files we want to index
        const patterns = [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.jsx',
            '**/*.py',
            '**/*.cs',
            '**/*.java',
            '**/*.cpp',
            '**/*.c',
            '**/*.h',
            '**/*.hpp',
            '**/*.go',
            '**/*.rs',
            '**/*.php',
            '**/*.rb',
            '**/*.swift',
            '**/*.kt',
            '**/*.scala',
            '**/*.clj',
            '**/*.sh',
            '**/*.ps1',
            '**/*.sql',
            '**/*.md',
            '**/*.json',
            '**/*.yaml',
            '**/*.yml',
            '**/*.xml',
            '**/*.html',
            '**/*.css',
            '**/*.scss',
            '**/*.less'
        ];

        const allFiles: string[] = [];

        for (const pattern of patterns) {
            try {
                const files = await glob(pattern, {
                    cwd: this.workspaceRoot,
                    absolute: true,
                    nodir: true,
                    dot: false
                });
                allFiles.push(...files);
            } catch (error) {
                console.error(`Error finding files with pattern ${pattern}:`, error);
            }
        }

        // Remove duplicates and filter using ignore patterns
        const uniqueFiles = [...new Set(allFiles)];
        const filteredFiles = uniqueFiles.filter(filePath => {
            const relativePath = path.relative(this.workspaceRoot, filePath);
            return !this.ignoreInstance.ignores(relativePath);
        });

        return filteredFiles;
    }

    public async getFileStats(): Promise<{ totalFiles: number; filesByExtension: Record<string, number> }> {
        const files = await this.findAllFiles();
        const filesByExtension: Record<string, number> = {};

        files.forEach(filePath => {
            const ext = path.extname(filePath).toLowerCase();
            filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;
        });

        return {
            totalFiles: files.length,
            filesByExtension
        };
    }

    public isCodeFile(filePath: string): boolean {
        const codeExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.cs', '.java',
            '.cpp', '.c', '.h', '.hpp', '.go', '.rs', '.php',
            '.rb', '.swift', '.kt', '.scala', '.clj'
        ];
        
        const ext = path.extname(filePath).toLowerCase();
        return codeExtensions.includes(ext);
    }
}
