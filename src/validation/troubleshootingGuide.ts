/**
 * TroubleshootingGuide - Interactive Troubleshooting System
 * 
 * This service provides step-by-step troubleshooting guides for common
 * setup and configuration issues, with provider-specific solutions.
 */

import * as vscode from 'vscode';
import { ValidationResult } from './systemValidator';

export interface TroubleshootingStep {
    id: string;
    title: string;
    description: string;
    action?: 'command' | 'link' | 'manual' | 'auto-fix';
    actionData?: string;
    expectedResult?: string;
    nextStepOnSuccess?: string;
    nextStepOnFailure?: string;
}

export interface TroubleshootingGuide {
    id: string;
    title: string;
    description: string;
    category: 'docker' | 'network' | 'database' | 'embedding' | 'general';
    severity: 'low' | 'medium' | 'high' | 'critical';
    estimatedTime: string;
    steps: TroubleshootingStep[];
    relatedIssues?: string[];
}

export class TroubleshootingSystem {
    private guides: Map<string, TroubleshootingGuide> = new Map();

    constructor() {
        this.initializeGuides();
    }

    /**
     * Initialize all troubleshooting guides
     */
    private initializeGuides(): void {
        // Docker-related guides
        this.addGuide(this.createDockerInstallationGuide());
        this.addGuide(this.createDockerDaemonGuide());
        this.addGuide(this.createDockerPermissionsGuide());

        // Network-related guides
        this.addGuide(this.createNetworkConnectivityGuide());
        this.addGuide(this.createProxyConfigurationGuide());
        this.addGuide(this.createFirewallGuide());

        // Database-specific guides
        this.addGuide(this.createQdrantTroubleshootingGuide());
        this.addGuide(this.createChromaDBTroubleshootingGuide());
        this.addGuide(this.createPineconeTroubleshootingGuide());

        // Embedding provider guides
        this.addGuide(this.createOllamaTroubleshootingGuide());
        this.addGuide(this.createOpenAITroubleshootingGuide());

        // General guides
        this.addGuide(this.createPortConflictGuide());
        this.addGuide(this.createPerformanceGuide());
    }

    /**
     * Add a guide to the system
     */
    private addGuide(guide: TroubleshootingGuide): void {
        this.guides.set(guide.id, guide);
    }

