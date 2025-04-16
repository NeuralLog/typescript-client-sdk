import { Configuration, DefaultApi } from '../generated/log-server';
import { LogError } from '../errors';
import { Log, LogEntry, LogSearchOptions, PaginatedResult } from '../types';
import axios, { AxiosInstance } from 'axios';

/**
 * Client for interacting with the NeuralLog log server using the OpenAPI generated client
 */
export class OpenApiLogServerClient {
  private api: DefaultApi;
  private baseUrl: string;
  private apiClient: AxiosInstance;

  /**
   * Create a new OpenApiLogServerClient
   *
   * @param baseUrl Base URL of the log server
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    this.baseUrl = baseUrl;
    this.apiClient = apiClient;

    // Create the OpenAPI client
    const config = new Configuration({
      basePath: baseUrl,
      accessToken: async () => {
        // Get the token from the Authorization header
        const authHeader = apiClient.defaults.headers.common['Authorization'] as string;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          return authHeader.substring(7);
        }
        return '';
      }
    });
    this.api = new DefaultApi(config);
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
    try {
      // Get tenant ID from headers
      const tenantId = this.getTenantId();

      // Create the log entry
      const logEntry: LogEntry = {
        logId: logName,
        data: encryptedData,
        searchTokens
      };

      // Make the API call using the OpenAPI client
      const response = await this.api.appendLogEntry({
        logName,
        xTenantId: tenantId,
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
    try {
      // Get tenant ID from headers
      const tenantId = this.getTenantId();

      // Make the API call using the OpenAPI client
      const response = await this.api.createLog({
        xTenantId: tenantId,
        log
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to create log: ${error instanceof Error ? error.message : String(error)}`,
        'create_log_failed'
      );
    }
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
    try {
      // Get tenant ID from headers
      const tenantId = this.getTenantId();

      // Make the API call using the OpenAPI client
      const response = await this.api.getLogs({
        xTenantId: tenantId
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        params: {
          limit,
          offset
        }
      });

      return response.data || [];
    } catch (error) {
      throw new LogError(
        `Failed to get logs: ${error instanceof Error ? error.message : String(error)}`,
        'get_all_logs_failed'
      );
    }
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
    try {
      // Get tenant ID from headers
      const tenantId = this.getTenantId();

      // Create the search options
      const searchOptions: LogSearchOptions = {
        searchTokens,
        limit
      };

      // Make the API call using the OpenAPI client
      const response = await this.api.searchLogEntries({
        logName,
        xTenantId: tenantId,
        logSearchOptions: searchOptions
      }, {
        headers: {
          Authorization: `Bearer ${resourceToken}`
        }
      });

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
   * Get all log names
   *
   * @param resourceToken Resource token
   * @returns Promise that resolves to the log names
   */
  public async getLogNames(resourceToken: string): Promise<string[]> {
    try {
      // Get tenant ID from headers
      const tenantId = this.getTenantId();

      // Make the API call using the OpenAPI client
      const response = await this.api.getLogs({
        xTenantId: tenantId
      }, {
        headers: {
          Authorization: `Bearer ${resourceToken}`
        }
      });

      // Map the logs to their names
      return (response.data as Log[])?.map(log => log.name) || [];
    } catch (error) {
      throw new LogError(
        `Failed to get log names: ${error instanceof Error ? error.message : String(error)}`,
        'get_log_names_failed'
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
    try {
      // Get tenant ID from headers
      const tenantId = this.getTenantId();

      // Make the API call using the OpenAPI client
      const response = await this.api.getLogEntries({
        logName: encryptedLogName,
        xTenantId: tenantId,
        limit,
        offset
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const entries = response.data.entries || [];
      const totalCount = response.data.total || 0;

      return {
        entries,
        items: entries,
        total: totalCount,
        totalCount,
        offset,
        limit,
        hasMore: (offset + entries.length) < totalCount
      };
    } catch (error) {
      throw new LogError(
        `Failed to get log entries: ${error instanceof Error ? error.message : String(error)}`,
        'get_log_entries_failed'
      );
    }
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
    try {
      // Get tenant ID from headers
      const tenantId = this.getTenantId();

      // Make the API call using the OpenAPI client - use getLogEntries since getLogEntry doesn't exist
      const response = await this.api.getLogEntries({
        logName: encryptedLogName,
        xTenantId: tenantId
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        params: {
          entryId
        }
      });

      // Find the entry with the matching ID
      const entry = response.data.entries?.find(e => e.id === entryId);
      if (!entry) {
        throw new Error(`Log entry with ID ${entryId} not found`);
      }

      return entry;
    } catch (error) {
      throw new LogError(
        `Failed to get log entry: ${error instanceof Error ? error.message : String(error)}`,
        'get_log_entry_failed'
      );
    }
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
    try {
      // Get tenant ID from headers
      const tenantId = this.getTenantId();

      // Make the API call using the OpenAPI client
      const response = await this.api.searchLogEntries({
        logName,
        xTenantId: tenantId,
        logSearchOptions: searchOptions
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const entries = response.data.entries || [];
      const totalCount = response.data.total || 0;
      const offset = searchOptions.offset || 0;
      const limit = searchOptions.limit || 10;

      return {
        entries,
        items: entries,
        total: totalCount,
        totalCount,
        offset,
        limit,
        hasMore: (offset + entries.length) < totalCount
      };
    } catch (error) {
      throw new LogError(
        `Failed to search log entries: ${error instanceof Error ? error.message : String(error)}`,
        'search_log_entries_failed'
      );
    }
  }

  /**
   * Get tenant ID from headers
   *
   * @returns Tenant ID
   */
  private getTenantId(): string {
    const tenantId = this.apiClient.defaults.headers.common['x-tenant-id'] as string;
    if (!tenantId) {
      throw new LogError('Tenant ID not found in headers', 'tenant_id_not_found');
    }
    return tenantId;
  }
}
