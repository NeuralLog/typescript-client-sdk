import { Configuration, AuthApi, APIKeysApi } from '../../generated/auth-service';
import { AxiosInstance } from 'axios';

/**
 * Base client for the OpenAPI auth service
 */
export class AuthClientBase {
  protected authApi: AuthApi;
  protected apiKeysApi: APIKeysApi;
  protected baseUrl: string;

  /**
   * Create a new AuthClientBase
   *
   * @param baseUrl Base URL of the auth service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    this.baseUrl = baseUrl;

    // Create configuration for the OpenAPI client
    const configuration = new Configuration({
      basePath: baseUrl,
      accessToken: this.getAccessToken.bind(this),
      baseOptions: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    // Create API instances
    this.authApi = new AuthApi(configuration, baseUrl, apiClient);
    this.apiKeysApi = new APIKeysApi(configuration, baseUrl, apiClient);
  }

  /**
   * Get the access token for the request
   * This is used by the OpenAPI client to set the Authorization header
   *
   * @param name Optional name of the security scheme
   * @param scopes Optional scopes for the token
   * @returns The access token
   */
  protected getAccessToken(_name?: string, _scopes?: string[]): string {
    // This will be overridden by the actual token in the request options
    return '';
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
}
