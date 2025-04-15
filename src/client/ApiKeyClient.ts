import { BaseClient } from './BaseClient';
import { AuthManager } from '../auth/AuthManager';
import { AuthProvider } from './services/AuthProvider';
import { ConfigurationService } from './services/ConfigurationService';
import { ApiKey } from '../types/api';

/**
 * Client for API key operations
 */
export class ApiKeyClient extends BaseClient {
  /**
   * Create a new ApiKeyClient
   *
   * @param authManager Authentication manager
   * @param configService Configuration service
   * @param authProvider Authentication provider
   */
  constructor(
    private authManager: AuthManager,
    configService: ConfigurationService,
    authProvider: AuthProvider
  ) {
    super(configService, authProvider);
  }

  /**
   * Create a new API key
   *
   * @param name API key name
   * @param expiresIn Expiration time in seconds
   * @returns Promise that resolves to the API key
   */
  public async createApiKey(name: string, expiresIn?: number): Promise<ApiKey> {
    this.authProvider.checkAuthentication();
    this.checkInitialization();

    try {
      return await this.authManager.createApiKey(name, expiresIn);
    } catch (error) {
      this.handleError(error, 'create API key', 'create_api_key_failed');
    }
  }

  /**
   * Get API keys
   *
   * @returns Promise that resolves to the API keys
   */
  public async getApiKeys(): Promise<ApiKey[]> {
    this.authProvider.checkAuthentication();
    this.checkInitialization();

    try {
      return await this.authManager.getApiKeys();
    } catch (error) {
      this.handleError(error, 'get API keys', 'get_api_keys_failed');
    }
  }

  /**
   * Revoke an API key
   *
   * @param apiKeyId API key ID
   * @returns Promise that resolves when the API key is revoked
   */
  public async revokeApiKey(apiKeyId: string): Promise<void> {
    this.authProvider.checkAuthentication();
    this.checkInitialization();

    try {
      await this.authManager.revokeApiKey(apiKeyId);
    } catch (error) {
      this.handleError(error, 'revoke API key', 'revoke_api_key_failed');
    }
  }
}
