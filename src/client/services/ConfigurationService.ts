import { NeuralLogClientOptions } from '../types';

/**
 * Default client options
 */
export const DEFAULT_OPTIONS: Partial<NeuralLogClientOptions> = {
  serverUrl: '',
  authUrl: '',
  tenantId: 'default',
  registryUrl: '',
  apiKey: undefined
};

/**
 * Service that provides configuration-related functionality
 */
export class ConfigurationService {
  private config: Required<NeuralLogClientOptions>;

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
   * @returns Server URL or undefined if not provided
   */
  getServerUrl(): string | undefined {
    return this.config.serverUrl === '' ? undefined : this.config.serverUrl;
  }

  /**
   * Get the authentication URL
   *
   * @returns Authentication URL or undefined if not provided
   */
  getAuthUrl(): string | undefined {
    return this.config.authUrl === '' ? undefined : this.config.authUrl;
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
