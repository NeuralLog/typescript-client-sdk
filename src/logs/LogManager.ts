import { LogError } from '../errors';
import { LogsService } from './LogsService';
import { CryptoService } from '../crypto/CryptoService';
import { AuthManager } from '../auth/AuthManager';
import {
  Log,
  LogEntry,
  LogSearchOptions,
  LogStatistics,
  PaginatedResult,
  LogCreateOptions,
  LogUpdateOptions
} from '../types';

/**
 * Manager for log operations
 */
export class LogManager {
  /**
   * Logs service for API calls
   */
  private logsService: LogsService;

  /**
   * Crypto service for encryption/decryption
   */
  private cryptoService: CryptoService;

  /**
   * Auth manager
   */
  private authManager: AuthManager;

  /**
   * Create a new LogManager
   * 
   * @param logsService Logs service
   * @param cryptoService Crypto service
   * @param authManager Auth manager
   */
  constructor(
    logsService: LogsService,
    cryptoService: CryptoService,
    authManager: AuthManager
  ) {
    this.logsService = logsService;
    this.cryptoService = cryptoService;
    this.authManager = authManager;
  }

  /**
   * Create a new log
   * 
   * @param name Log name
   * @param options Log creation options
   * @returns Promise that resolves to the created log
   */
  public async createLog(name: string, options: LogCreateOptions = {}): Promise<Log> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      // Encrypt the log name
      const encryptedName = await this.cryptoService.encryptLogName(name);
      
      // Create the log
      const log = await this.logsService.createLog(
        authToken,
        encryptedName,
        options
      );
      
      // Decrypt the log name
      const decryptedLog = {
        ...log,
        name: await this.cryptoService.decryptLogName(log.name)
      };
      
      return decryptedLog;
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
   * @returns Promise that resolves to the logs
   */
  public async getLogs(): Promise<Log[]> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Get the logs
      const logs = await this.logsService.getLogs(authToken);
      
      // Decrypt the log names
      const decryptedLogs = await Promise.all(
        logs.map(async (log) => ({
          ...log,
          name: await this.cryptoService.decryptLogName(log.name)
        }))
      );
      
