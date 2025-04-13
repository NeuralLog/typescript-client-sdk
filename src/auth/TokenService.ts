import { AxiosInstance } from 'axios';
import { LogError } from '../errors';

/**
 * Service for managing resource tokens
 */
export class TokenService {
  private baseUrl: string;
  private apiClient: AxiosInstance;

  /**
   * Create a new TokenService
   *
   * @param baseUrl Base URL of the auth service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    this.baseUrl = baseUrl;
    this.apiClient = apiClient;
  }

  /**
   * Get the base URL
   *
   * @returns The base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set the base URL
   *
   * @param baseUrl The new base URL
   */
  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Get a resource token
   *
   * @param resource Resource path
   * @param authToken Authentication token
   * @returns Promise that resolves to the resource token
   */
  public async getResourceToken(resource: string, authToken: string): Promise<string> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/token`,
        { resource },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
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
   * Get a resource token with an API key
   *
   * @param resource Resource path
   * @param apiKey API key
   * @param proof Zero-knowledge proof for the API key
   * @returns Promise that resolves to the resource token
   */
  public async getResourceTokenWithApiKey(
    resource: string,
    apiKey: string,
    proof: string
  ): Promise<string> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/token/api-key`,
        {
          resource,
          proof
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
        `Failed to get resource token with API key: ${error instanceof Error ? error.message : String(error)}`,
        'get_resource_token_failed'
      );
    }
  }

  /**
   * Verify a resource token
   *
   * @param token Resource token
   * @returns Promise that resolves to true if the token is valid
   */
  public async verifyResourceToken(token: string): Promise<boolean> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/token/verify`,
        { token }
      );

      return response.data.valid === true;
    } catch (error) {
      throw new LogError(
        `Failed to verify resource token: ${error instanceof Error ? error.message : String(error)}`,
        'verify_resource_token_failed'
      );
    }
  }
}
