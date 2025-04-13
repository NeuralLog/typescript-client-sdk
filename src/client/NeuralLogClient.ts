import axios, { AxiosInstance } from 'axios';
import { LogsService } from '../logs/LogsService';
import { AuthService } from '../auth/AuthService';
import { CryptoService } from '../crypto/CryptoService';
import { KeyHierarchy } from '../crypto/KeyHierarchy';
import { KekService } from '../auth/KekService';
import { TokenService } from '../auth/TokenService';
import { LogError } from '../errors';
import { EncryptedKEK, ApiKeyPermission, ApiKeyInfo } from '../types';

/**
 * Tenant endpoints returned by the registry
 */
export interface TenantEndpoints {
  tenantId: string;
  authUrl: string;
  serverUrl: string;
  webUrl: string;
  apiVersion: string;
}

/**
 * NeuralLog client configuration
 */
export interface NeuralLogClientConfig {
  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * Registry URL (optional - will be constructed from tenantId if not provided)
   */
  registryUrl?: string;

  /**
   * API URL (optional - will be fetched from registry if not provided)
   */
  apiUrl?: string;

  /**
   * Auth service URL (optional - will be fetched from registry if not provided)
   */
  authUrl?: string;

  /**
   * Logs service URL (optional - will be fetched from registry if not provided)
   */
  logsUrl?: string;
}

/**
 * NeuralLog client
 *
 * This is the main entry point for interacting with the NeuralLog system.
 * It provides methods for logging, searching, and retrieving logs with
 * zero-knowledge encryption.
 */
export class NeuralLogClient {
  private tenantId: string;
  private registryUrl?: string;
  private webUrl?: string;
  private apiClient: AxiosInstance;
  private authService: AuthService;
  private logsService: LogsService;
  private cryptoService: CryptoService;
  private keyHierarchy: KeyHierarchy;
  private kekService: KekService;
  private tokenService: TokenService;

  private apiKey: string | null = null;
  private masterSecret: string | null = null;
  private userId: string | null = null;
  private authenticated: boolean = false;
  private authToken: string | null = null;
  private endpointsInitialized: boolean = false;

