/**
 * Interface for client configuration
 */
export interface ClientConfig {
  /**
   * API URL
   */
  apiUrl: string;
  
  /**
   * Auth URL
   */
  authUrl: string;
  
  /**
   * API key
   */
  apiKey?: string;
  
  /**
   * Tenant ID
   */
  tenantId: string;
}

/**
 * Interface for client options
 */
export interface ClientOptions {
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
  
  /**
   * Whether to use the cache
   */
  useCache?: boolean;
  
  /**
   * Custom fetch implementation
   */
  fetch?: typeof fetch;
}
