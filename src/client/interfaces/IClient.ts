/**
 * Core interface that all specialized clients will implement
 */
export interface IClient {
  /**
   * Initialize the client
   * 
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;
  
  /**
   * Check if the client is initialized
   * 
   * @returns True if the client is initialized
   */
  isInitialized(): boolean;
  
  /**
   * Get the authentication token
   * 
   * @returns Authentication token or null if not authenticated
   */
  getAuthToken(): string | null;
}
