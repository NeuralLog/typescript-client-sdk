import { Login, ApiKeyChallenge, ApiKeyChallengeVerification, UserProfile } from '../../generated/auth-service';
import { AuthClientBase } from './AuthClientBase';
import { LogError } from '../../errors';

/**
 * Service for authentication operations using the OpenAPI client
 */
export class AuthenticationService extends AuthClientBase {
  /**
   * Login with username and password
   *
   * @param username Username
   * @param password Password
   * @returns Promise that resolves to the login response
   */
  public async login(username: string, password: string): Promise<Login> {
    try {
      const response = await this.authApi.authLoginPost({
        authLoginPostRequest: {
          email: username,
          password: password
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout
   *
   * @param authToken Authentication token
   * @returns Promise that resolves when the user is logged out
   */
  public async logout(authToken: string): Promise<void> {
    try {
      await this.authApi.authLogoutPost({
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   *
   * @param oldPassword Old password
   * @param newPassword New password
   * @param authToken Authentication token
   * @returns Promise that resolves to true if the password was changed successfully
   */
  public async changePassword(
    oldPassword: string,
    newPassword: string,
    authToken: string
  ): Promise<boolean> {
    try {
      // Note: This endpoint is not in the OpenAPI spec yet
      throw new LogError(
        'Change password is not implemented in the OpenAPI client yet',
        'not_implemented'
      );
    } catch (error) {
      throw new LogError(
        `Failed to change password: ${error instanceof Error ? error.message : String(error)}`,
        'change_password_failed'
      );
    }
  }

  /**
   * Get a resource token
   *
   * @param apiKey API key
   * @param resource Resource path
   * @returns Promise that resolves to the resource token
   */
  public async getResourceToken(
    apiKey: string,
    resource: string
  ): Promise<string> {
    try {
      const response = await this.authApi.authExchangeTokenPost(
        {
          authExchangeTokenPostRequest: {
            resource,
            tenantId: '' // Tenant ID is not needed in the wire protocol
          }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      );

      return response.data.token;
    } catch (error) {
      throw new LogError(
        `Failed to get resource token: ${error instanceof Error ? error.message : String(error)}`,
        'get_resource_token_failed'
      );
    }
  }

  /**
   * Get a challenge for API key authentication
   *
   * @returns Promise that resolves to the challenge
   */
  public async getApiKeyChallenge(): Promise<ApiKeyChallenge> {
    try {
      const response = await this.apiKeysApi.apiKeysChallengePost({
        apiKeysChallengePostRequest: {
          apiKey: '' // This will be filled in by the client
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify a challenge response for API key authentication
   *
   * @param challenge Challenge
   * @param response Challenge response
   * @returns Promise that resolves to the verification result
   */
  public async verifyApiKeyChallenge(challenge: string, response: string): Promise<ApiKeyChallengeVerification> {
    try {
      const apiResponse = await this.apiKeysApi.apiKeysVerifyChallengePost({
        apiKeysVerifyChallengePostRequest: {
          apiKey: '', // This will be filled in by the client
          challenge,
          response
        }
      });

      return apiResponse.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user profile
   *
   * @param userId User ID
   * @returns Promise that resolves to the user profile
   */
  public async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Note: This endpoint is not in the OpenAPI spec yet
      throw new LogError(
        'Get user profile is not implemented in the OpenAPI client yet',
        'not_implemented'
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check permission
   *
   * @param authToken Authentication token
   * @param action Action to check
   * @param resource Resource to check
   * @returns Promise that resolves to true if the user has permission, false otherwise
   */
  public async checkPermission(authToken: string, action: string, resource: string): Promise<boolean> {
    try {
      // Note: This endpoint is not in the OpenAPI spec yet
      throw new LogError(
        'Check permission is not implemented in the OpenAPI client yet',
        'not_implemented'
      );
    } catch (error) {
      throw error;
    }
  }
}
