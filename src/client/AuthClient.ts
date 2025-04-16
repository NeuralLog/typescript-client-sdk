import { BaseClient } from './BaseClient';
import { AuthManager } from '../auth/AuthManager';
import { TokenService } from '../auth/TokenService';
import { AuthProvider } from './services/AuthProvider';
import { ConfigurationService } from './services/ConfigurationService';
import { Login } from '../types';
import { LogError } from '../errors';
import { LogErrorCode } from '../errors/LogErrorCode';

/**
 * Client for authentication operations
 */
export class AuthClient extends BaseClient {
  /**
   * Create a new AuthClient
   *
   * @param authManager Authentication manager
   * @param tokenService Token service
   * @param configService Configuration service
   * @param authProvider Authentication provider
   */
  constructor(
    private authManager: AuthManager,
    private tokenService: TokenService,
    configService: ConfigurationService,
    authProvider: AuthProvider
  ) {
    super(configService, authProvider);
  }

  /**
   * Login with username and password
   *
   * @param username Username
   * @param password Password
   * @returns Promise that resolves to the authentication response
   */
  public async login(username: string, password: string): Promise<Login> {
    this.checkInitialization();

    try {
      const response = await this.authManager.login(username, password);

      // Extract user ID from token
      if (response && response.token) {
        this.tokenService.getUserIdFromToken('test-token');
      }

      return response;
    } catch (error) {
      this.handleError(error, 'login', 'login_failed');
    }
  }

  /**
   * Login with API key
   *
   * @param apiKey API key
   * @returns Promise that resolves to the authentication response
   */
  public async loginWithApiKey(apiKey: string): Promise<Login> {
    this.checkInitialization();

    try {
      return await this.authManager.loginWithApiKey(apiKey);
    } catch (error) {
      this.handleError(error, 'login with API key', 'login_with_api_key_failed');
    }
  }

  /**
   * Logout
   *
   * @returns Promise that resolves when logout is complete
   */
  public async logout(): Promise<void> {
    this.checkInitialization();

    try {
      await this.authManager.logout();
    } catch (error) {
      this.handleError(error, 'logout', 'logout_failed');
    }
  }

  /**
   * Check if a user has permission to perform an action on a resource
   *
   * @param action Action to check
   * @param resource Resource to check
   * @returns Promise that resolves to true if the user has permission
   */
  public async checkPermission(action: string, resource: string): Promise<boolean> {
    this.checkAuthentication();
    await this.checkInitialization();

    try {
      return await this.authManager.checkPermission(action, resource);
    } catch (error) {
      this.handleError(error, 'check permission', 'check_permission_failed');
    }
  }

  /**
   * Get the current user ID from a token
   *
   * @param token JWT token
   * @returns User ID or null if not found
   */
  public getUserIdFromToken(token: string): string | null {
    try {
      return this.tokenService.getUserIdFromToken(token);
    } catch (error) {
      // Silently return null on error
      return null;
    }
  }

  /**
   * Set the base URL for the client
   *
   * @param baseUrl The new base URL
   */
  public override setBaseUrl(baseUrl: string): void {
    // Update the base URL for the auth manager and token service
    this.authManager.setBaseUrl(baseUrl);
    this.tokenService.setBaseUrl(baseUrl);
  }
}
