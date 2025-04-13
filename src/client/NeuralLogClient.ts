import axios, { AxiosInstance } from 'axios';
import { LogsService } from '../logs/LogsService';
import { AuthService } from '../auth/AuthService';
import { CryptoService } from '../crypto/CryptoService';
import { KeyHierarchy } from '../crypto/KeyHierarchy';
import { LogError } from '../errors';

/**
 * NeuralLog client configuration
 */
export interface NeuralLogClientConfig {
  /**
   * Tenant ID
   */
  tenantId?: string;
  
  /**
   * API URL
   */
  apiUrl?: string;
  
  /**
   * Auth service URL
   */
  authUrl?: string;
  
  /**
   * Logs service URL
   */
  logsUrl?: string;
}

/**
 * NeuralLog client
 * 
 * This is the main entry point for interacting with the NeuralLog system.
 * It provides methods for logging, searching, and retrieving logs with
 * zero-knowledge encryption.
 */
export class NeuralLogClient {
  private tenantId: string;
  private apiClient: AxiosInstance;
  private authService: AuthService;
  private logsService: LogsService;
  private cryptoService: CryptoService;
  private keyHierarchy: KeyHierarchy;
  
  private apiKey: string | null = null;
  private authenticated: boolean = false;
  
  /**
   * Create a new NeuralLogClient
   * 
   * @param config Client configuration
   */
  constructor(config: NeuralLogClientConfig = {}) {
    this.tenantId = config.tenantId || 'default';
    
    // Create API client
    this.apiClient = axios.create({
      baseURL: config.apiUrl || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Create services
    this.authService = new AuthService(
      config.authUrl || 'http://localhost:3000',
      this.apiClient
    );
    
    this.logsService = new LogsService(
      config.logsUrl || 'http://localhost:3030',
      this.apiClient
    );
    
    // Create crypto service and key hierarchy
    this.cryptoService = new CryptoService();
    this.keyHierarchy = new KeyHierarchy();
  }
  
  /**
   * Authenticate with an API key
   * 
   * @param apiKey API key
   * @returns Promise that resolves to true if authentication was successful
   */
  public async authenticateWithApiKey(apiKey: string): Promise<boolean> {
    try {
      const valid = await this.authService.validateApiKey(apiKey, this.tenantId);
      
      if (valid) {
        this.apiKey = apiKey;
        this.authenticated = true;
        return true;
      }
      
      return false;
    } catch (error) {
      throw new LogError(
        `Failed to authenticate with API key: ${error instanceof Error ? error.message : String(error)}`,
        'authentication_failed'
      );
    }
  }
  
  /**
   * Check if the client is authenticated
   * 
   * @returns True if the client is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authenticated;
  }
  
  /**
   * Log data to the specified log
   * 
   * @param logName Log name
   * @param data Log data
   * @returns Promise that resolves to the log ID
   */
  public async log(logName: string, data: Record<string, any>): Promise<string> {
    this.checkAuthentication();
    
    try {
      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);
      
      // Encrypt data
      const logKey = await this.keyHierarchy.deriveLogEncryptionKey(this.apiKey!, this.tenantId, logName);
      const encryptedData = await this.cryptoService.encryptLogData(data, logKey);
      
      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        `logs/${encryptedLogName}`
      );
      
      // Send log to server
      return await this.logsService.appendLog(encryptedLogName, encryptedData, resourceToken);
    } catch (error) {
      throw new LogError(
        `Failed to log data: ${error instanceof Error ? error.message : String(error)}`,
        'log_failed'
      );
    }
  }
  
