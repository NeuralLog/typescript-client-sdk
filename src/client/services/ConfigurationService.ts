import { NeuralLogClientOptions } from '../types';
import { DiscoveryService } from '../../services/DiscoveryService';

/**
 * Default client options
 */
export const DEFAULT_OPTIONS: Partial<NeuralLogClientOptions> = {
  serverUrl: '',
  authUrl: '',
  tenantId: 'default',
  registryUrl: '',
  webUrl: '',
  apiKey: undefined,
  skipRegistryLookup: false,
  registryUrlOverride: undefined
};

/**
 * Service that provides configuration-related functionality
 */
export class ConfigurationService {
  private config: Required<NeuralLogClientOptions>;
  private discoveryService: DiscoveryService | null = null;

  /**
   * Create a new ConfigurationService
   *
   * @param options Client options
   */
  constructor(options: NeuralLogClientOptions) {
    this.config = {
      ...DEFAULT_OPTIONS,
      ...options
    } as Required<NeuralLogClientOptions>;

    // Create discovery service if registry lookup is not skipped
    if (!this.config.skipRegistryLookup) {
      // Use registry URL override if provided, otherwise construct from tenant ID
      const registryUrl = this.config.registryUrlOverride ||
        (this.config.registryUrl || `https://registry.${this.config.tenantId}.neurallog.app`);

      this.discoveryService = new DiscoveryService(
        this.config.tenantId,
        registryUrl,
        this.config.authUrl || undefined,
        this.config.serverUrl || undefined,
        this.config.webUrl || undefined
      );
    }
  }

  /**
   * Get the full configuration
   *
   * @returns Client configuration
   */
  getConfig(): Required<NeuralLogClientOptions> {
    return this.config;
  }

  /**
   * Get the server URL
   *
   * @returns Promise that resolves to the server URL
   */
  async getServerUrl(): Promise<string> {
    // If discovery service is available, get URL from registry
    if (this.discoveryService) {
      try {
        return await this.discoveryService.getServerUrl();
      } catch (error) {
        // Fall back to configured URL
        console.warn('Failed to get server URL from registry, falling back to configured URL');
      }
    }

    // Return configured URL or default
    return this.config.serverUrl || 'http://localhost:3030';
  }

  /**
   * Get the server URL synchronously
   * This should only be used during initialization
   *
   * @returns Server URL or undefined if not provided
   */
  getServerUrlSync(): string | undefined {
    return this.config.serverUrl === '' ? undefined : this.config.serverUrl;
  }

  /**
   * Get the authentication URL
   *
   * @returns Promise that resolves to the authentication URL
   */
  async getAuthUrl(): Promise<string> {
    // If discovery service is available, get URL from registry
    if (this.discoveryService) {
      try {
        return await this.discoveryService.getAuthUrl();
      } catch (error) {
        // Fall back to configured URL
        console.warn('Failed to get auth URL from registry, falling back to configured URL');
      }
    }

    // Return configured URL or default
    return this.config.authUrl || 'http://localhost:3040';
  }

  /**
   * Get the authentication URL synchronously
   * This should only be used during initialization
   *
   * @returns Authentication URL or undefined if not provided
   */
  getAuthUrlSync(): string | undefined {
    return this.config.authUrl === '' ? undefined : this.config.authUrl;
  }

  /**
   * Get the web URL
   *
   * @returns Promise that resolves to the web URL
   */
  async getWebUrl(): Promise<string> {
    // If discovery service is available, get URL from registry
    if (this.discoveryService) {
      try {
        return await this.discoveryService.getWebUrl();
      } catch (error) {
        // Fall back to configured URL
        console.warn('Failed to get web URL from registry, falling back to configured URL');
      }
    }

    // Return configured URL or default
    return this.config.webUrl || 'http://localhost:3000';
  }

  /**
   * Get the web URL synchronously
   * This should only be used during initialization
   *
   * @returns Web URL or undefined if not provided
   */
  getWebUrlSync(): string | undefined {
    return this.config.webUrl === '' ? undefined : this.config.webUrl;
  }

  /**
   * Get the registry URL
   *
   * @returns Registry URL or undefined if not provided
   */
  getRegistryUrl(): string | undefined {
    return this.config.registryUrl === '' ? undefined : this.config.registryUrl;
  }

  /**
   * Get the tenant ID
   *
   * @returns Tenant ID
   */
  getTenantId(): string {
    return this.config.tenantId;
  }

  /**
   * Get the API key
   *
   * @returns API key or undefined if not provided
   */
  getApiKey(): string | undefined {
    return this.config.apiKey;
  }
}