    /**
     * Get troubleshooting suggestions based on validation results
     */
    getSuggestedGuides(validationResults: ValidationResult[]): TroubleshootingGuide[] {
        const suggestions: TroubleshootingGuide[] = [];
        const addedGuides = new Set<string>();

        for (const result of validationResults) {
            if (result.status === 'fail' || result.status === 'warning') {
                const guideIds = this.getGuideIdsForIssue(result);
                
                for (const guideId of guideIds) {
                    if (!addedGuides.has(guideId)) {
                        const guide = this.guides.get(guideId);
                        if (guide) {
                            suggestions.push(guide);
                            addedGuides.add(guideId);
                        }
                    }
                }
            }
        }

        // Sort by severity and category
        return suggestions.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    /**
     * Get guide IDs for a specific issue
     */
    private getGuideIdsForIssue(result: ValidationResult): string[] {
        const guideIds: string[] = [];

        switch (result.category) {
            case 'docker':
                if (result.check.includes('Installation')) {
                    guideIds.push('docker-installation');
                } else if (result.check.includes('Daemon')) {
                    guideIds.push('docker-daemon');
                } else if (result.check.includes('Permission')) {
                    guideIds.push('docker-permissions');
                }
                break;

            case 'network':
                guideIds.push('network-connectivity');
                if (result.message.includes('proxy')) {
                    guideIds.push('proxy-configuration');
                }
                if (result.message.includes('firewall')) {
                    guideIds.push('firewall-configuration');
                }
                break;

            case 'ports':
                guideIds.push('port-conflicts');
                break;

            case 'system':
                if (result.check.includes('Memory') || result.check.includes('Performance')) {
                    guideIds.push('performance-optimization');
                }
                break;
        }

        return guideIds;
    }

    /**
     * Get a specific guide by ID
     */
    getGuide(id: string): TroubleshootingGuide | undefined {
        return this.guides.get(id);
    }

    /**
     * Get all guides for a category
     */
    getGuidesByCategory(category: string): TroubleshootingGuide[] {
        return Array.from(this.guides.values()).filter(guide => guide.category === category);
    }

    /**
     * Search guides by keywords
     */
    searchGuides(keywords: string): TroubleshootingGuide[] {
        const searchTerms = keywords.toLowerCase().split(' ');
        return Array.from(this.guides.values()).filter(guide => {
            const searchText = `${guide.title} ${guide.description}`.toLowerCase();
            return searchTerms.some(term => searchText.includes(term));
        });
    }

    // Guide creation methods
    private createDockerInstallationGuide(): TroubleshootingGuide {
        return {
            id: 'docker-installation',
            title: 'Docker Installation Issues',
            description: 'Resolve Docker installation and setup problems',
            category: 'docker',
            severity: 'high',
            estimatedTime: '10-15 minutes',
            steps: [
                {
                    id: 'check-installation',
                    title: 'Check Docker Installation',
                    description: 'Verify if Docker is properly installed on your system',
                    action: 'command',
                    actionData: 'docker --version',
                    expectedResult: 'Docker version information should be displayed',
                    nextStepOnSuccess: 'check-daemon',
                    nextStepOnFailure: 'install-docker'
                },
                {
                    id: 'install-docker',
                    title: 'Install Docker',
                    description: 'Download and install Docker Desktop for your operating system',
                    action: 'link',
                    actionData: 'https://docs.docker.com/get-docker/',
                    expectedResult: 'Docker Desktop should be installed and running',
                    nextStepOnSuccess: 'verify-installation'
                },
                {
                    id: 'verify-installation',
                    title: 'Verify Installation',
                    description: 'Test Docker installation with a simple command',
                    action: 'command',
                    actionData: 'docker run hello-world',
                    expectedResult: 'Hello World message from Docker should appear'
                }
            ]
        };
    }

    private createDockerDaemonGuide(): TroubleshootingGuide {
        return {
            id: 'docker-daemon',
            title: 'Docker Daemon Not Running',
            description: 'Fix issues with Docker daemon not starting or being accessible',
            category: 'docker',
            severity: 'high',
            estimatedTime: '5-10 minutes',
            steps: [
                {
                    id: 'start-docker-desktop',
                    title: 'Start Docker Desktop',
                    description: 'Launch Docker Desktop application',
                    action: 'auto-fix',
                    actionData: 'start-docker',
                    expectedResult: 'Docker Desktop should start and show running status',
                    nextStepOnSuccess: 'verify-daemon',
                    nextStepOnFailure: 'manual-start'
                },
                {
                    id: 'manual-start',
                    title: 'Manual Start',
                    description: 'Manually start Docker Desktop from Applications/Programs',
                    action: 'manual',
                    expectedResult: 'Docker Desktop icon should appear in system tray/menu bar',
                    nextStepOnSuccess: 'verify-daemon'
                },
                {
                    id: 'verify-daemon',
                    title: 'Verify Daemon',
                    description: 'Check if Docker daemon is responding',
                    action: 'command',
                    actionData: 'docker info',
                    expectedResult: 'Docker system information should be displayed'
                }
            ]
        };
    }

    private createOllamaTroubleshootingGuide(): TroubleshootingGuide {
        return {
            id: 'ollama-troubleshooting',
            title: 'Ollama Connection Issues',
            description: 'Resolve Ollama installation and connection problems',
            category: 'embedding',
            severity: 'medium',
            estimatedTime: '10-15 minutes',
            steps: [
                {
                    id: 'check-ollama-installation',
                    title: 'Check Ollama Installation',
                    description: 'Verify if Ollama is installed and accessible',
                    action: 'command',
                    actionData: 'ollama --version',
                    expectedResult: 'Ollama version should be displayed',
                    nextStepOnSuccess: 'check-ollama-service',
                    nextStepOnFailure: 'install-ollama'
                },
                {
                    id: 'install-ollama',
                    title: 'Install Ollama',
                    description: 'Download and install Ollama from the official website',
                    action: 'link',
                    actionData: 'https://ollama.ai/',
                    expectedResult: 'Ollama should be installed and available in PATH',
                    nextStepOnSuccess: 'start-ollama-service'
                },
                {
                    id: 'check-ollama-service',
                    title: 'Check Ollama Service',
                    description: 'Verify if Ollama service is running',
                    action: 'command',
                    actionData: 'curl http://localhost:11434/api/tags',
                    expectedResult: 'JSON response with available models',
                    nextStepOnSuccess: 'test-model',
                    nextStepOnFailure: 'start-ollama-service'
                },
                {
                    id: 'start-ollama-service',
                    title: 'Start Ollama Service',
                    description: 'Start the Ollama service',
                    action: 'command',
                    actionData: 'ollama serve',
                    expectedResult: 'Ollama service should start and listen on port 11434',
                    nextStepOnSuccess: 'pull-model'
                },
                {
                    id: 'pull-model',
                    title: 'Pull Embedding Model',
                    description: 'Download a recommended embedding model',
                    action: 'command',
                    actionData: 'ollama pull nomic-embed-text',
                    expectedResult: 'Model should be downloaded and available for use'
                }
            ]
        };
    }

    private createPineconeTroubleshootingGuide(): TroubleshootingGuide {
        return {
            id: 'pinecone-troubleshooting',
            title: 'Pinecone API Issues',
            description: 'Resolve Pinecone API key and connection problems',
            category: 'database',
            severity: 'medium',
            estimatedTime: '5-10 minutes',
            steps: [
                {
                    id: 'verify-api-key',
                    title: 'Verify API Key Format',
                    description: 'Check if your Pinecone API key has the correct format',
                    action: 'manual',
                    expectedResult: 'API key should be a long alphanumeric string',
                    nextStepOnSuccess: 'test-api-key',
                    nextStepOnFailure: 'get-new-api-key'
                },
                {
                    id: 'get-new-api-key',
                    title: 'Get New API Key',
                    description: 'Generate a new API key from Pinecone console',
                    action: 'link',
                    actionData: 'https://app.pinecone.io/',
                    expectedResult: 'New API key should be generated and copied',
                    nextStepOnSuccess: 'test-api-key'
                },
                {
                    id: 'test-api-key',
                    title: 'Test API Key',
                    description: 'Verify API key works by listing indexes',
                    action: 'manual',
                    expectedResult: 'API should respond with list of indexes or empty array'
                }
            ]
        };
    }

    private createNetworkConnectivityGuide(): TroubleshootingGuide {
        return {
            id: 'network-connectivity',
            title: 'Network Connectivity Issues',
            description: 'Diagnose and fix internet connectivity problems',
            category: 'network',
            severity: 'medium',
            estimatedTime: '10-15 minutes',
            steps: [
                {
                    id: 'test-basic-connectivity',
                    title: 'Test Basic Internet Connection',
                    description: 'Check if you can reach external websites',
                    action: 'command',
                    actionData: 'ping google.com',
                    expectedResult: 'Should receive ping responses',
                    nextStepOnSuccess: 'test-https',
                    nextStepOnFailure: 'check-network-settings'
                },
                {
                    id: 'test-https',
                    title: 'Test HTTPS Connectivity',
                    description: 'Verify HTTPS connections work',
                    action: 'command',
                    actionData: 'curl -I https://api.openai.com',
                    expectedResult: 'Should receive HTTP headers',
                    nextStepOnFailure: 'check-proxy-settings'
                },
                {
                    id: 'check-proxy-settings',
                    title: 'Check Proxy Configuration',
                    description: 'Verify proxy settings if you are behind a corporate firewall',
                    action: 'manual',
                    expectedResult: 'Proxy settings should be correctly configured'
                }
            ]
        };
    }

    private createPortConflictGuide(): TroubleshootingGuide {
        return {
            id: 'port-conflicts',
            title: 'Port Conflict Resolution',
            description: 'Resolve conflicts when required ports are already in use',
            category: 'general',
            severity: 'medium',
            estimatedTime: '5-10 minutes',
            steps: [
                {
                    id: 'identify-process',
                    title: 'Identify Process Using Port',
                    description: 'Find which process is using the conflicting port',
                    action: 'command',
                    actionData: 'lsof -i :6333',
                    expectedResult: 'Should show process information',
                    nextStepOnSuccess: 'stop-process'
                },
                {
                    id: 'stop-process',
                    title: 'Stop Conflicting Process',
                    description: 'Stop the process that is using the required port',
                    action: 'manual',
                    expectedResult: 'Port should become available'
                }
            ]
        };
    }

    private createPerformanceGuide(): TroubleshootingGuide {
        return {
            id: 'performance-optimization',
            title: 'Performance Optimization',
            description: 'Improve system performance for better indexing and search',
            category: 'general',
            severity: 'low',
            estimatedTime: '15-20 minutes',
            steps: [
                {
                    id: 'check-memory-usage',
                    title: 'Check Memory Usage',
                    description: 'Monitor current memory consumption',
                    action: 'manual',
                    expectedResult: 'Should have at least 2GB free memory'
                },
                {
                    id: 'optimize-docker',
                    title: 'Optimize Docker Settings',
                    description: 'Adjust Docker memory and CPU limits',
                    action: 'manual',
                    expectedResult: 'Docker should have adequate resources allocated'
                }
            ]
        };
    }

    // Additional guide creation methods would go here...
    private createDockerPermissionsGuide(): TroubleshootingGuide {
        return {
            id: 'docker-permissions',
            title: 'Docker Permission Issues',
            description: 'Fix Docker permission denied errors',
            category: 'docker',
            severity: 'medium',
            estimatedTime: '5-10 minutes',
            steps: []
        };
    }

    private createProxyConfigurationGuide(): TroubleshootingGuide {
        return {
            id: 'proxy-configuration',
            title: 'Proxy Configuration',
            description: 'Configure proxy settings for corporate networks',
            category: 'network',
            severity: 'medium',
            estimatedTime: '10-15 minutes',
            steps: []
        };
    }

    private createFirewallGuide(): TroubleshootingGuide {
        return {
            id: 'firewall-configuration',
            title: 'Firewall Configuration',
            description: 'Configure firewall settings for required ports',
            category: 'network',
            severity: 'medium',
            estimatedTime: '10-15 minutes',
            steps: []
        };
    }

    private createQdrantTroubleshootingGuide(): TroubleshootingGuide {
        return {
            id: 'qdrant-troubleshooting',
            title: 'Qdrant Issues',
            description: 'Resolve Qdrant database problems',
            category: 'database',
            severity: 'medium',
            estimatedTime: '10-15 minutes',
            steps: []
        };
    }

    private createChromaDBTroubleshootingGuide(): TroubleshootingGuide {
        return {
            id: 'chromadb-troubleshooting',
            title: 'ChromaDB Issues',
            description: 'Resolve ChromaDB database problems',
            category: 'database',
            severity: 'medium',
            estimatedTime: '10-15 minutes',
            steps: []
        };
    }

    private createOpenAITroubleshootingGuide(): TroubleshootingGuide {
        return {
            id: 'openai-troubleshooting',
            title: 'OpenAI API Issues',
            description: 'Resolve OpenAI API key and quota problems',
            category: 'embedding',
            severity: 'medium',
            estimatedTime: '5-10 minutes',
            steps: []
        };
    }
}
