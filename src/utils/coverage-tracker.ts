/**
 * API coverage tracking and monitoring
 * Constitution Principle I: Complete API Coverage
 * Constitution Principle V: Maintainability & Documentation
 */

export interface EndpointStats {
  endpoint: string;
  method: string;
  calls: number;
  successes: number;
  failures: number;
  lastCalled?: Date;
  lastSuccess?: Date;
  lastFailure?: Date;
  averageResponseTimeMs?: number;
  schemaVersion?: string;
}

export interface ApiCoverageStats {
  totalEndpoints: number;
  implementedEndpoints: number;
  experimentalEndpoints: number;
  notImplementedEndpoints: number;
  coveragePercentage: number;
  lastUpdated: Date;
}

/**
 * Coverage tracker for monitoring API usage and detecting changes
 */
class CoverageTracker {
  private stats: Map<string, EndpointStats> = new Map();
  private schemaVersions: Map<string, string> = new Map();

  /**
   * Record an API request
   */
  recordRequest(
    endpoint: string,
    method: string,
    success: boolean,
    responseTimeMs?: number,
    schemaVersion?: string
  ): void {
    const key = `${method}:${endpoint}`;
    const existing = this.stats.get(key);

    if (existing) {
      existing.calls++;
      if (success) {
        existing.successes++;
        existing.lastSuccess = new Date();
      } else {
        existing.failures++;
        existing.lastFailure = new Date();
      }
      existing.lastCalled = new Date();

      // Update average response time
      if (responseTimeMs !== undefined) {
        const currentAvg = existing.averageResponseTimeMs || 0;
        const totalTime = currentAvg * (existing.calls - 1) + responseTimeMs;
        existing.averageResponseTimeMs = totalTime / existing.calls;
      }

      // Update schema version
      if (schemaVersion) {
        existing.schemaVersion = schemaVersion;
      }
    } else {
      this.stats.set(key, {
        endpoint,
        method,
        calls: 1,
        successes: success ? 1 : 0,
        failures: success ? 0 : 1,
        lastCalled: new Date(),
        lastSuccess: success ? new Date() : undefined,
        lastFailure: success ? undefined : new Date(),
        averageResponseTimeMs: responseTimeMs,
        schemaVersion
      });
    }

    // Track schema version changes
    if (schemaVersion) {
      const previousVersion = this.schemaVersions.get(endpoint);
      if (previousVersion && previousVersion !== schemaVersion) {
        console.warn(`[Coverage Tracker] Schema version changed for ${endpoint}: ${previousVersion} → ${schemaVersion}`);
      }
      this.schemaVersions.set(endpoint, schemaVersion);
    }
  }

  /**
   * Get statistics for a specific endpoint
   */
  getEndpointStats(endpoint: string, method: string): EndpointStats | undefined {
    return this.stats.get(`${method}:${endpoint}`);
  }

  /**
   * Get all endpoint statistics
   */
  getAllStats(): EndpointStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Detect schema changes by comparing versions
   */
  detectSchemaChanges(): Array<{ endpoint: string; oldVersion?: string; newVersion: string }> {
    const changes: Array<{ endpoint: string; oldVersion?: string; newVersion: string }> = [];

    for (const [endpoint, version] of this.schemaVersions.entries()) {
      const stats = Array.from(this.stats.values()).find(s => s.endpoint === endpoint);
      if (stats && stats.schemaVersion && stats.schemaVersion !== version) {
        changes.push({
          endpoint,
          oldVersion: version,
          newVersion: stats.schemaVersion
        });
      }
    }

    return changes;
  }

  /**
   * Calculate API coverage percentage
   */
  calculateCoveragePercentage(
    discoveredEndpoints: number,
    implementedEndpoints: number
  ): number {
    if (discoveredEndpoints === 0) return 0;
    return Math.round((implementedEndpoints / discoveredEndpoints) * 100);
  }

  /**
   * Generate summary report
   */
  generateSummaryReport(): string {
    const stats = this.getAllStats();
    const totalCalls = stats.reduce((sum, s) => sum + s.calls, 0);
    const totalSuccesses = stats.reduce((sum, s) => sum + s.successes, 0);
    const totalFailures = stats.reduce((sum, s) => sum + s.failures, 0);
    const successRate = totalCalls > 0 ? ((totalSuccesses / totalCalls) * 100).toFixed(2) : '0';

    const lines = [
      '=== Sunsama API Coverage Report ===',
      `Total Endpoints Called: ${stats.length}`,
      `Total API Calls: ${totalCalls}`,
      `Successes: ${totalSuccesses}`,
      `Failures: ${totalFailures}`,
      `Success Rate: ${successRate}%`,
      '',
      '=== Endpoint Details ===',
      ...stats.map(s => {
        const successRate = s.calls > 0 ? ((s.successes / s.calls) * 100).toFixed(0) : '0';
        const avgTime = s.averageResponseTimeMs ? `${s.averageResponseTimeMs.toFixed(0)}ms` : 'N/A';
        return `${s.method} ${s.endpoint}: ${s.calls} calls, ${successRate}% success, avg ${avgTime}`;
      })
    ];

    return lines.join('\n');
  }

  /**
   * Clear all statistics (for testing or reset)
   */
  clearStats(): void {
    this.stats.clear();
    this.schemaVersions.clear();
  }

  /**
   * Export stats to JSON
   */
  exportStats(): string {
    return JSON.stringify({
      stats: Array.from(this.stats.entries()),
      schemaVersions: Array.from(this.schemaVersions.entries()),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

// Singleton instance
export const coverageTracker = new CoverageTracker();

// Export class for testing
export { CoverageTracker };