      return decryptedLogs;
    } catch (error) {
      throw new LogError(
        `Failed to get logs: ${error instanceof Error ? error.message : String(error)}`,
        'get_logs_failed'
      );
    }
  }

  /**
   * Get a log by name
   * 
   * @param name Log name
   * @returns Promise that resolves to the log
   */
  public async getLog(name: string): Promise<Log> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Encrypt the log name
      const encryptedName = await this.cryptoService.encryptLogName(name);
      
      // Get the log
      const log = await this.logsService.getLog(authToken, encryptedName);
      
      // Decrypt the log name
      const decryptedLog = {
        ...log,
        name: await this.cryptoService.decryptLogName(log.name)
      };
      
      return decryptedLog;
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
   * @param name Log name
   * @param options Log update options
   * @returns Promise that resolves to the updated log
   */
  public async updateLog(name: string, options: LogUpdateOptions): Promise<Log> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Encrypt the log name
      const encryptedName = await this.cryptoService.encryptLogName(name);
      
      // Update the log
      const log = await this.logsService.updateLog(
        authToken,
        encryptedName,
        options
      );
      
      // Decrypt the log name
      const decryptedLog = {
        ...log,
        name: await this.cryptoService.decryptLogName(log.name)
      };
      
      return decryptedLog;
    } catch (error) {
      throw new LogError(
        `Failed to update log: ${error instanceof Error ? error.message : String(error)}`,
        'update_log_failed'
      );
    }
  }

  /**
   * Delete a log
   * 
   * @param name Log name
   * @returns Promise that resolves when the log is deleted
   */
  public async deleteLog(name: string): Promise<void> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Encrypt the log name
      const encryptedName = await this.cryptoService.encryptLogName(name);
      
      // Delete the log
      await this.logsService.deleteLog(authToken, encryptedName);
    } catch (error) {
      throw new LogError(
        `Failed to delete log: ${error instanceof Error ? error.message : String(error)}`,
        'delete_log_failed'
      );
    }
  }

  /**
   * Append a log entry
   * 
   * @param logName Log name
   * @param data Log entry data
   * @returns Promise that resolves to the log entry ID
   */
  public async appendLogEntry(logName: string, data: any): Promise<string> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Encrypt the log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);
      
      // Encrypt the log data
      const encryptedData = await this.cryptoService.encryptLogData(data);
      
      // Generate search tokens
      const searchTokens = await this.cryptoService.generateSearchTokens(data);
      
      // Append the log entry
      const result = await this.logsService.appendLogEntry(
        authToken,
        encryptedLogName,
        encryptedData,
        {
          searchTokens,
          encryptionInfo: {
            version: this.cryptoService.getCurrentKEKVersion(),
            algorithm: 'AES-GCM'
          }
        }
      );
      
      return result.id;
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
   * @param logName Log name
   * @param limit Maximum number of entries to return
   * @param offset Offset for pagination
   * @returns Promise that resolves to the log entries
   */
  public async getLogEntries(
    logName: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResult<LogEntry>> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Encrypt the log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);
      
      // Get the log entries
      const result = await this.logsService.getLogEntries(
        authToken,
        encryptedLogName,
        limit,
        offset
      );
      
      // Decrypt the log entries
      const decryptedEntries = await Promise.all(
        result.entries.map(async (entry) => ({
          ...entry,
          data: await this.cryptoService.decryptLogData(entry.data)
        }))
      );
      
      return {
        ...result,
        entries: decryptedEntries
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
   * @param logName Log name
   * @param entryId Log entry ID
   * @returns Promise that resolves to the log entry
   */
  public async getLogEntry(logName: string, entryId: string): Promise<LogEntry> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Encrypt the log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);
      
      // Get the log entry
      const entry = await this.logsService.getLogEntry(
        authToken,
        encryptedLogName,
        entryId
      );
      
      // Decrypt the log entry
      const decryptedEntry = {
        ...entry,
        data: await this.cryptoService.decryptLogData(entry.data)
      };
      
      return decryptedEntry;
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
   * @param logName Log name
   * @param options Search options
   * @returns Promise that resolves to the search results
   */
  public async searchLogEntries(
    logName: string,
    options: LogSearchOptions
  ): Promise<PaginatedResult<LogEntry>> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Encrypt the log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);
      
      // Generate search tokens
      const searchTokens = options.query
        ? await this.cryptoService.generateSearchTokens(options.query)
        : [];
      
      // Search the log entries
      const result = await this.logsService.searchLogEntries(
        authToken,
        encryptedLogName,
        {
          ...options,
          searchTokens
        }
      );
      
      // Decrypt the log entries
      const decryptedEntries = await Promise.all(
        result.entries.map(async (entry) => ({
          ...entry,
          data: await this.cryptoService.decryptLogData(entry.data)
        }))
      );
      
      return {
        ...result,
        entries: decryptedEntries
      };
    } catch (error) {
      throw new LogError(
        `Failed to search log entries: ${error instanceof Error ? error.message : String(error)}`,
        'search_log_entries_failed'
      );
    }
  }

  /**
   * Get log statistics
   * 
   * @param logName Log name
   * @returns Promise that resolves to the log statistics
   */
  public async getLogStatistics(logName: string): Promise<LogStatistics> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Encrypt the log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);
      
      // Get the log statistics
      return await this.logsService.getLogStatistics(
        authToken,
        encryptedLogName
      );
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
   * @param logName Log name
   * @param entries Log entries
   * @returns Promise that resolves to the log entry IDs
   */
  public async batchAppendLogEntries(
    logName: string,
    entries: any[]
  ): Promise<string[]> {
    try {
      const authToken = this.authManager.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }
      
      // Encrypt the log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);
      
      // Encrypt the log entries
      const encryptedEntries = await Promise.all(
        entries.map(async (data) => {
          const encryptedData = await this.cryptoService.encryptLogData(data);
          const searchTokens = await this.cryptoService.generateSearchTokens(data);
          
          return {
            data: encryptedData,
            searchTokens,
            encryptionInfo: {
              version: this.cryptoService.getCurrentKEKVersion(),
              algorithm: 'AES-GCM'
            }
          };
        })
      );
      
      // Batch append the log entries
      const result = await this.logsService.batchAppendLogEntries(
        authToken,
        encryptedLogName,
        encryptedEntries
      );
      
      return result.entries.map(entry => entry.id);
    } catch (error) {
      throw new LogError(
        `Failed to batch append log entries: ${error instanceof Error ? error.message : String(error)}`,
        'batch_append_log_entries_failed'
      );
    }
  }
}
