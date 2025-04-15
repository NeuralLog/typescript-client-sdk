/**
 * NeuralLog client options
 */
export interface NeuralLogClientOptions {
  /**
   * Server URL
   */
  serverUrl?: string;
  
  /**
   * Authentication URL
   */
  authUrl?: string;
  
  /**
   * Tenant ID
   */
  tenantId?: string;
  
  /**
   * Registry URL
   */
  registryUrl?: string;
  
  /**
   * API key
   */
  apiKey?: string;
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
