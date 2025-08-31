/**
 * Query Expansion Service
 *
 * This service uses LLM to expand user queries with synonyms, related terms,
 * and alternative phrasings to improve search recall and accuracy.
 *
 * The service analyzes the user's query and generates additional search terms
 * that are semantically related, helping to find relevant code even when
 * the exact terminology doesn't match.
 */

import { ConfigService } from "../configService";

/**
 * Interface for expanded query results
 */
export interface ExpandedQuery {
  /** Original user query */
  originalQuery: string;
  /** Expanded terms and phrases */
  expandedTerms: string[];
  /** Combined query string for search */
  combinedQuery: string;
  /** Confidence score for the expansion (0-1) */
  confidence: number;
  /** Time taken for expansion in milliseconds */
  expansionTime: number;
}

/**
 * Configuration for query expansion
 */
export interface QueryExpansionConfig {
  /** Whether query expansion is enabled */
  enabled: boolean;
  /** Maximum number of expanded terms to generate */
  maxExpandedTerms: number;
  /** Minimum confidence threshold for including expanded terms */
  confidenceThreshold: number;
  /** LLM provider to use for expansion */
  llmProvider: "openai" | "ollama";
  /** Model to use for expansion */
  model: string;
  /** API key for LLM provider (if required) */
  apiKey?: string;
  /** API URL for LLM provider */
  apiUrl?: string;
  /** Timeout for LLM requests in milliseconds */
  timeout: number;
}

/**
 * Service for expanding user queries using LLM
 */
export class QueryExpansionService {
  private config: QueryExpansionConfig;
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from ConfigService
   */
  private loadConfig(): QueryExpansionConfig {
    const baseConfig = this.configService.getFullConfig();

    return {
      enabled: baseConfig.queryExpansion?.enabled ?? true,
      maxExpandedTerms: baseConfig.queryExpansion?.maxExpandedTerms ?? 5,
      confidenceThreshold:
        baseConfig.queryExpansion?.confidenceThreshold ?? 0.7,
      llmProvider:
        baseConfig.queryExpansion?.llmProvider ?? baseConfig.embeddingProvider,
      model:
        baseConfig.queryExpansion?.model ??
        (baseConfig.embeddingProvider === "openai"
          ? "gpt-3.5-turbo"
          : "llama2"),
      apiKey: baseConfig.queryExpansion?.apiKey ?? baseConfig.openai?.apiKey,
      apiUrl:
        baseConfig.queryExpansion?.apiUrl ??
        (baseConfig.embeddingProvider === "ollama"
          ? baseConfig.ollama?.apiUrl
          : "https://api.openai.com/v1"),
      timeout: baseConfig.queryExpansion?.timeout ?? 5000,
    };
  }

  /**
   * Expand a user query with related terms and phrases
   */
  public async expandQuery(query: string): Promise<ExpandedQuery> {
    const startTime = Date.now();

    // If expansion is disabled, return original query
    if (!this.config.enabled) {
      return {
        originalQuery: query,
        expandedTerms: [],
        combinedQuery: query,
        confidence: 1.0,
        expansionTime: Date.now() - startTime,
      };
    }

    try {
      // Generate expanded terms using LLM
      const expandedTerms = await this.generateExpandedTerms(query);

      // Filter terms by confidence threshold
      const filteredTerms = expandedTerms.slice(
        0,
        this.config.maxExpandedTerms,
      );

      // Combine original query with expanded terms
      const combinedQuery = this.combineQueryTerms(query, filteredTerms);

      // Calculate overall confidence
      const confidence = this.calculateConfidence(query, filteredTerms);

      return {
        originalQuery: query,
        expandedTerms: filteredTerms,
        combinedQuery,
        confidence,
        expansionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("QueryExpansionService: Error expanding query:", error);

      // Return original query on error
      return {
        originalQuery: query,
        expandedTerms: [],
        combinedQuery: query,
        confidence: 0.5, // Lower confidence due to expansion failure
        expansionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate expanded terms using LLM
   */
  private async generateExpandedTerms(query: string): Promise<string[]> {
    const prompt = this.createExpansionPrompt(query);

    if (this.config.llmProvider === "openai") {
      return await this.expandWithOpenAI(prompt);
    } else {
      return await this.expandWithOllama(prompt);
    }
  }

  /**
   * Create prompt for query expansion
   */
  private createExpansionPrompt(query: string): string {
    return `You are a code search assistant. Given a user's search query, generate related programming terms, synonyms, and alternative phrasings that would help find relevant code.

User Query: "${query}"

Generate 5-10 related terms or phrases that a developer might use when searching for similar code. Focus on:
- Programming synonyms and alternative terminology
- Related concepts and patterns
- Common abbreviations and variations
- Framework-specific terms if applicable

Return only the terms/phrases, one per line, without explanations or numbering.

Example:
For query "authentication middleware"
auth middleware
login handler
user verification
session management
security filter

Terms for "${query}":`;
  }

  /**
   * Expand query using OpenAI
   */
  private async expandWithOpenAI(prompt: string): Promise<string[]> {
    const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return this.parseExpandedTerms(content);
  }

  /**
   * Expand query using Ollama
   */
  private async expandWithOllama(prompt: string): Promise<string[]> {
    const response = await fetch(`${this.config.apiUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 200,
        },
      }),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const content = data.response || "";

    return this.parseExpandedTerms(content);
  }

  /**
   * Parse expanded terms from LLM response
   */
  private parseExpandedTerms(content: string): string[] {
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 && !line.includes(":") && !line.match(/^\d+\./),
      )
      .slice(0, this.config.maxExpandedTerms);
  }

  /**
   * Combine original query with expanded terms
   */
  private combineQueryTerms(
    originalQuery: string,
    expandedTerms: string[],
  ): string {
    if (expandedTerms.length === 0) {
      return originalQuery;
    }

    // Create a combined query that gives priority to original terms
    // but also includes expanded terms with lower weight
    const expandedQuery = expandedTerms.join(" OR ");
    return `(${originalQuery}) OR (${expandedQuery})`;
  }

  /**
   * Calculate confidence score for the expansion
   */
  private calculateConfidence(
    originalQuery: string,
    expandedTerms: string[],
  ): number {
    if (expandedTerms.length === 0) {
      return 0.5; // Lower confidence if no expansion was possible
    }

    // Base confidence on number of terms generated and query complexity
    const termRatio = Math.min(
      expandedTerms.length / this.config.maxExpandedTerms,
      1.0,
    );
    const queryComplexity = Math.min(originalQuery.split(" ").length / 3, 1.0);

    return Math.min(0.7 + termRatio * 0.2 + queryComplexity * 0.1, 1.0);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<QueryExpansionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): QueryExpansionConfig {
    return { ...this.config };
  }

  /**
   * Check if query expansion is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }
}
