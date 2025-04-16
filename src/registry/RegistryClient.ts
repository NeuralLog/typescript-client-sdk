import { RegistryApi, EndpointResponse } from './openapi';
import { LogError } from '../errors';

/**
 * Client for interacting with the NeuralLog registry service
 */
export class RegistryClient {
  private registryApi: RegistryApi;
  private tenantId: string;
  private cachedEndpoints: EndpointResponse | null = null;
  private lastFetchTime: number = 0;
  private cacheTtlMs: number = 5 * 60 * 1000; // 5 minutes

  // Environment variable fallbacks
  private envAuthUrl: string | null;
  private envServerUrl: string | null;
  private envWebUrl: string | null;

  /**
   * Create a new RegistryClient
   *
   * @param registryUrl Registry URL
   * @param tenantId Tenant ID
   * @param envAuthUrl Auth URL from environment (optional)
   * @param envServerUrl Server URL from environment (optional)
   * @param envWebUrl Web URL from environment (optional)
   */
  constructor(
    registryUrl: string,
    tenantId: string,
    envAuthUrl?: string,
    envServerUrl?: string,
    envWebUrl?: string
  ) {
    this.registryApi = new RegistryApi({
      BASE: registryUrl,
      VERSION: '1.0.0'
    });
    this.tenantId = tenantId;
    this.envAuthUrl = envAuthUrl || null;
    this.envServerUrl = envServerUrl || null;
    this.envWebUrl = envWebUrl || null;
  }

  /**
   * Check if the cache is valid
   *
   * @returns True if the cache is valid, false otherwise
   */
  private isCacheValid(): boolean {
    if (!this.cachedEndpoints) {
      return false;
    }

    const now = Date.now();
    return now - this.lastFetchTime < this.cacheTtlMs;
  }

  /**
   * Get endpoints from the registry
   *
   * @param forceRefresh Force a refresh of the cache
   * @returns Promise that resolves to the endpoints
   */
  public async getEndpoints(forceRefresh: boolean = false): Promise<EndpointResponse> {
    // If cache is valid and we're not forcing a refresh, return cached endpoints
    if (this.isCacheValid() && !forceRefresh) {
      return this.cachedEndpoints!;
    }

    try {
      // Fetch endpoints from registry
      const response = await this.registryApi.endpoints.getEndpoints(this.tenantId);

      // Cache the endpoints
      this.cachedEndpoints = response;
      this.lastFetchTime = Date.now();

      return response;
    } catch (error) {
      console.warn(`Failed to fetch endpoints from registry: ${error instanceof Error ? error.message : String(error)}`);
      console.warn('Falling back to environment variables');

      // Fall back to environment variables
      return this.getEndpointsFromEnv();
    }
  }

  /**
   * Get endpoints from environment variables
   *
   * @returns Endpoints from environment variables
   */
  private getEndpointsFromEnv(): EndpointResponse {
    // Check if environment variables are available
    if (!this.envAuthUrl && !this.envServerUrl && !this.envWebUrl) {
      throw new LogError(
        'Failed to get endpoints from registry and no environment variables are available',
        'discovery_failed'
      );
    }

    // Construct endpoints from environment variables
    return {
      tenantId: this.tenantId,
      authUrl: this.envAuthUrl || `https://auth.${this.tenantId}.neurallog.app`,
      serverUrl: this.envServerUrl || `https://api.${this.tenantId}.neurallog.app`,
      webUrl: this.envWebUrl || `https://${this.tenantId}.neurallog.app`,
      apiVersion: 'v1'
    };
  }

  /**
   * Get the auth URL
   *
   * @returns Promise that resolves to the auth URL
   */
  public async getAuthUrl(): Promise<string> {
    const endpoints = await this.getEndpoints();
    return endpoints.authUrl;
  }

  /**
   * Get the server URL
   *
   * @returns Promise that resolves to the server URL
   */
  public async getServerUrl(): Promise<string> {
    const endpoints = await this.getEndpoints();
    return endpoints.serverUrl;
  }

  /**
   * Get the web URL
   *
   * @returns Promise that resolves to the web URL
   */
  public async getWebUrl(): Promise<string> {
    const endpoints = await this.getEndpoints();
    return endpoints.webUrl;
  }

  /**
   * Get the API version
   *
   * @returns Promise that resolves to the API version
   */
  public async getApiVersion(): Promise<string> {
    const endpoints = await this.getEndpoints();
    return endpoints.apiVersion;
  }
}
