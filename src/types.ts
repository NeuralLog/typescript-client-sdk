/**
 * Encrypted Key Encryption Key (KEK)
 */
export interface EncryptedKEK {
  /**
   * Whether the KEK is encrypted
   */
  encrypted: boolean;

  /**
   * Encryption algorithm
   */
  algorithm: string;

  /**
   * Initialization vector
   */
  iv: string;

  /**
   * Encrypted data
   */
  data: string;

  /**
   * KEK version identifier
   */
  version?: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  /**
   * Whether the login was successful
   */
  success: boolean;

  /**
   * Authentication token
   */
  token: string;

  /**
   * User ID
   */
  userId: string;

  /**
   * Tenant ID
   */
  tenantId?: string;
}

/**
 * API key permission
 */
export type ApiKeyPermission =
  | 'logs:read'
  | 'logs:write'
  | 'logs:delete'
  | 'logs:search'
  | 'logs:admin'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'users:admin'
  | 'api-keys:read'
  | 'api-keys:write'
  | 'api-keys:delete'
  | 'api-keys:admin';

/**
 * API key information
 */
export interface ApiKeyInfo {
  /**
   * API key ID
   */
  id: string;

  /**
   * API key name
   */
  name: string;

  /**
   * API key permissions
   */
  permissions: ApiKeyPermission[];

  /**
   * API key creation date
   */
  created_at: string;

  /**
   * API key last used date
   */
  last_used_at?: string;
}

/**
 * Create API key request
 */
export interface CreateApiKeyRequest {
  /**
   * API key name
   */
  name: string;

  /**
   * API key ID
   */
  keyId: string;

  /**
   * API key verification hash
   */
  verificationHash: string;

  /**
   * API key permissions
   */
  permissions: ApiKeyPermission[];
}

/**
 * Serialized secret share for storage or transmission
 */
export interface SerializedSecretShare {
  /**
   * The x-coordinate of the share
   */
  x: number;

  /**
   * The y-coordinate of the share (the actual share value) as a Base64 string
   */
  y: string;
}

/**
 * Log encryption information
 */
export interface LogEncryptionInfo {
  /**
   * Whether the log is encrypted
   */
  encrypted: boolean;

  /**
   * Encryption algorithm
   */
  algorithm: string;

  /**
   * KEK version used to encrypt the log
   */
  kekVersion: string;
}
