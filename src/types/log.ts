/**
 * Interface for a log entry
 */
export interface LogEntry {
  /**
   * Log data
   */
  data: any;
  
  /**
   * Timestamp
   */
  timestamp: string;
  
  /**
   * Log ID
   */
  id: string;
}

/**
 * Interface for an encrypted log entry
 */
export interface EncryptedLogEntry {
  /**
   * Encrypted log data
   */
  data: string;
  
  /**
   * Initialization vector
   */
  iv: string;
  
  /**
   * Encryption algorithm
   */
  algorithm: string;
  
  /**
   * KEK version used to encrypt this log
   */
  kekVersion: string;
  
  /**
   * Timestamp
   */
  timestamp: string;
  
  /**
   * Log ID
   */
  id: string;
}