  /**
   * Get logs from the specified log
   * 
   * @param logName Log name
   * @param options Options for getting logs
   * @returns Promise that resolves to the logs
   */
  public async getLogs(
    logName: string,
    options: { limit?: number } = {}
  ): Promise<Record<string, any>[]> {
    this.checkAuthentication();
    
    try {
      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);
      
      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
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
      const logKey = await this.keyHierarchy.deriveLogEncryptionKey(this.apiKey!, this.tenantId, logName);
      
      return Promise.all(
        encryptedLogs.map(async (encryptedLog) => {
          return await this.cryptoService.decryptLogData(encryptedLog.data, logKey);
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
   * Search logs in the specified log
   * 
   * @param logName Log name
   * @param options Search options
   * @returns Promise that resolves to the search results
   */
  public async searchLogs(
    logName: string,
    options: {
      query: string;
      limit?: number;
      startTime?: string;
      endTime?: string;
      fields?: string[];
    }
  ): Promise<Record<string, any>[]> {
    this.checkAuthentication();
    
    try {
      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);
      
      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        `logs/${encryptedLogName}`
      );
      
      // Generate search tokens
      const searchKey = await this.keyHierarchy.deriveLogSearchKey(this.apiKey!, this.tenantId, logName);
      const searchTokens = await this.cryptoService.generateSearchTokens(options.query, searchKey);
      
      // Search logs on server
      const encryptedResults = await this.logsService.searchLogs(
        encryptedLogName,
        searchTokens,
        options.limit || 100,
        resourceToken
      );
      
      // Decrypt results
      const logKey = await this.keyHierarchy.deriveLogEncryptionKey(this.apiKey!, this.tenantId, logName);
      
      return Promise.all(
        encryptedResults.map(async (encryptedResult) => {
          return await this.cryptoService.decryptLogData(encryptedResult.data, logKey);
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
   * Get all log names
   * 
   * @returns Promise that resolves to the log names
   */
  public async getLogNames(): Promise<string[]> {
    this.checkAuthentication();
    
    try {
      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        'logs'
      );
      
      // Get encrypted log names from server
      const encryptedLogNames = await this.logsService.getLogNames(resourceToken);
      
      // Decrypt log names
      return Promise.all(
        encryptedLogNames.map(async (encryptedLogName) => {
          return await this.decryptLogName(encryptedLogName);
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
   * Clear a log
   * 
   * @param logName Log name
   * @returns Promise that resolves when the log is cleared
   */
  public async clearLog(logName: string): Promise<void> {
    this.checkAuthentication();
    
    try {
      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);
      
      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        `logs/${encryptedLogName}`
      );
      
      // Clear log on server
      await this.logsService.clearLog(encryptedLogName, resourceToken);
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
   * @returns Promise that resolves when the log is deleted
   */
  public async deleteLog(logName: string): Promise<void> {
    this.checkAuthentication();
    
    try {
      // Encrypt log name
      const encryptedLogName = await this.encryptLogName(logName);
      
      // Get resource token
      const resourceToken = await this.authService.getResourceToken(
        this.apiKey!,
        this.tenantId,
        `logs/${encryptedLogName}`
      );
      
      // Delete log on server
      await this.logsService.deleteLog(encryptedLogName, resourceToken);
    } catch (error) {
      throw new LogError(
        `Failed to delete log: ${error instanceof Error ? error.message : String(error)}`,
        'delete_log_failed'
      );
    }
  }
  
  /**
   * Logout
   * 
   * @returns Promise that resolves when the client is logged out
   */
  public async logout(): Promise<void> {
    this.apiKey = null;
    this.authenticated = false;
  }
  
  /**
   * Get the direct logs service
   * 
   * This is used by the migration script to access the logs service directly.
   * 
   * @returns The logs service
   */
  public getDirectLogsService(): LogsService {
    return this.logsService;
  }
  
  /**
   * Encrypt a log name
   * 
   * @param logName Log name
   * @returns Promise that resolves to the encrypted log name
   */
  private async encryptLogName(logName: string): Promise<string> {
    const logNameKey = await this.keyHierarchy.deriveLogNameKey(this.apiKey!, this.tenantId);
    return await this.cryptoService.encryptLogName(logName, logNameKey);
  }
  
  /**
   * Decrypt a log name
   * 
   * @param encryptedLogName Encrypted log name
   * @returns Promise that resolves to the decrypted log name
   */
  private async decryptLogName(encryptedLogName: string): Promise<string> {
    const logNameKey = await this.keyHierarchy.deriveLogNameKey(this.apiKey!, this.tenantId);
    return await this.cryptoService.decryptLogName(encryptedLogName, logNameKey);
  }
  
  /**
   * Check if the client is authenticated
   * 
   * @throws LogError if the client is not authenticated
   */
  private checkAuthentication(): void {
    if (!this.authenticated || !this.apiKey) {
      throw new LogError('Not authenticated', 'not_authenticated');
    }
  }
}