  /**
   * Create a new NeuralLogClient
   *
   * @param config Client configuration
   */
  constructor(config: NeuralLogClientConfig) {
    if (!config.tenantId) {
      throw new Error('Tenant ID is required');
    }

    this.tenantId = config.tenantId;
    this.registryUrl = config.registryUrl;

    // Create API client
    this.apiClient = axios.create({
      baseURL: config.apiUrl || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Create services with default URLs that will be updated during initialization
    const authUrl = config.authUrl || 'http://localhost:3000';
    const logsUrl = config.logsUrl || 'http://localhost:3030';

    this.authService = new AuthService(
      authUrl,
      this.apiClient
    );

    this.logsService = new LogsService(
      logsUrl,
      this.apiClient
    );

    this.kekService = new KekService(
      authUrl,
      this.apiClient
    );

    this.tokenService = new TokenService(
      authUrl,
      this.apiClient
    );

    // Create crypto service and key hierarchy
    this.cryptoService = new CryptoService();
    this.keyHierarchy = new KeyHierarchy();
  }

  /**
   * Initialize the client by fetching endpoints from the registry if needed
   */
  public async initialize(): Promise<void> {
    if (this.endpointsInitialized) {
      return;
    }

    // If all URLs are already provided and registryUrl is not set, skip registry lookup
    if (!this.registryUrl && this.authService.getBaseUrl() && this.logsService.getBaseUrl()) {
      console.debug('Using provided endpoints');
      this.endpointsInitialized = true;
      return;
    }

    try {
      // If no registry URL is provided, construct a default one
      if (!this.registryUrl) {
        this.registryUrl = `https://registry.${this.tenantId}.neurallog.app`;
        console.debug(`Using default registry URL: ${this.registryUrl}`);
      }

      // Fetch tenant endpoints from registry
      console.debug(`Fetching endpoints from registry: ${this.registryUrl}`);
      const response = await axios.get<TenantEndpoints>(`${this.registryUrl}/endpoints`);

      if (response.status !== 200) {
        throw new Error(`Failed to fetch tenant endpoints: ${response.statusText}`);
      }

      const endpoints = response.data;

      // Update services with endpoints
      this.authService.setBaseUrl(endpoints.authUrl);
      this.logsService.setBaseUrl(endpoints.serverUrl);
      this.kekService.setBaseUrl(endpoints.authUrl);
      this.tokenService.setBaseUrl(endpoints.authUrl);
      this.webUrl = endpoints.webUrl;

      console.debug('Endpoints initialized', {
        authUrl: endpoints.authUrl,
        serverUrl: endpoints.serverUrl,
        webUrl: endpoints.webUrl,
        apiVersion: endpoints.apiVersion
      });

      this.endpointsInitialized = true;
    } catch (error) {
      console.error('Failed to initialize client', error);
      throw new LogError(
        `Failed to initialize client: ${error instanceof Error ? error.message : String(error)}`,
        'initialization_failed'
      );
    }
  }

  /**
   * Get the auth service URL
   *
   * @returns The auth service URL
   */
  public getAuthUrl(): string {
    return this.authService.getBaseUrl();
  }

  /**
   * Get the server URL
   *
   * @returns The server URL
   */
  public getServerUrl(): string {
    return this.logsService.getBaseUrl();
  }

  /**
   * Get the web URL
   *
   * @returns The web URL
   */
  public getWebUrl(): string {
    return this.webUrl || '';
  }

  /**
   * Authenticate with username and password
   *
   * @param username Username
   * @param password Password
   * @returns Promise that resolves to true if authentication was successful
   */
  public async authenticateWithPassword(username: string, password: string): Promise<boolean> {
    try {
      // Ensure endpoints are initialized
      await this.initialize();

      // Authenticate with the auth service
      const authResult = await this.authService.login(username, password);

      if (authResult.success) {
        // Store auth token
        this.authToken = authResult.token;
        this.userId = authResult.userId;
        this.tenantId = authResult.tenantId || this.tenantId;
        this.authenticated = true;

        // Derive master secret from password
        this.masterSecret = await this.cryptoService.deriveMasterSecret(username, password);

        // Initialize key hierarchy
        this.keyHierarchy = new KeyHierarchy();

        // Try to retrieve and decrypt KEK
        try {
          const encryptedKEK = await this.kekService.getEncryptedKEK(this.authToken);

          if (encryptedKEK) {
            // Decrypt KEK with master secret
            const kek = await this.cryptoService.decryptKEK(encryptedKEK, this.masterSecret);

            // Initialize key hierarchy with KEK
            this.keyHierarchy = new KeyHierarchy(kek);
          } else {
            // No KEK found, create one
            const kek = await this.cryptoService.generateKEK();

            // Encrypt KEK with master secret
            const encryptedKEK = await this.cryptoService.encryptKEK(kek, this.masterSecret);

            // Store encrypted KEK
            await this.kekService.createEncryptedKEK(encryptedKEK, this.authToken);

            // Initialize key hierarchy with KEK
            this.keyHierarchy = new KeyHierarchy(kek);
          }
        } catch (kekError) {
          console.error('Error handling KEK:', kekError);
          // Continue with master secret-based key hierarchy
        }

        return true;
      }

      return false;
    } catch (error) {
      throw new LogError(
        `Failed to authenticate with password: ${error instanceof Error ? error.message : String(error)}`,
        'authentication_failed'
      );
    }
  }

  /**
   * Authenticate with an API key
   *
   * @param apiKey API key
   * @returns Promise that resolves to true if authentication was successful
   */
  public async authenticateWithApiKey(apiKey: string): Promise<boolean> {
    try {
      // Ensure endpoints are initialized
      await this.initialize();

      // Generate zero-knowledge proof for API key
      const proof = await this.cryptoService.generateApiKeyProof(apiKey);

      // Validate API key with proof
      const valid = await this.authService.validateApiKey(apiKey, this.tenantId, proof);

      if (valid) {
        this.apiKey = apiKey;
        this.authenticated = true;

        // Initialize key hierarchy with API key
        this.keyHierarchy = new KeyHierarchy();
        await this.keyHierarchy.initializeFromApiKey(apiKey, this.tenantId);

        return true;
      }

      return false;
    } catch (error) {
      throw new LogError(
        `Failed to authenticate with API key: ${error instanceof Error ? error.message : String(error)}`,
        'authentication_failed'
      );
    }
  }

  /**
   * Check if the client is authenticated
   *
   * @returns True if the client is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Log data to the specified log
   *
   * @param logName Log name
   * @param data Log data
   * @returns Promise that resolves to the log ID
   */
  public async log(logName: string, data: Record<string, any>): Promise<string> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);

      // Encrypt data
      const logKey = await this.keyHierarchy.deriveLogEncryptionKey(this.apiKey!, this.tenantId, logName);
      const encryptedData = await this.cryptoService.encryptLogData(data, logKey);

      // Generate search tokens
      const searchKey = await this.keyHierarchy.deriveLogSearchKey(this.apiKey!, this.tenantId, logName);
      const searchTokens = await this.cryptoService.generateSearchTokens(JSON.stringify(data), searchKey);

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        `logs/${encryptedLogName}`
      );

