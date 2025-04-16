import { AxiosInstance } from 'axios';
import axios from 'axios';
import { LogError } from '../errors';
import { Log, LogEntry, LogSearchOptions, PaginatedResult } from '../types';
import { OpenApiLogServerClient } from './OpenApiLogServerClient';

/**
 * Service for interacting with the NeuralLog logs service
 */
export class LogsService {
  private baseUrl: string;
  private apiClient: AxiosInstance;
  private openApiClient: OpenApiLogServerClient;

  /**
   * Create a new LogsService
   *
   * @param baseUrl Base URL of the logs service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    this.baseUrl = baseUrl;
    this.apiClient = apiClient;
    this.openApiClient = new OpenApiLogServerClient(baseUrl, apiClient);
  }

  /**
   * Get the base URL
   *
   * @returns The base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set the base URL
   *
   * @param baseUrl The new base URL
   */
  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Append a log to the specified log
   *
   * @param logName Log name (already encrypted by the client)
   * @param encryptedData Encrypted log data
   * @param resourceToken Resource token
   * @param searchTokens Optional search tokens for searchable encryption
   * @returns Promise that resolves to the log ID
   */
  public async appendLog(
    logName: string,
    encryptedData: Record<string, any>,
    resourceToken: string,
    searchTokens?: string[]
  ): Promise<string> {
    // Use the OpenAPI client
    return this.openApiClient.appendLog(logName, encryptedData, resourceToken, searchTokens);
  }

  /**
   * Create a new log
   *
   * @param authToken Authentication token
   * @param log Complete Log object
   * @returns Promise that resolves to the created log
   */
  public async createLog(
    authToken: string,
    log: Log
  ): Promise<Log> {
    // Use the OpenAPI client
    return this.openApiClient.createLog(authToken, log);
  }

  /**
   * Get logs
   *
   * @param authToken Authentication token
   * @param limit Maximum number of logs to return (optional)
   * @param offset Offset for pagination (optional)
   * @returns Promise that resolves to the logs
   */
  public async getLogs(
    authToken: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Log[]> {
    // Use the OpenAPI client
    return this.openApiClient.getLogs(authToken, limit, offset);
  }

  /**
   * Search logs in the specified log
   *
   * @param logName Log name
   * @param searchTokens Search tokens
   * @param limit Maximum number of results to return
   * @param resourceToken Resource token
   * @returns Promise that resolves to the search results
   */
  public async searchLogs(
    logName: string,
    searchTokens: string[],
    limit: number,
    resourceToken: string
  ): Promise<Array<{ id: string; timestamp: string; data: Record<string, any> }>> {
    // Use the OpenAPI client
    return this.openApiClient.searchLogs(logName, searchTokens, limit, resourceToken);
  }

  /**
   * Get all log names
   *
   * @param resourceToken Resource token
   * @returns Promise that resolves to the log names
   */
  public async getLogNames(resourceToken: string): Promise<string[]> {
    // Use the OpenAPI client
    return this.openApiClient.getLogNames(resourceToken);
  }

  /**
   * Clear a log
   *
   * @param logName Log name
   * @param resourceToken Resource token
   * @returns Promise that resolves when the log is cleared
   */
  public async clearLog(logName: string, resourceToken: string): Promise<void> {
    try {
      await this.apiClient.post(
        `${this.baseUrl}/logs/${logName}/clear`,
        {},
        {
          headers: {
            Authorization: `Bearer ${resourceToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to clear log: ${error instanceof Error ? error.message : String(error)}`,
        'clear_log_failed'
      );
    }
  }

  /**
   * Get a log by name
   *
   * @param authToken Authentication token
   * @param encryptedName Encrypted log name
   * @returns Promise that resolves to the log
   */
  public async getLog(authToken: string, encryptedName: string): Promise<Log> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/logs/${encryptedName}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to get log: ${error instanceof Error ? error.message : String(error)}`,
        'get_log_failed'
      );
    }
  }

  /**
   * Update a log
   *
   * @param authToken Authentication token
   * @param log Complete Log object
   * @returns Promise that resolves to the updated log
   */
  public async updateLog(
    authToken: string,
    log: Log
  ): Promise<Log> {
    try {
      const response = await this.apiClient.put(
        `${this.baseUrl}/logs/${log.name}`,
        log,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to update log: ${error instanceof Error ? error.message : String(error)}`,
        'update_log_failed'
      );
    }
  }

