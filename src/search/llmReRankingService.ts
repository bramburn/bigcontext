/**
 * LLM Re-Ranking Service
 *
 * This service uses LLM to re-rank search results based on semantic relevance
 * to the original query. It analyzes both the query intent and the code content
 * to provide more accurate ranking than pure vector similarity.
 *
 * The service takes initial search results and uses LLM to evaluate how well
 * each result matches the user's intent, then re-orders them accordingly.
 */

import { ConfigService } from "../configService";
import { CodeChunk } from "../parsing/chunker";

/**
 * Interface for search result with relevance score
 */
export interface RankedResult {
  /** The code chunk */
  chunk: CodeChunk;
  /** Original vector similarity score (0-1) */
  originalScore: number;
  /** LLM relevance score (0-1) */
  llmScore: number;
  /** Combined final score (0-1) */
  finalScore: number;
  /** Explanation of why this result is relevant */
  explanation?: string;
}

/**
 * Interface for re-ranking results
 */
export interface ReRankingResult {
  /** Original query */
  query: string;
  /** Re-ranked results */
  rankedResults: RankedResult[];
  /** Time taken for re-ranking in milliseconds */
  reRankingTime: number;
  /** Number of results processed */
  processedCount: number;
  /** Whether re-ranking was successful */
  success: boolean;
}

/**
 * Configuration for LLM re-ranking
 */
export interface LLMReRankingConfig {
  /** Whether re-ranking is enabled */
  enabled: boolean;
  /** Maximum number of results to re-rank */
  maxResultsToReRank: number;
  /** Weight for original vector score (0-1) */
  vectorScoreWeight: number;
  /** Weight for LLM score (0-1) */
  llmScoreWeight: number;
  /** LLM provider to use for re-ranking */
  llmProvider: "openai" | "ollama";
  /** Model to use for re-ranking */
  model: string;
  /** API key for LLM provider (if required) */
  apiKey?: string;
  /** API URL for LLM provider */
  apiUrl?: string;
  /** Timeout for LLM requests in milliseconds */
  timeout: number;
  /** Whether to include explanations in results */
  includeExplanations: boolean;
}

/**
 * Service for re-ranking search results using LLM
 */
export class LLMReRankingService {
  private config: LLMReRankingConfig;
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from ConfigService
   */
  private loadConfig(): LLMReRankingConfig {
    const baseConfig = this.configService.getFullConfig();

    return {
      enabled: baseConfig.llmReRanking?.enabled ?? true,
      maxResultsToReRank: baseConfig.llmReRanking?.maxResultsToReRank ?? 10,
      vectorScoreWeight: baseConfig.llmReRanking?.vectorScoreWeight ?? 0.3,
      llmScoreWeight: baseConfig.llmReRanking?.llmScoreWeight ?? 0.7,
      llmProvider:
        baseConfig.llmReRanking?.llmProvider ?? baseConfig.embeddingProvider,
      model:
        baseConfig.llmReRanking?.model ??
        (baseConfig.embeddingProvider === "openai"
          ? "gpt-3.5-turbo"
          : "llama2"),
      apiKey: baseConfig.llmReRanking?.apiKey ?? baseConfig.openai?.apiKey,
      apiUrl:
        baseConfig.llmReRanking?.apiUrl ??
        (baseConfig.embeddingProvider === "ollama"
          ? baseConfig.ollama?.apiUrl
          : "https://api.openai.com/v1"),
      timeout: baseConfig.llmReRanking?.timeout ?? 10000,
      includeExplanations:
        baseConfig.llmReRanking?.includeExplanations ?? false,
    };
  }

  /**
   * Re-rank search results using LLM
   */
  public async reRankResults(
    query: string,
    results: Array<{ chunk: CodeChunk; score: number }>,
  ): Promise<ReRankingResult> {
    const startTime = Date.now();

    // If re-ranking is disabled, return original results
    if (!this.config.enabled) {
      return {
        query,
        rankedResults: results.map((result) => ({
          chunk: result.chunk,
          originalScore: result.score,
          llmScore: result.score,
          finalScore: result.score,
        })),
        reRankingTime: Date.now() - startTime,
        processedCount: results.length,
        success: true,
      };
    }

    try {
      // Limit the number of results to re-rank for performance
      const resultsToReRank = results.slice(0, this.config.maxResultsToReRank);

      // Get LLM scores for each result
      const llmScores = await this.getLLMScores(query, resultsToReRank);

      // Combine scores and create ranked results
      const rankedResults: RankedResult[] = resultsToReRank.map(
        (result, index) => {
          const llmScore = llmScores[index]?.score ?? 0;
          const explanation = llmScores[index]?.explanation;

          // Calculate final score as weighted combination
          const finalScore =
            result.score * this.config.vectorScoreWeight +
            llmScore * this.config.llmScoreWeight;

          return {
            chunk: result.chunk,
            originalScore: result.score,
            llmScore,
            finalScore,
            explanation: this.config.includeExplanations
              ? explanation
              : undefined,
          };
        },
      );

      // Sort by final score (descending)
      rankedResults.sort((a, b) => b.finalScore - a.finalScore);

      // Add any remaining results that weren't re-ranked
      const remainingResults = results
        .slice(this.config.maxResultsToReRank)
        .map((result) => ({
          chunk: result.chunk,
          originalScore: result.score,
          llmScore: result.score, // Use original score as LLM score
          finalScore: result.score,
        }));

      return {
        query,
        rankedResults: [...rankedResults, ...remainingResults],
        reRankingTime: Date.now() - startTime,
        processedCount: resultsToReRank.length,
        success: true,
      };
    } catch (error) {
      console.error("LLMReRankingService: Error re-ranking results:", error);

      // Return original results on error
      return {
        query,
        rankedResults: results.map((result) => ({
          chunk: result.chunk,
          originalScore: result.score,
          llmScore: result.score,
          finalScore: result.score,
        })),
        reRankingTime: Date.now() - startTime,
        processedCount: 0,
        success: false,
      };
    }
  }

