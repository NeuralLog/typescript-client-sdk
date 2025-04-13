import { AxiosInstance } from 'axios';
import axios from 'axios';
import { LogError } from '../errors';
import { ApiKeyInfo, ApiKeyPermission, CreateApiKeyRequest, LoginResponse } from '../types';

/**
 * Service for interacting with the NeuralLog auth service
 */
export class AuthService {
  private baseUrl: string;
  private apiClient: AxiosInstance;

  /**
   * Create a new AuthService
   *
   * @param baseUrl Base URL of the auth service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    this.baseUrl = baseUrl;
    this.apiClient = apiClient;
  }

  /**
   * Login with username and password
   *
   * @param username Username
   * @param password Password
   * @returns Promise that resolves to the login response
   */
  public async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/login`,
        { username, password }
      );

      return {
        success: true,
        token: response.data.token,
        userId: response.data.user_id,
        tenantId: response.data.tenant_id
      };
    } catch (error) {
      throw new LogError(
        `Failed to login: ${error instanceof Error ? error.message : String(error)}`,
        'login_failed'
      );
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
      await this.apiClient.post(
        `${this.baseUrl}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to logout: ${error instanceof Error ? error.message : String(error)}`,
        'logout_failed'
      );
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
      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/change-password`,
        {
          old_password: oldPassword,
          new_password: newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.success === true;
    } catch (error) {
      throw new LogError(
        `Failed to change password: ${error instanceof Error ? error.message : String(error)}`,
        'change_password_failed'
      );
    }
  }

  /**
   * Validate an API key
   *
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @param proof Zero-knowledge proof for the API key
   * @returns Promise that resolves to true if the API key is valid
   */
  public async validateApiKey(apiKey: string, tenantId: string, proof?: string): Promise<boolean> {
    try {
      const requestBody: any = { api_key: apiKey };

      if (proof) {
        requestBody.proof = proof;
      }

      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/validate-api-key`,
        requestBody,
        {
          params: { tenant_id: tenantId }
        }
      );

      return response.data.valid === true;
    } catch (error) {
      throw new LogError(
        `Failed to validate API key: ${error instanceof Error ? error.message : String(error)}`,
        'validate_api_key_failed'
      );
    }
  }

  /**
   * Get a resource token
   *
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @param resource Resource path
   * @returns Promise that resolves to the resource token
   */
  public async getResourceToken(
    apiKey: string,
    tenantId: string,
    resource: string
  ): Promise<string> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/auth/resource-token`,
        {
          params: {
            tenant_id: tenantId,
            resource
          },
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
   * Create an API key
   *
   * @param request API key creation request
   * @param authToken Authentication token
   * @returns Promise that resolves to the API key ID
   */
  public async createApiKey(
    request: CreateApiKeyRequest,
    authToken: string
  ): Promise<string> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/api-keys`,
        request,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.key_id;
    } catch (error) {
      throw new LogError(
        `Failed to create API key: ${error instanceof Error ? error.message : String(error)}`,
        'create_api_key_failed'
      );
    }
  }

  /**
   * List API keys
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the API keys
   */
  public async listApiKeys(authToken: string): Promise<ApiKeyInfo[]> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/auth/api-keys`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.api_keys || [];
    } catch (error) {
      throw new LogError(
        `Failed to list API keys: ${error instanceof Error ? error.message : String(error)}`,
        'list_api_keys_failed'
      );
    }
  }

  /**
   * Revoke an API key
   *
   * @param keyId API key ID
   * @param authToken Authentication token
   * @returns Promise that resolves when the API key is revoked
   */
  public async revokeApiKey(keyId: string, authToken: string): Promise<void> {
    try {
      await this.apiClient.delete(
        `${this.baseUrl}/auth/api-keys/${keyId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`,
        'revoke_api_key_failed'
      );
    }
  }
}
