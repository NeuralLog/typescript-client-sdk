import { CryptoService } from '../crypto/CryptoService';
import { LogsService } from '../logs/LogsService';
import { AuthService } from '../auth/AuthService';
import { LogError } from '../errors';

/**
 * Manager for log operations
 */
export class LogManager {
  private cryptoService: CryptoService;
  private logsService: LogsService;
  private authService: AuthService;
  private tenantId: string;
  
  /**
   * Create a new LogManager
   * 
   * @param cryptoService Crypto service
   * @param logsService Logs service
   * @param authService Auth service
   * @param tenantId Tenant ID
   */
  constructor(
    cryptoService: CryptoService,
    logsService: LogsService,
    authService: AuthService,
    tenantId: string
  ) {
    this.cryptoService = cryptoService;
    this.logsService = logsService;
    this.authService = authService;
    this.tenantId = tenantId;
  }
  
  /**
   * Log data to the specified log
   * 
   * @param logName Log name
   * @param data Log data
   * @param options Options for logging
   * @param authToken Authentication token or API key
   * @returns Promise that resolves to the log ID
   */
  public async log(
    logName: string,
    data: Record<string, any>,
    options: { kekVersion?: string } = {},
    authToken: string
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
   * @param authToken Authentication token or API key
   * @returns Promise that resolves to the logs
   */
  public async getLogs(
    logName: string,
    options: { limit?: number } = {},
    authToken: string
  ): Promise<Record<string, any>[]> {
    try {
      // Encrypt log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);
      
      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        authToken,
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
      return Promise.all(
        encryptedLogs.map(async (encryptedLog) => {
          try {
            // Decrypt data with the appropriate KEK version
            return await this.cryptoService.decryptLogData(encryptedLog.data);
          } catch (decryptError) {
            console.error(`Failed to decrypt log: ${decryptError}`);
            
            // If we get here, we couldn't decrypt the log
            return {
              error: 'Failed to decrypt log',
              encryptedWithVersion: encryptedLog.data.kekVersion || 'unknown'
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
   * @param authToken Authentication token or API key
   * @returns Promise that resolves to the search results
   */
  public async searchLogs(
    logName: string,
    options: { query: string; limit?: number } = { query: '' },
    authToken: string
  ): Promise<Record<string, any>[]> {
    try {
      // Encrypt log name
      const encryptedLogName = await this.cryptoService.encryptLogName(logName);
      
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
            console.error(`Failed to decrypt search result: ${decryptError}`);
            
            // If we get here, we couldn't decrypt the log
            return {
              error: 'Failed to decrypt search result',
              encryptedWithVersion: encryptedResult.data.kekVersion || 'unknown'
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
   * Get all logs
   * 
   * @param options Options for getting all logs
   * @param authToken Authentication token or API key
   * @returns Promise that resolves to the logs
   */
  public async getAllLogs(
    options: { limit?: number } = {},
    authToken: string
  ): Promise<Record<string, any>[]> {
    try {
      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        authToken,
        this.tenantId,
        'logs'
      );
      
      // Get all logs from server
      const encryptedLogs = await this.logsService.getAllLogs(
        options.limit || 100,
        resourceToken
      );
      
      // Process logs
      const processedLogs = [];
      
      for (const encryptedLog of encryptedLogs) {
        try {
          // Decrypt log name
          const logName = await this.cryptoService.decryptLogName(encryptedLog.name);
          
          // Decrypt log data
          const logData = await this.cryptoService.decryptLogData(encryptedLog.data);
          
          processedLogs.push({
            name: logName,
            data: logData,
            timestamp: encryptedLog.timestamp
          });
        } catch (decryptError) {
          console.error(`Failed to decrypt log: ${decryptError}`);
          
          processedLogs.push({
            name: encryptedLog.name,
            error: 'Failed to decrypt log',
            encryptedWithVersion: encryptedLog.data.kekVersion || 'unknown',
            timestamp: encryptedLog.timestamp
          });
        }
      }
      
      return processedLogs;
    } catch (error) {
      throw new LogError(
        `Failed to get all logs: ${error instanceof Error ? error.message : String(error)}`,
        'get_all_logs_failed'
      );
    }
  }
}
