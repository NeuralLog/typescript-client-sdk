import { Configuration, DefaultApi } from '../generated/log-server';
import { CryptoService } from '../crypto/CryptoService';
import { AuthService } from '../auth/AuthService';
import { LogError } from '../errors';
import { LogOptions, GetLogsOptions, SearchOptions } from '../client/types';

/**
 * Client for interacting with the NeuralLog log server
 *
 * This client wraps the generated OpenAPI client and adds authentication and encryption
 */
export class LogServerClient {
  private api: DefaultApi;
  private cryptoService: CryptoService;
  private authService: AuthService;
  private tenantId: string;

  /**
   * Create a new LogServerClient
   *
   * @param baseUrl Base URL of the log server
   * @param cryptoService Crypto service for encryption/decryption
   * @param authService Auth service for authentication
   * @param tenantId Tenant ID
   */
  constructor(
    baseUrl: string,
    cryptoService: CryptoService,
    authService: AuthService,
    tenantId: string
  ) {
    // Create the OpenAPI client
    const config = new Configuration({
      basePath: baseUrl,
      accessToken: this.getAuthToken.bind(this)
    });
    this.api = new DefaultApi(config);

    this.cryptoService = cryptoService;
    this.authService = authService;
    this.tenantId = tenantId;
  }

  /**
   * Get authentication token for the API client
   *
   * @returns Authentication token
   */
  private async getAuthToken(): Promise<string> {
    // This method is no longer used since we're using resource tokens directly
    throw new LogError('Not authenticated', 'not_authenticated');
  }

  /**
   * Append a log entry
   *
   * @param encryptedLogName Encrypted log name
   * @param encryptedData Encrypted log data
   * @param resourceToken Resource token
   * @param searchTokens Search tokens
   * @returns Promise that resolves to the log ID
   */
  public async appendLog(
    encryptedLogName: string,
    encryptedData: Record<string, any>,
    resourceToken: string,
    searchTokens?: string[]
  ): Promise<string> {
    try {
      // Create the log entry
      const logEntry = {
        logId: encryptedLogName,
        data: encryptedData,
        searchTokens
      };

      // Make the API call
      const response = await this.api.appendLogEntry({
        logName: encryptedLogName,
        xTenantId: this.tenantId,
        logEntry
      }, {
        headers: {
          Authorization: `Bearer ${resourceToken}`
        }
      });

      return response.data.id || '';
    } catch (error) {
      throw new LogError(
        `Failed to append log: ${error instanceof Error ? error.message : String(error)}`,
        'append_log_failed'
      );
    }
  }

  /**
   * Get logs
   *
   * @param encryptedLogName Encrypted log name
   * @param resourceToken Resource token
   * @param limit Maximum number of logs to return
   * @returns Promise that resolves to the encrypted logs
   */
  public async getLogs(
    encryptedLogName: string,
    resourceToken: string,
    limit: number = 100
  ): Promise<Record<string, any>[]> {
    try {
      // Make the API call
      const response = await this.api.getLogEntries({
        logName: encryptedLogName,
        xTenantId: this.tenantId,
        limit
      }, {
        headers: {
          Authorization: `Bearer ${resourceToken}`
        }
      });

      // Return the encrypted entries
      return response.data.entries?.map(entry => entry.data as Record<string, any>) || [];
    } catch (error) {
      throw new LogError(
        `Failed to get logs: ${error instanceof Error ? error.message : String(error)}`,
        'get_logs_failed'
      );
    }
  }

  /**
   * Search logs
   *
   * @param encryptedLogName Encrypted log name
   * @param searchTokens Search tokens
   * @param limit Maximum number of results to return
   * @param resourceToken Resource token
   * @returns Promise that resolves to the search results
   */
  public async searchLogs(
    encryptedLogName: string,
    searchTokens: string[],
    limit: number,
    resourceToken: string
  ): Promise<Array<{ id: string; timestamp: string; data: Record<string, any> }>> {
    try {
      // Create the search options
      const searchOptions = {
        searchTokens,
        limit
      };

      // Make the API call
      const response = await this.api.searchLogEntries({
        logName: encryptedLogName,
        xTenantId: this.tenantId,
        logSearchOptions: searchOptions
      }, {
        headers: {
          Authorization: `Bearer ${resourceToken}`
        }
      });

      // Return the search results
      return response.data.entries?.map(entry => ({
        id: entry.id || '',
        timestamp: entry.timestamp || '',
        data: entry.data as Record<string, any>
      })) || [];
    } catch (error) {
      throw new LogError(
        `Failed to search logs: ${error instanceof Error ? error.message : String(error)}`,
        'search_logs_failed'
      );
    }
  }

  /**
   * Get log names
   *
   * @param resourceToken Resource token
   * @returns Promise that resolves to the encrypted log names
   */
  public async getLogNames(resourceToken: string): Promise<string[]> {
    try {
      // Make the API call
      const response = await this.api.getLogNames({
        xTenantId: this.tenantId
      }, {
        headers: {
          Authorization: `Bearer ${resourceToken}`
        }
      });

      // Return the encrypted log names
      return response.data.logNames || [];
    } catch (error) {
      throw new LogError(
        `Failed to get log names: ${error instanceof Error ? error.message : String(error)}`,
        'get_log_names_failed'
      );
    }
  }

  /**
   * Update a log entry
   *
   * @param encryptedLogName Encrypted log name
   * @param logId Log ID
   * @param encryptedData Encrypted log data
   * @param resourceToken Resource token
   * @returns Promise that resolves when the update is complete
   */
  public async updateLogEntry(
    encryptedLogName: string,
    logId: string,
    encryptedData: Record<string, any>,
    resourceToken: string
  ): Promise<void> {
    try {
      // Create the log entry
      const logEntry = {
        logId,
        data: encryptedData
      };

      // Make the API call
      await this.api.updateLogEntry({
        logName: encryptedLogName,
        entryId: logId,
        xTenantId: this.tenantId,
        logEntry
      }, {
        headers: {
          Authorization: `Bearer ${resourceToken}`
        }
      });
    } catch (error) {
      throw new LogError(
        `Failed to update log entry: ${error instanceof Error ? error.message : String(error)}`,
        'update_log_entry_failed'
      );
    }
  }

  /**
   * Set the base URL for the log server client
   *
   * @param baseUrl The new base URL
   */
  public setBaseUrl(baseUrl: string): void {
    // Create a new OpenAPI client with the new base URL
    const config = new Configuration({
      basePath: baseUrl,
      accessToken: this.getAuthToken.bind(this)
    });
    this.api = new DefaultApi(config);
  }
}
