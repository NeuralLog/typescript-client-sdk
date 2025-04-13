import { AxiosInstance } from 'axios';
import axios from 'axios';
import { LogError } from '../errors';

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
   * Validate an API key
   * 
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @returns Promise that resolves to true if the API key is valid
   */
  public async validateApiKey(apiKey: string, tenantId: string): Promise<boolean> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/validate-api-key`,
        { api_key: apiKey },
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
   * @param masterSecret Master secret
   * @param tenantId Tenant ID
   * @param name API key name
   * @param permissions API key permissions
   * @returns Promise that resolves to the API key
   */
  public async createApiKey(
    masterSecret: string,
    tenantId: string,
    name: string,
    permissions: string[]
  ): Promise<string> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/api-keys`,
        {
          name,
          permissions
        },
        {
          params: { tenant_id: tenantId },
          headers: {
            Authorization: `Bearer ${masterSecret}`
          }
        }
      );
      
      return response.data.api_key;
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
   * @param masterSecret Master secret
   * @param tenantId Tenant ID
   * @returns Promise that resolves to the API keys
   */
  public async listApiKeys(
    masterSecret: string,
    tenantId: string
  ): Promise<Array<{ id: string; name: string; permissions: string[] }>> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/auth/api-keys`,
        {
          params: { tenant_id: tenantId },
          headers: {
            Authorization: `Bearer ${masterSecret}`
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
   * @param masterSecret Master secret
   * @param tenantId Tenant ID
   * @param apiKeyId API key ID
   * @returns Promise that resolves when the API key is revoked
   */
  public async revokeApiKey(
    masterSecret: string,
    tenantId: string,
    apiKeyId: string
  ): Promise<void> {
    try {
      await this.apiClient.delete(
        `${this.baseUrl}/auth/api-keys/${apiKeyId}`,
        {
          params: { tenant_id: tenantId },
          headers: {
            Authorization: `Bearer ${masterSecret}`
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
