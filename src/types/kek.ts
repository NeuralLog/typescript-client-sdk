/**
 * Interface for a KEK version
 */
export interface KEKVersion {
  /**
   * Version identifier
   */
  id: string;
  
  /**
   * Creation timestamp
   */
  createdAt: string;
  
  /**
   * User ID of the admin who created this version
   */
  createdBy: string;
  
  /**
   * Status of this KEK version
   */
  status: 'active' | 'decrypt-only' | 'deprecated';
  
  /**
   * Reason for creating this version
   */
  reason: string;
}

/**
 * Interface for log encryption information
 */
export interface LogEncryptionInfo {
  /**
   * KEK version used to encrypt this log
   */
  kekVersion: string;
  
  /**
   * Initialization vector (Base64)
   */
  iv: string;
  
  /**
   * Encryption algorithm
   */
  algorithm: string;
}

/**
 * Interface for an encrypted KEK
 */
export interface EncryptedKEK {
  /**
   * Encrypted KEK data (Base64)
   */
  data: string;
  
  /**
   * Initialization vector (Base64)
   */
  iv: string;
  
  /**
   * KEK version
   */
  version: string;
}
