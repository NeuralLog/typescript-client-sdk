import { CryptoService } from '../crypto/CryptoService';
import { LogsService } from '../logs/LogsService';
import { AuthService } from '../auth/AuthService';
import { AuthManager } from '../auth/AuthManager';
import { LogError } from '../errors';
import { LoggerService } from '../utils/LoggerService';
import { LogServerClient } from '../logs/LogServerClient';

/**
 * Manager for log operations
 *
 * This class provides methods for managing logs and log entries with support for
 * both direct authentication tokens and AuthManager-based authentication.
 */
export class LogManager {
  private logger = LoggerService.getInstance(process.env.NODE_ENV === 'test');
  private cryptoService: CryptoService;
  private logServerClient: LogServerClient;
  private authService: AuthService;
  private authManager: AuthManager;

  /**
   * Create a new LogManager
   *
   * @param cryptoService Crypto service
   * @param logsService Logs service
   * @param authService Auth service
   * @param authManager Auth manager for authentication
   * @param tenantId Tenant ID
   */
  constructor(
    cryptoService: CryptoService,
    logsService: LogsService,
    authService: AuthService,
    authManager: AuthManager,
    private tenantId: string
  ) {
    this.cryptoService = cryptoService;
    this.authService = authService;
    this.authManager = authManager;

    // Create the LogServerClient
    this.logServerClient = new LogServerClient(
      logsService.getBaseUrl(),
      cryptoService,
      authService,
      tenantId
    );
  }

  /**
   * Get authentication token
   *
   * @returns Authentication token
   * @throws Error if not authenticated
   */
  private getAuthToken(): string {
    const token = this.authManager.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    return token;
  }

