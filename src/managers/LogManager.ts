import { CryptoService } from '../crypto/CryptoService';
import { LogsService } from '../logs/LogsService';
import { AuthService } from '../auth/AuthService';
import { AuthManager } from '../auth/AuthManager';
import { LogError } from '../errors';
import {
  Log,
  LogEntry,
  LogSearchOptions,
  PaginatedResult
} from '../types';
import { LoggerService } from '../utils/LoggerService';

/**
 * Manager for log operations
 *
 * This class provides methods for managing logs and log entries with support for
 * both direct authentication tokens and AuthManager-based authentication.
 */
export class LogManager {
  private logger = LoggerService.getInstance(process.env.NODE_ENV === 'test');
  private cryptoService: CryptoService;
  private logsService: LogsService;
  private authService: AuthService;
  private authManager: AuthManager;
  private tenantId: string;

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
    tenantId: string
  ) {
    this.cryptoService = cryptoService;
    this.logsService = logsService;
    this.authService = authService;
    this.authManager = authManager;
    this.tenantId = tenantId;
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
        this.tenantId,
        `logs/${encryptedLogName}`
      );

      // Get logs from server
      const encryptedLogs = await this.logsService.getLogs(
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
        this.tenantId,
        `logs/${encryptedLogName}`
      );

      // Generate search tokens
      const searchKey = await this.cryptoService.deriveSearchKey();
      const searchTokens = await this.cryptoService.generateSearchTokens(options.query, searchKey);

      // Search logs on server
      const encryptedResults = await this.logsService.searchLogs(
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


}
