/**
 * NeuralLog client options
 */
export interface NeuralLogClientOptions {
  /**
   * Server URL
   * If not provided, will be fetched from the registry
   */
  serverUrl?: string;

  /**
   * Authentication URL
   * If not provided, will be fetched from the registry
   */
  authUrl?: string;

  /**
   * Tenant ID
   * Required for registry lookup
   */
  tenantId: string;

  /**
   * Registry URL
   * If not provided, will be constructed from the tenant ID
   */
  registryUrl?: string;

  /**
   * API key
   */
  apiKey?: string;

  /**
   * Web URL
   * If not provided, will be fetched from the registry
   */
  webUrl?: string;

  /**
   * Skip registry lookup
   * If true, will not attempt to fetch URLs from the registry
   */
  skipRegistryLookup?: boolean;

  /**
   * Registry URL override
   * If provided, will use this URL instead of constructing one from the tenant ID
   */
  registryUrlOverride?: string;
}

/**
 * Log options
 */
export interface LogOptions {
  /**
   * KEK version
   */
  kekVersion?: string;
}

/**
 * Get logs options
 */
export interface GetLogsOptions {
  /**
   * Result limit
   */
  limit?: number;
}

/**
 * Search options
 */
export interface SearchOptions {
  /**
   * Search query
   */
  query: string;

  /**
   * Result limit
   */
  limit?: number;
}
