import { AxiosInstance } from 'axios';
import axios from 'axios';
import { LogError } from '../errors';

/**
 * Service for interacting with the NeuralLog logs service
 */
export class LogsService {
  private baseUrl: string;
  private apiClient: AxiosInstance;

  /**
   * Create a new LogsService
   *
   * @param baseUrl Base URL of the logs service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    this.baseUrl = baseUrl;
    this.apiClient = apiClient;
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
      // Include search tokens in the request if provided
      const dataToSend = searchTokens ? { ...encryptedData, searchTokens } : encryptedData;

      const response = await this.apiClient.post(
        `${this.baseUrl}/logs/${logName}`,
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${resourceToken}`
          }
        }
      );

      return response.data.logId;
    } catch (error) {
      throw new LogError(
        `Failed to append log: ${error instanceof Error ? error.message : String(error)}`,
        'append_log_failed'
      );
    }
  }

  /**
   * Get logs from the specified log
   *
   * @param logName Log name
   * @param limit Maximum number of logs to return
   * @param resourceToken Resource token
   * @returns Promise that resolves to the logs
   */
  public async getLogs(
    logName: string,
    limit: number,
    resourceToken: string
  ): Promise<Array<{ id: string; timestamp: string; data: Record<string, any> }>> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/logs/${logName}`,
        {
          params: { limit },
          headers: {
            Authorization: `Bearer ${resourceToken}`
          }
        }
      );

      return response.data.entries || [];
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
      // Build query parameters
      const params: Record<string, any> = {
        log_name: logName,
        limit
      };

      // Add search tokens
      if (searchTokens.length > 0) {
        params.tokens = searchTokens;
      }

      const response = await this.apiClient.get(
        `${this.baseUrl}/search`,
        {
          params,
          headers: {
            Authorization: `Bearer ${resourceToken}`
          }
        }
      );

      return response.data.results || [];
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
      const response = await this.apiClient.get(
        `${this.baseUrl}/logs`,
        {
          headers: {
            Authorization: `Bearer ${resourceToken}`
          }
        }
      );

      return response.data.logs || [];
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
   * Delete a log
   *
   * @param logName Log name
   * @param resourceToken Resource token
   * @returns Promise that resolves when the log is deleted
   */
  public async deleteLog(logName: string, resourceToken: string): Promise<void> {
    try {
      await this.apiClient.delete(
        `${this.baseUrl}/logs/${logName}`,
        {
          headers: {
            Authorization: `Bearer ${resourceToken}`
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