  /**
   * Append a log entry
   *
   * @param authToken Authentication token
   * @param logName Log name
   * @param entry Complete LogEntry object
   * @returns Promise that resolves to the log entry
   */
  public async appendLogEntry(
    authToken: string,
    logName: string,
    entry: LogEntry
  ): Promise<LogEntry> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/logs/${logName}/entries`,
        entry,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to append log entry: ${error instanceof Error ? error.message : String(error)}`,
        'append_log_entry_failed'
      );
    }
  }

  /**
   * Get log entries
   *
   * @param authToken Authentication token
   * @param encryptedLogName Encrypted log name
   * @param limit Maximum number of entries to return
   * @param offset Offset for pagination
   * @returns Promise that resolves to the log entries
   */
  public async getLogEntries(
    authToken: string,
    encryptedLogName: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResult<LogEntry>> {
    // Use the OpenAPI client
    return this.openApiClient.getLogEntries(authToken, encryptedLogName, limit, offset);
  }

  /**
   * Get a log entry
   *
   * @param authToken Authentication token
   * @param encryptedLogName Encrypted log name
   * @param entryId Log entry ID
   * @returns Promise that resolves to the log entry
   */
  public async getLogEntry(
    authToken: string,
    encryptedLogName: string,
    entryId: string
  ): Promise<LogEntry> {
    // Use the OpenAPI client
    return this.openApiClient.getLogEntry(authToken, encryptedLogName, entryId);
  }

  /**
   * Search log entries
   *
   * @param authToken Authentication token
   * @param logName Log name
   * @param searchOptions Complete LogSearchOptions object
   * @returns Promise that resolves to the search results
   */
  public async searchLogEntries(
    authToken: string,
    logName: string,
    searchOptions: LogSearchOptions
  ): Promise<PaginatedResult<LogEntry>> {
    // Use the OpenAPI client
    return this.openApiClient.searchLogEntries(authToken, logName, searchOptions);
  }

  /**
   * Get log statistics
   *
   * @param authToken Authentication token
   * @param encryptedLogName Encrypted log name
   * @returns Promise that resolves to the log statistics
   */
  public async getLogStatistics(
    authToken: string,
    encryptedLogName: string
  ): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/logs/${encryptedLogName}/statistics`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to get log statistics: ${error instanceof Error ? error.message : String(error)}`,
        'get_log_statistics_failed'
      );
    }
  }

  /**
   * Batch append log entries
   *
   * @param authToken Authentication token
   * @param logName Log name
   * @param entries Array of complete LogEntry objects
   * @returns Promise that resolves to the log entries
   */
  public async batchAppendLogEntries(
    authToken: string,
    logName: string,
    entries: LogEntry[]
  ): Promise<PaginatedResult<LogEntry>> {
    try {
      // Create a copy of the entries array to avoid variable shadowing
      const entriesToSend = entries.slice();

      // Make the API call
      const response = await this.apiClient.post(
        `${this.baseUrl}/logs/${logName}/entries/batch`,
        { entries: entriesToSend },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      // Extract the response data
      const responseEntries = response.data.entries || [];
      const totalCount = responseEntries.length;

      return {
        entries: responseEntries,
        items: responseEntries,
        total: totalCount,
        totalCount,
        offset: 0,
        limit: entriesToSend.length,
        hasMore: false
      };
    } catch (error) {
      throw new LogError(
        `Failed to batch append log entries: ${error instanceof Error ? error.message : String(error)}`,
        'batch_append_log_entries_failed'
      );
    }
  }



  /**
   * Delete a log
   *
   * @param authToken Authentication token
   * @param encryptedName Encrypted log name
   * @returns Promise that resolves when the log is deleted
   */
  public async deleteLog(authToken: string, encryptedName: string): Promise<void> {
    try {
      await this.apiClient.delete(
        `${this.baseUrl}/logs/${encryptedName}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to delete log: ${error instanceof Error ? error.message : String(error)}`,
        'delete_log_failed'
      );
    }
  }

  /**
   * Get a log name key
   *
   * @returns Promise that resolves to the log name key
   */
  public async getLogNameKey(): Promise<Uint8Array> {
    // This is a placeholder - the actual implementation would derive the key
    // from the API key and tenant ID
    return new Uint8Array(32);
  }

  /**
   * Encrypt a log name
   *
   * @param logName Log name
   * @returns Promise that resolves to the encrypted log name
   */
  public async encryptLogName(logName: string): Promise<string> {
    // This is a placeholder - the actual implementation would encrypt the log name
    return `encrypted:${logName}`;
  }

  /**
   * Get a resource token
   *
   * @param resource Resource path
   * @returns Promise that resolves to the resource token
   */
  public async getResourceToken(resource: string): Promise<string> {
    // This is a placeholder - the actual implementation would get a resource token
    // from the auth service
    return 'resource-token';
  }
}
