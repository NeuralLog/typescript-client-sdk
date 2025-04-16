import { ApiKey, CreateApiKeyRequest } from '../../generated/auth-service';
import { AuthClientBase } from './AuthClientBase';

/**
 * Service for API key operations using the OpenAPI client
 */
export class ApiKeyService extends AuthClientBase {
  /**
   * Create an API key
   *
   * @param authToken Authentication token
   * @param name API key name
   * @param permissions API key permissions
   * @param expiresIn Expiration time in days (optional)
   * @returns Promise that resolves to the created API key
   */
  public async createApiKey(
    authToken: string,
    name: string,
    permissions: string | string[],
    expiresIn?: number
  ): Promise<ApiKey> {
    try {
      // Create the request
      const request: CreateApiKeyRequest = {
        name,
        expires_in: expiresIn
      };

      const response = await this.apiKeysApi.apiKeysPost(
        {
          createApiKeyRequest: request
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      // Return the API key response
      return {
        id: response.data.id,
        userId: '', // These fields will be filled in by the server
        tenantId: '',
        name,
        scopes: [],
        verificationHash: '',
        createdAt: new Date().toISOString(),
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString() : '',
        revoked: false
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get API keys
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the API keys
   */
  public async getApiKeys(authToken: string): Promise<ApiKey[]> {
    try {
      const response = await this.apiKeysApi.apiKeysGet({
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      return response.data.api_keys || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoke an API key
   *
   * @param authToken Authentication token
   * @param keyId API key ID
   * @returns Promise that resolves when the API key is revoked
   */
  public async revokeApiKey(authToken: string, keyId: string): Promise<void> {
    try {
      await this.apiKeysApi.apiKeysIdDelete(
        {
          id: keyId
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw error;
    }
  }
}
