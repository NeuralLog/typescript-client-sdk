import { BaseClient } from './BaseClient';
import { LogManager } from '../managers/LogManager';
import { AuthProvider } from './services/AuthProvider';
import { ConfigurationService } from './services/ConfigurationService';
import { LogOptions, GetLogsOptions, SearchOptions } from './types';

/**
 * Client for log operations
 */
export class LogClient extends BaseClient {
  /**
   * Create a new LogClient
   *
   * @param logManager Log manager
   * @param configService Configuration service
   * @param authProvider Authentication provider
   */
  constructor(
    private logManager: LogManager,
    configService: ConfigurationService,
    authProvider: AuthProvider
  ) {
    super(configService, authProvider);
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
    options: LogOptions = {}
  ): Promise<string> {
    this.checkInitialization();
    this.authProvider.checkAuthentication();

    try {
      return await this.logManager.log(logName, data, options);
    } catch (error) {
      this.handleError(error, 'log data', 'log_failed');
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
    options: GetLogsOptions = {}
  ): Promise<Record<string, any>[]> {
    this.checkInitialization();
    this.authProvider.checkAuthentication();

    try {
      return await this.logManager.getLogs(logName, options);
    } catch (error) {
      this.handleError(error, 'get logs', 'get_logs_failed');
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
    options: SearchOptions
  ): Promise<Record<string, any>[]> {
    this.checkInitialization();
    this.authProvider.checkAuthentication();

    try {
      return await this.logManager.searchLogs(logName, options);
    } catch (error) {
      this.handleError(error, 'search logs', 'search_logs_failed');
    }
  }

  /**
   * Get log names
   *
   * @returns Promise that resolves to an array of log names
   */
  public async getLogNames(): Promise<string[]> {
    this.checkInitialization();
    this.authProvider.checkAuthentication();

    try {
      return await this.logManager.getLogNames();
    } catch (error) {
      this.handleError(error, 'get log names', 'get_log_names_failed');
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
    this.checkInitialization();
    this.authProvider.checkAuthentication();

    try {
      await this.logManager.updateLogEntry(logName, logId, data);
    } catch (error) {
      this.handleError(error, 'update log entry', 'update_log_entry_failed');
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
    this.checkInitialization();
    this.authProvider.checkAuthentication();

    try {
      return await this.logManager.reencryptLogName(logName, newKEKVersion);
    } catch (error) {
      this.handleError(error, 're-encrypt log name', 'reencrypt_log_name_failed');
    }
  }

  /**
   * Set the base URL for the client
   *
   * @param baseUrl The new base URL
   */
  public override setBaseUrl(baseUrl: string): void {
    // Update the base URL for the log manager
    this.logManager.setBaseUrl(baseUrl);
  }
}
