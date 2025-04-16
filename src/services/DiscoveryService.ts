import { LogError } from '../errors';
import { RegistryClient } from '../registry/RegistryClient';
import { EndpointResponse } from '../registry/openapi';

// Re-export the EndpointResponse type from the OpenAPI client
export { EndpointResponse } from '../registry/openapi';

/**
 * Service for discovering NeuralLog service endpoints
 */
export class DiscoveryService {
  private tenantId: string;
  private registryUrl: string | null;
  private registryClient: RegistryClient | null = null;

  // Environment variable fallbacks
  private envAuthUrl: string | null;
  private envServerUrl: string | null;
  private envWebUrl: string | null;

  /**
   * Create a new DiscoveryService
   *
   * @param tenantId Tenant ID
   * @param registryUrl Registry URL (optional)
   * @param envAuthUrl Auth URL from environment (optional)
   * @param envServerUrl Server URL from environment (optional)
   * @param envWebUrl Web URL from environment (optional)
   */
  constructor(
    tenantId: string,
    registryUrl?: string,
    envAuthUrl?: string,
    envServerUrl?: string,
    envWebUrl?: string
  ) {
    this.tenantId = tenantId;
    this.registryUrl = registryUrl || null;
    this.envAuthUrl = envAuthUrl || null;
    this.envServerUrl = envServerUrl || null;
    this.envWebUrl = envWebUrl || null;

    // If registry URL is not provided, construct it from tenant ID
    if (!this.registryUrl && tenantId) {
      this.registryUrl = `https://registry.${tenantId}.neurallog.app`;
    }

    // Create registry client if registry URL is available
    if (this.registryUrl) {
      this.registryClient = new RegistryClient(
        this.registryUrl,
        this.tenantId,
        this.envAuthUrl || undefined,
        this.envServerUrl || undefined,
        this.envWebUrl || undefined
      );
    }
  }

  /**
   * Get the registry URL
   *
   * @returns The registry URL
   */
  public getRegistryUrl(): string | null {
    return this.registryUrl;
  }

  /**
   * Set the registry URL
   *
   * @param url The registry URL
   */
  public setRegistryUrl(url: string): void {
    this.registryUrl = url;

    // Create or update registry client
    this.registryClient = new RegistryClient(
      this.registryUrl,
      this.tenantId,
      this.envAuthUrl || undefined,
      this.envServerUrl || undefined,
      this.envWebUrl || undefined
    );
  }

  /**
   * Get the tenant ID
   *
   * @returns The tenant ID
   */
  public getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Set the tenant ID
   *
   * @param tenantId The tenant ID
   */
  public setTenantId(tenantId: string): void {
    this.tenantId = tenantId;

    // Update registry URL if it was constructed from tenant ID
    if (this.registryUrl && this.registryUrl.includes('.neurallog.app')) {
      this.registryUrl = `https://registry.${tenantId}.neurallog.app`;

      // Update registry client
      if (this.registryClient) {
        this.registryClient = new RegistryClient(
          this.registryUrl,
          this.tenantId,
          this.envAuthUrl || undefined,
          this.envServerUrl || undefined,
          this.envWebUrl || undefined
        );
      }
    }
  }

  /**
   * Get endpoints from the registry
   *
   * @param forceRefresh Force a refresh of the cache
   * @returns Promise that resolves to the endpoints
   */
  public async getEndpoints(forceRefresh: boolean = false): Promise<EndpointResponse> {
    try {
      // If registry client is available, use it
      if (this.registryClient) {
        return await this.registryClient.getEndpoints(forceRefresh);
      }

      // Fall back to environment variables
      return this.getEndpointsFromEnv();
    } catch (error) {
      console.warn(`Failed to fetch endpoints: ${error instanceof Error ? error.message : String(error)}`);
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
      authUrl: this.envAuthUrl || 'http://localhost:3040',
      serverUrl: this.envServerUrl || 'http://localhost:3030',
      webUrl: this.envWebUrl || 'http://localhost:3000',
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
