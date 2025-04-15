import { IClient } from './interfaces/IClient';
import { AuthProvider } from './services/AuthProvider';
import { ConfigurationService } from './services/ConfigurationService';
import { LogError } from '../errors';
import { LogErrorCode } from '../errors/LogErrorCode';

/**
 * Base client class that implements the IClient interface
 */
export abstract class BaseClient implements IClient {
  protected initialized: boolean = false;

  /**
   * Create a new BaseClient
   *
   * @param configService Configuration service
   * @param authProvider Authentication provider
   */
  constructor(
    protected configService: ConfigurationService,
    protected authProvider: AuthProvider
  ) {}

  /**
   * Initialize the client
   *
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    this.initialized = true;
  }

  /**
   * Check if the client is initialized
   *
   * @returns True if the client is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the authentication token
   *
   * @returns Authentication token or null if not authenticated
   */
  public getAuthToken(): string | null {
    return this.authProvider.getAuthToken();
  }

  /**
   * Check if the client is authenticated
   *
   * @returns True if authenticated
   */
  public isAuthenticated(): boolean {
    return this.authProvider.isAuthenticated();
  }

  /**
   * Check if the client is authenticated and throw an error if not
   *
   * @throws LogError if not authenticated
   */
  protected checkAuthentication(): void {
    if (!this.isAuthenticated()) {
      throw new LogError('Not authenticated', 'not_authenticated');
    }
  }

  /**
   * Check if the client is initialized and initialize it if not
   *
   * @returns Promise that resolves when the client is initialized
   */
  protected async checkInitialization(): Promise<void> {
    if (!this.isInitialized()) {
      await this.initialize();
    }
  }

  /**
   * Helper method to handle errors consistently
   *
   * @param error The error to handle
   * @param operation The operation that failed
   * @param errorCode The error code to use
   * @throws LogError with a consistent format
   */
  protected handleError(error: unknown, operation: string, errorCode: LogErrorCode): never {
    throw new LogError(
      `Failed to ${operation}: ${error instanceof Error ? error.message : String(error)}`,
      errorCode
    );
  }
}
