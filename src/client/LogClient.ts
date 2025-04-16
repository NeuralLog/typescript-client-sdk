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
   * Set the base URL for the client
   *
   * @param baseUrl The new base URL
   */
  public override setBaseUrl(baseUrl: string): void {
    // Update the base URL for the log manager
    this.logManager.setBaseUrl(baseUrl);
  }
}