  /**
   * Get LLM relevance scores for search results
   */
  private async getLLMScores(
    query: string,
    results: Array<{ chunk: CodeChunk; score: number }>,
  ): Promise<Array<{ score: number; explanation?: string }>> {
    const prompt = this.createReRankingPrompt(query, results);

    if (this.config.llmProvider === "openai") {
      return await this.reRankWithOpenAI(prompt, results.length);
    } else {
      return await this.reRankWithOllama(prompt, results.length);
    }
  }

  /**
   * Create prompt for re-ranking
   */
  private createReRankingPrompt(
    query: string,
    results: Array<{ chunk: CodeChunk; score: number }>,
  ): string {
    const codeSnippets = results
      .map((result, index) => {
        const chunk = result.chunk;
        return `[${index + 1}] File: ${chunk.filePath}
Type: ${chunk.type}
Content: ${chunk.content.substring(0, 300)}${chunk.content.length > 300 ? "..." : ""}`;
      })
      .join("\n\n");

    return `You are a code search relevance evaluator. Given a user's search query and code snippets, rate how relevant each snippet is to the query.

User Query: "${query}"

Code Snippets:
${codeSnippets}

For each snippet, provide a relevance score from 0.0 to 1.0 where:
- 1.0 = Perfectly matches the query intent
- 0.8-0.9 = Highly relevant, directly addresses the query
- 0.6-0.7 = Moderately relevant, related to the query
- 0.4-0.5 = Somewhat relevant, tangentially related
- 0.0-0.3 = Not relevant or unrelated

${this.config.includeExplanations ? "Also provide a brief explanation for each score." : ""}

Respond with only the scores${this.config.includeExplanations ? " and explanations" : ""}, one per line, in the format:
${this.config.includeExplanations ? "[number]: [score] - [explanation]" : "[number]: [score]"}

Example:
1: 0.9${this.config.includeExplanations ? " - Directly implements the requested functionality" : ""}
2: 0.6${this.config.includeExplanations ? " - Related utility function that supports the main feature" : ""}

Scores:`;
  }

  /**
   * Re-rank using OpenAI
   */
  private async reRankWithOpenAI(
    prompt: string,
    resultCount: number,
  ): Promise<Array<{ score: number; explanation?: string }>> {
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
        max_tokens: 500,
        temperature: 0.1,
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

    return this.parseReRankingScores(content, resultCount);
  }

  /**
   * Re-rank using Ollama
   */
  private async reRankWithOllama(
    prompt: string,
    resultCount: number,
  ): Promise<Array<{ score: number; explanation?: string }>> {
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
          temperature: 0.1,
          num_predict: 500,
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

    return this.parseReRankingScores(content, resultCount);
  }

  /**
   * Parse re-ranking scores from LLM response
   */
  private parseReRankingScores(
    content: string,
    expectedCount: number,
  ): Array<{ score: number; explanation?: string }> {
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    const scores: Array<{ score: number; explanation?: string }> = [];

    for (let i = 0; i < expectedCount; i++) {
      const line = lines.find((l) => l.trim().startsWith(`${i + 1}:`));

      if (line) {
        const match = line.match(/(\d+):\s*([\d.]+)(?:\s*-\s*(.+))?/);
        if (match) {
          const score = Math.max(0, Math.min(1, parseFloat(match[2])));
          const explanation = match[3]?.trim();
          scores.push({ score, explanation });
        } else {
          scores.push({ score: 0.5 }); // Default score if parsing fails
        }
      } else {
        scores.push({ score: 0.5 }); // Default score if line not found
      }
    }

    return scores;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<LLMReRankingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): LLMReRankingConfig {
    return { ...this.config };
  }

  /**
   * Check if re-ranking is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }
}