  /**
   * Log data to the specified log
   *
   * @param logName Log name
   * @param data Log data
   * @param options Options for logging
   * @returns Promise that resolves to the log ID
   */
  public async log(
    logName: string,
    data: Record<string, any>,
    options: { kekVersion?: string } = {}
  ): Promise<string> {
    try {
      // If a specific KEK version is requested, set it as the current version
      if (options.kekVersion) {
        this.cryptoService.setCurrentKEKVersion(options.kekVersion);
      }

      // Encrypt log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);

      // Encrypt log data
      const encryptedData = await this.cryptoService.encryptLogData(data);

      // Generate search tokens
      const searchKey = await this.cryptoService.deriveSearchKey();
      const searchTokens = await this.cryptoService.generateSearchTokens(
        typeof data === 'string' ? data : JSON.stringify(data),
        searchKey
      );

      // Get auth token
      const authToken = this.getAuthToken();

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        authToken,
        `logs/${encryptedLogName}`
      );

      // Send log to server using the LogServerClient
      return await this.logServerClient.appendLog(encryptedLogName, encryptedData, resourceToken, searchTokens);
    } catch (error) {
      throw new LogError(
        `Failed to log data: ${error instanceof Error ? error.message : String(error)}`,
        'log_failed'
      );
    }
  }

  /**
   * Get logs for the specified log name
   *
   * @param logName Log name
   * @param options Options for getting logs
   * @returns Promise that resolves to the logs
   */
  public async getLogs(
    logName: string,
    options: { limit?: number } = {}
  ): Promise<Record<string, any>[]> {
    try {
      // Encrypt log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);

      // Get auth token
      const authToken = this.getAuthToken();

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        authToken,
        `logs/${encryptedLogName}`
      );

      // Get logs from server using the LogServerClient
      const encryptedLogs = await this.logServerClient.getLogs(
        encryptedLogName,
        resourceToken,
        options.limit || 100
      );

      // Decrypt logs
      return Promise.all(
        encryptedLogs.map(async (encryptedLog) => {
          try {
            // Decrypt data with the appropriate KEK version
            return await this.cryptoService.decryptLogData(encryptedLog);
          } catch (decryptError) {
            this.logger.error(`Failed to decrypt log: ${decryptError}`);

            // If we get here, we couldn't decrypt the log
            // Handle missing encryptionInfo property
            const encryptionInfo = (encryptedLog as any).encryptionInfo;
            return {
              error: 'Failed to decrypt log',
              encryptedWithVersion: encryptionInfo?.kekVersion || 'unknown'
            };
          }
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
   * Search logs for the specified log name
   *
   * @param logName Log name
   * @param options Options for searching logs
   * @returns Promise that resolves to the search results
   */
  public async searchLogs(
    logName: string,
    options: { query: string; limit?: number } = { query: '' }
  ): Promise<Record<string, any>[]> {
    try {
      // Encrypt log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);

      // Get auth token
      const authToken = this.getAuthToken();

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        authToken,
        `logs/${encryptedLogName}`
      );

      // Generate search tokens
      const searchKey = await this.cryptoService.deriveSearchKey();
      const searchTokens = await this.cryptoService.generateSearchTokens(options.query, searchKey);

      // Search logs on server using the LogServerClient
      const encryptedResults = await this.logServerClient.searchLogs(
        encryptedLogName,
        searchTokens,
        options.limit || 100,
        resourceToken
      );

      // Decrypt results
      return Promise.all(
        encryptedResults.map(async (encryptedResult) => {
          try {
            // Decrypt data with the appropriate KEK version
            return await this.cryptoService.decryptLogData(encryptedResult.data);
          } catch (decryptError) {
            this.logger.error(`Failed to decrypt search result: ${decryptError}`);

            // If we get here, we couldn't decrypt the log
            return {
              error: 'Failed to decrypt search result',
              encryptedWithVersion: encryptedResult.data?.encryptionInfo?.kekVersion || 'unknown'
            };
          }
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
   * Get log names
   *
   * @returns Promise that resolves to an array of log names
   */
  public async getLogNames(): Promise<string[]> {
    try {
      // Get auth token
      const authToken = this.getAuthToken();

      // Get resource token for logs
      const resourceToken = await this.authService.getResourceToken(
        authToken,
        'logs'
      );

      // Get log names from server using the LogServerClient
      const encryptedLogNames = await this.logServerClient.getLogNames(resourceToken);

      // Decrypt log names
      return Promise.all(
        encryptedLogNames.map(async (encryptedLogName) => {
          try {
            return await this.cryptoService.decryptLogName(encryptedLogName);
          } catch (decryptError) {
            this.logger.error(`Failed to decrypt log name: ${decryptError}`);
            return `encrypted:${encryptedLogName}`;
          }
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
   * Update a log entry
   *
   * @param logName Log name
   * @param logId Log ID
   * @param data Updated log data
   * @returns Promise that resolves when the update is complete
   */
  public async updateLogEntry(
    logName: string,
    logId: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Encrypt log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);

      // Encrypt log data
      const encryptedData = await this.cryptoService.encryptLogData(data);

      // Get auth token
      const authToken = this.getAuthToken();

      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        authToken,
        `logs/${encryptedLogName}`
      );

      // Update log entry on server using the LogServerClient
      await this.logServerClient.updateLogEntry(
        encryptedLogName,
        logId,
        encryptedData,
        resourceToken
      );
    } catch (error) {
      throw new LogError(
        `Failed to update log entry: ${error instanceof Error ? error.message : String(error)}`,
        'update_log_entry_failed'
      );
    }
  }

  /**
   * Re-encrypt a log name with a new KEK version
   *
   * @param logName Log name
   * @param newKEKVersion New KEK version
   * @returns Promise that resolves to the re-encrypted log name
   */
  public async reencryptLogName(logName: string, newKEKVersion: string): Promise<string> {
    try {
      // Re-encrypt the log name with the new KEK version
      return await this.cryptoService.reencryptLogName(logName, newKEKVersion);
    } catch (error) {
      throw new LogError(
        `Failed to re-encrypt log name: ${error instanceof Error ? error.message : String(error)}`,
        'reencrypt_log_name_failed'
      );
    }
  }

  /**
   * Set the base URL for the log server client
   *
   * @param baseUrl The new base URL
   */
  public setBaseUrl(baseUrl: string): void {
    // Update the base URL for the log server client
    this.logServerClient.setBaseUrl(baseUrl);
  }
}
