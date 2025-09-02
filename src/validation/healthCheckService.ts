/**
 * HealthCheckService
 *
 * Lightweight health checks for core dependencies (Qdrant and Embedding Provider)
 * using existing ContextService status APIs. Designed to avoid tight coupling by
 * leveraging ContextService rather than reaching into lower-level services directly.
 */

import { ContextService } from "../context/contextService";

export interface HealthCheckResult {
  service: string;
  status: "healthy" | "unhealthy";
  details: string;
}

export class HealthCheckService {
  constructor(private contextService: ContextService) {}

  /** Basic Qdrant check via ContextService status */
  public async checkQdrant(): Promise<HealthCheckResult> {
    try {
      const status = await this.contextService.getStatus();
      return {
        service: "Qdrant DB",
        status: status.qdrantConnected ? "healthy" : "unhealthy",
        details: status.qdrantConnected
          ? "Connection successful."
          : "Qdrant connection failed",
      };
    } catch (error) {
      return {
        service: "Qdrant DB",
        status: "unhealthy",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Basic embedding provider check via provider presence */
  public async checkEmbeddingProvider(): Promise<HealthCheckResult> {
    try {
      const status = await this.contextService.getStatus();
      return {
        service: "Embedding Provider",
        status: status.embeddingProvider ? "healthy" : "unhealthy",
        details: status.embeddingProvider
          ? `Provider: ${status.embeddingProvider}`
          : "No provider available",
      };
    } catch (error) {
      return {
        service: "Embedding Provider",
        status: "unhealthy",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Run all health checks and return normalized results.
   */
  public async runAllChecks(): Promise<HealthCheckResult[]> {
    const [qdrant, provider] = await Promise.all([
      this.checkQdrant(),
      this.checkEmbeddingProvider(),
    ]);
    return [qdrant, provider];
  }
}