      // Send log to server
      return await this.logsService.appendLog(encryptedLogName, encryptedData, resourceToken, searchTokens);
    } catch (error) {
      throw new LogError(
        `Failed to log data: ${error instanceof Error ? error.message : String(error)}`,
        'log_failed'
      );
    }
  }

  /**
   * Get logs from the specified log
   *
   * @param logName Log name
   * @param options Options for getting logs
   * @returns Promise that resolves to the logs
   */
  public async getLogs(
    logName: string,
    options: { limit?: number } = {}
  ): Promise<Record<string, any>[]> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        `logs/${encryptedLogName}`
      );

      // Get logs from server
      const encryptedLogs = await this.logsService.getLogs(
        encryptedLogName,
        options.limit || 100,
        resourceToken
      );

      // Decrypt logs
      const logKey = await this.keyHierarchy.deriveLogEncryptionKey(this.apiKey!, this.tenantId, logName);

      return Promise.all(
        encryptedLogs.map(async (encryptedLog) => {
          return await this.cryptoService.decryptLogData(encryptedLog.data, logKey);
        })
      );
    } catch (error) {
      throw new LogError(
        `Failed to get logs: ${error instanceof Error ? error.message : String(error)}`,
        'get_logs_failed'
      );
    }
  }

  /**
   * Search logs in the specified log
   *
   * @param logName Log name
   * @param options Search options
   * @returns Promise that resolves to the search results
   */
  public async searchLogs(
    logName: string,
    options: {
      query: string;
      limit?: number;
      startTime?: string;
      endTime?: string;
      fields?: string[];
    }
  ): Promise<Record<string, any>[]> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        `logs/${encryptedLogName}`
      );

      // Generate search tokens
      const searchKey = await this.keyHierarchy.deriveLogSearchKey(this.apiKey!, this.tenantId, logName);
      const searchTokens = await this.cryptoService.generateSearchTokens(options.query, searchKey);

      // Search logs on server
      const encryptedResults = await this.logsService.searchLogs(
        encryptedLogName,
        searchTokens,
        options.limit || 100,
        resourceToken
      );

      // Decrypt results
      const logKey = await this.keyHierarchy.deriveLogEncryptionKey(this.apiKey!, this.tenantId, logName);

      return Promise.all(
        encryptedResults.map(async (encryptedResult) => {
          return await this.cryptoService.decryptLogData(encryptedResult.data, logKey);
        })
      );
    } catch (error) {
      throw new LogError(
        `Failed to search logs: ${error instanceof Error ? error.message : String(error)}`,
        'search_logs_failed'
      );
    }
  }

  /**
   * Get all log names
   *
   * @returns Promise that resolves to the log names
   */
  public async getLogNames(): Promise<string[]> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        'logs'
      );

      // Get encrypted log names from server
      const encryptedLogNames = await this.logsService.getLogNames(resourceToken);

      // Decrypt log names
      return Promise.all(
        encryptedLogNames.map(async (encryptedLogName) => {
          return await this.decryptLogName(encryptedLogName);
        })
      );
    } catch (error) {
      throw new LogError(
        `Failed to get log names: ${error instanceof Error ? error.message : String(error)}`,
        'get_log_names_failed'
      );
    }
  }

  /**
   * Clear a log
   *
   * @param logName Log name
   * @returns Promise that resolves when the log is cleared
   */
  public async clearLog(logName: string): Promise<void> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        `logs/${encryptedLogName}`
      );

      // Clear log on server
      await this.logsService.clearLog(encryptedLogName, resourceToken);
    } catch (error) {
      throw new LogError(
        `Failed to clear log: ${error instanceof Error ? error.message : String(error)}`,
        'clear_log_failed'
      );
    }
  }

  /**
   * Delete a log
   *
   * @param logName Log name
   * @returns Promise that resolves when the log is deleted
   */
  public async deleteLog(logName: string): Promise<void> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        `logs/${encryptedLogName}`
      );

      // Delete log on server
      await this.logsService.deleteLog(encryptedLogName, resourceToken);
    } catch (error) {
      throw new LogError(
        `Failed to delete log: ${error instanceof Error ? error.message : String(error)}`,
        'delete_log_failed'
      );
    }
  }

  /**
   * Overwrite a log (clear and add new entries)
   *
   * @param logName Log name
   * @param data Log data
   * @returns Promise that resolves to the log ID
   */
  public async overwriteLog(logName: string, data: Record<string, any>): Promise<string> {
    this.checkAuthentication();

    try {
      // Clear the log first
      await this.clearLog(logName);

      // Then log the new data
      return await this.log(logName, data);
    } catch (error) {
      throw new LogError(
        `Failed to overwrite log: ${error instanceof Error ? error.message : String(error)}`,
        'overwrite_log_failed'
      );
    }
  }

  /**
   * Change password
   *
   * @param oldPassword Old password
   * @param newPassword New password
   * @returns Promise that resolves to true if the password was changed successfully
   */
  public async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    this.checkAuthentication();

    try {
      if (!this.userId || !this.authToken) {
        throw new LogError('User ID or auth token not available', 'not_authenticated');
      }

      // Get encrypted KEK
      const encryptedKEK = await this.kekService.getEncryptedKEK(this.authToken);

      if (!encryptedKEK) {
        throw new LogError('No KEK found', 'kek_not_found');
      }

      // Derive old master secret
      const oldMasterSecret = await this.cryptoService.deriveMasterSecret(this.userId, oldPassword);

      // Decrypt KEK with old master secret
      const kek = await this.cryptoService.decryptKEK(encryptedKEK, oldMasterSecret);

      // Derive new master secret
      const newMasterSecret = await this.cryptoService.deriveMasterSecret(this.userId, newPassword);

      // Encrypt KEK with new master secret
      const newEncryptedKEK = await this.cryptoService.encryptKEK(kek, newMasterSecret);

      // Update encrypted KEK
      await this.kekService.updateEncryptedKEK(newEncryptedKEK, this.authToken);

      // Change password with auth service
      const success = await this.authService.changePassword(oldPassword, newPassword, this.authToken);

      if (success) {
        // Update master secret
        this.masterSecret = newMasterSecret;
        return true;
      }

      return false;
    } catch (error) {
      throw new LogError(
        `Failed to change password: ${error instanceof Error ? error.message : String(error)}`,
        'change_password_failed'
      );
    }
  }

  /**
   * Logout
   *
   * @returns Promise that resolves when the client is logged out
   */
  public async logout(): Promise<void> {
    this.apiKey = null;
    this.authToken = null;
    this.userId = null;
    this.masterSecret = null;
    this.authenticated = false;

    // Clear auth token with auth service
    if (this.authToken) {
      try {
        await this.authService.logout(this.authToken);
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
  }

  /**
   * Create an API key
   *
   * @param name API key name
   * @param permissions API key permissions
   * @returns Promise that resolves to the API key
   */
  public async createApiKey(name: string, permissions: ApiKeyPermission[]): Promise<string> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      if (!this.authToken) {
        throw new LogError('Auth token not available', 'not_authenticated');
      }

      // Generate a unique key ID
      const keyId = await this.cryptoService.generateId();

      // Get the KEK
      let kek: Uint8Array;

      if (this.masterSecret) {
        // Get encrypted KEK
        const encryptedKEK = await this.kekService.getEncryptedKEK(this.authToken);

        if (!encryptedKEK) {
          throw new LogError('No KEK found', 'kek_not_found');
        }

        // Decrypt KEK with master secret
        kek = await this.cryptoService.decryptKEK(encryptedKEK, this.masterSecret);
      } else if (this.apiKey) {
        // Derive KEK from API key
        kek = await this.keyHierarchy.deriveKEK(this.apiKey, this.tenantId);
      } else {
        throw new LogError('No master secret or API key available', 'not_authenticated');
      }

      // Derive API key from KEK
      const apiKey = await this.keyHierarchy.deriveApiKey(kek, this.tenantId, keyId);

      // Generate verification hash
      const verificationHash = await this.cryptoService.generateApiKeyVerificationHash(apiKey);

      // Create API key with auth service
      await this.authService.createApiKey({
        name,
        keyId,
        verificationHash,
        permissions
      }, this.authToken);

      return apiKey;
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
   * @returns Promise that resolves to the API keys
   */
  public async listApiKeys(): Promise<ApiKeyInfo[]> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      if (!this.authToken) {
        throw new LogError('Auth token not available', 'not_authenticated');
      }

      // Get API keys from auth service
      return await this.authService.listApiKeys(this.authToken);
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
   * @returns Promise that resolves when the API key is revoked
   */
  public async revokeApiKey(keyId: string): Promise<void> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      if (!this.authToken) {
        throw new LogError('Auth token not available', 'not_authenticated');
      }

      // Revoke API key with auth service
      await this.authService.revokeApiKey(keyId, this.authToken);
    } catch (error) {
      throw new LogError(
        `Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`,
        'revoke_api_key_failed'
      );
    }
  }

  /**
   * Get a resource token
   *
   * @param resource Resource path
   * @returns Promise that resolves to the resource token
   */
  public async getResourceToken(resource: string): Promise<string> {
    this.checkAuthentication();

    try {
      // Ensure endpoints are initialized
      await this.initialize();

      // Get token from token service
      if (this.authToken) {
        return await this.tokenService.getResourceToken(resource, this.authToken);
      } else if (this.apiKey) {
        // Generate zero-knowledge proof for API key
        const proof = await this.cryptoService.generateApiKeyProof(this.apiKey);

        return await this.tokenService.getResourceTokenWithApiKey(resource, this.apiKey, proof);
      } else {
        throw new LogError('No auth token or API key available', 'not_authenticated');
      }
    } catch (error) {
      throw new LogError(
        `Failed to get resource token: ${error instanceof Error ? error.message : String(error)}`,
        'get_resource_token_failed'
      );
    }
  }

  /**
   * Get the direct logs service
   *
   * This is used by the migration script to access the logs service directly.
   *
   * @returns The logs service
   */
  public getDirectLogsService(): LogsService {
    return this.logsService;
  }

  /**
   * Encrypt a log name
   *
   * @param logName Log name
   * @returns Promise that resolves to the encrypted log name
   */
  private async encryptLogName(logName: string): Promise<string> {
    const logNameKey = await this.keyHierarchy.deriveLogNameKey(this.apiKey!, this.tenantId);
    return await this.cryptoService.encryptLogName(logName, logNameKey);
  }

  /**
   * Decrypt a log name
   *
   * @param encryptedLogName Encrypted log name
   * @returns Promise that resolves to the decrypted log name
   */
  private async decryptLogName(encryptedLogName: string): Promise<string> {
    const logNameKey = await this.keyHierarchy.deriveLogNameKey(this.apiKey!, this.tenantId);
    return await this.cryptoService.decryptLogName(encryptedLogName, logNameKey);
  }

  /**
   * Check if the client is authenticated
   *
   * @throws LogError if the client is not authenticated
   */
  private checkAuthentication(): void {
    if (!this.authenticated || !this.apiKey) {
      throw new LogError('Not authenticated', 'not_authenticated');
    }
  }
}
