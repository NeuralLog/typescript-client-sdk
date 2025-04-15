/**
 * API response types for the NeuralLog API
 */

/**
 * API key challenge
 */
export interface ApiKeyChallenge {
  /**
   * Challenge string
   */
  challenge: string;

  /**
   * Expiration time in seconds
   */
  expiresIn: number;
}

/**
 * API key challenge verification
 */
export interface ApiKeyChallengeVerification {
  /**
   * Whether the challenge response is valid
   */
  valid: boolean;

  /**
   * User ID
   */
  userId?: string;

  /**
   * Tenant ID
   */
  tenantId?: string;

  /**
   * Scopes
   */
  scopes?: string[];
}

/**
 * User profile
 */
export interface UserProfile {
  /**
   * User ID
   */
  id: string;

  /**
   * Email
   */
  email: string;

  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * Name
   */
  name?: string;

  /**
   * Username (optional)
   */
  username?: string;

  /**
   * First name (optional)
   */
  first_name?: string;

  /**
   * Last name (optional)
   */
  last_name?: string;

  /**
   * User roles (optional)
   */
  roles?: string[];
}

/**
 * Login
 */
export interface Login {
  /**
   * Authentication token
   */
  token: string;

  /**
   * User ID
   */
  user_id: string;

  /**
   * Tenant ID
   */
  tenant_id: string;

  /**
   * User profile
   */
  user?: UserProfile;
}



/**
 * API key
 */
export interface ApiKey {
  /**
   * API key ID
   */
  id: string;

  /**
   * User ID
   */
  userId: string;

  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * API key name
   */
  name: string;

  /**
   * API key scopes
   */
  scopes: string[];

  /**
   * Verification hash for the API key
   */
  verificationHash: string;

  /**
   * When the API key was created
   */
  createdAt: Date;

  /**
   * When the API key expires
   */
  expiresAt: Date;

  /**
   * Whether the API key is revoked
   */
  revoked: boolean;

  /**
   * When the API key was revoked
   */
  revokedAt?: Date;

  /**
   * Last used timestamp
   */
  lastUsedAt?: Date;
}

/**
 * Keys list
 */
export interface KeysList {
  /**
   * API keys
   */
  api_keys: ApiKey[];
}

/**
 * Permission check
 */
export interface PermissionCheck {
  /**
   * Whether the user has permission
   */
  allowed: boolean;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  /**
   * Whether the token is valid
   */
  valid: boolean;

  /**
   * User information (if token is valid)
   */
  user?: UserProfile;
}

/**
 * Token exchange result
 */
export interface TokenExchangeResult {
  /**
   * The exchanged token
   */
  token: string;
}

/**
 * Resource token verification result
 */
export interface ResourceTokenVerificationResult {
  /**
   * Whether the token is valid
   */
  valid: boolean;

  /**
   * User ID
   */
  userId: string;

  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * Resource
   */
  resource: string;
}

/**
 * Operation result
 */
export interface OperationResult {
  /**
   * Success message
   */
  message: string;
}

/**
 * KEK blob
 */
export interface KEKBlob {
  /**
   * User ID
   */
  userId: string;

  /**
   * KEK version ID
   */
  kekVersionId: string;

  /**
   * Encrypted blob
   */
  encryptedBlob: string;

  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * Creation date
   */
  createdAt: string;

  /**
   * Update date
   */
  updatedAt: string;
}

/**
 * KEK blobs
 */
export interface KEKBlobs {
  /**
   * KEK blobs
   */
  blobs: KEKBlob[];
}

/**
 * KEK version
 */
export interface KEKVersion {
  /**
   * KEK version ID
   */
  id: string;

  /**
   * Creation date
   */
  createdAt: string;

  /**
   * Created by user ID
   */
  createdBy: string;

  /**
   * Status
   */
  status: 'active' | 'decrypt-only' | 'deprecated';

  /**
   * Reason for creation
   */
  reason: string;

  /**
   * Tenant ID
   */
  tenantId: string;
}

/**
 * KEK versions
 */
export interface KEKVersions {
  /**
   * KEK versions
   */
  versions: KEKVersion[];
}

/**
 * Admin share
 */
export interface AdminShare {
  /**
   * Admin share ID
   */
  id: string;

  /**
   * User ID
   */
  user_id: string;

  /**
   * Encrypted share
   */
  encrypted_share: string;

  /**
   * Creation date
   */
  created_at: string;
}

/**
 * Admin shares
 */
export interface AdminShares {
  /**
   * Admin shares
   */
  shares: AdminShare[];
}

/**
 * Admin share request
 */
export interface AdminShareRequest {
  /**
   * Candidate user ID
   */
  candidate_id: string;

  /**
   * Encrypted share data
   */
  encrypted_share: string;

  /**
   * Public key used for encryption
   */
  public_key: string;

  /**
   * Threshold (number of shares required)
   */
  threshold: number;
}

/**
 * Admin promotion request
 */
export interface AdminPromotionRequest {
  /**
   * Request ID
   */
  id: string;

  /**
   * Candidate user ID
   */
  candidate_id: string;

  /**
   * Candidate username
   */
  candidate_name: string;

  /**
   * Requester user ID
   */
  requester_id: string;

  /**
   * Requester username
   */
  requester_name: string;

  /**
   * Request timestamp
   */
  timestamp: string;

  /**
   * Request status
   */
  status: 'pending' | 'approved' | 'rejected';

  /**
   * Threshold (number of approvals required)
   */
  threshold: number;

  /**
   * Number of approvals received
   */
  approvals: number;
}

/**
 * API key info
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
   * Creation timestamp
   */
  created_at: string;

  /**
   * Expiration timestamp (if applicable)
   */
  expires_at?: string;

  /**
   * Whether the API key is revoked
   */
  revoked: boolean;
}

/**
 * API key permission
 */
export interface ApiKeyPermission {
  /**
   * Action (e.g., 'read', 'write')
   */
  action: string;

  /**
   * Resource (e.g., 'logs', 'logs/my-log')
   */
  resource: string;
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
   * Expiration time in days (optional)
   */
  expires_in?: number;

  /**
   * Permissions for this API key
   */
  permissions?: ApiKeyPermission[];
}

/**
 * Encrypted KEK
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
   * Encrypted KEK data
   */
  data: string;

  /**
   * KEK version
   */
  version?: string;
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

/**
 * Log information
 */
export interface Log {
  /**
   * Log ID
   */
  id: string;

  /**
   * Log name
   */
  name: string;

  /**
   * Log description
   */
  description?: string;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Last update timestamp
   */
  updatedAt: string;

  /**
   * Log data
   */
  data?: any;

  /**
   * Log timestamp
   */
  timestamp?: string;

  /**
   * Log encryption information
   */
  encryptionInfo?: LogEncryptionInfo;
}

/**
 * Log entry
 */
export interface LogEntry {
  /**
   * Entry ID
   */
  id: string;

  /**
   * Log ID
   */
  logId: string;

  /**
   * Entry data
   */
  data: string;

  /**
   * Entry timestamp
   */
  timestamp: string;

  /**
   * Entry metadata
   */
  metadata?: Record<string, string>;
}

/**
 * Log search options
 */
export interface LogSearchOptions {
  /**
   * Search query
   */
  query?: string;

  /**
   * Start time
   */
  startTime?: string;

  /**
   * End time
   */
  endTime?: string;

  /**
   * Result limit
   */
  limit?: number;

  /**
   * Result offset
   */
  offset?: number;
}

/**
 * Log statistics
 */
export interface LogStatistics {
  /**
   * Total number of entries
   */
  totalEntries: number;

  /**
   * First entry timestamp
   */
  firstEntryTimestamp?: string;

  /**
   * Last entry timestamp
   */
  lastEntryTimestamp?: string;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  /**
   * Result items
   */
  items: T[];

  /**
   * Result entries (alias for items for backward compatibility)
   */
  entries?: T[];

  /**
   * Total count
   */
  total: number;

  /**
   * Total count (alias for total for backward compatibility)
   */
  totalCount?: number;

  /**
   * Result limit
   */
  limit: number;

  /**
   * Result offset
   */
  offset: number;

  /**
   * Whether there are more results
   */
  hasMore?: boolean;
}

/**
 * Log create options
 */
export interface LogCreateOptions {
  /**
   * Log name
   */
  name?: string;

  /**
   * Log description
   */
  description?: string;
}

/**
 * Log update options
 */
export interface LogUpdateOptions {
  /**
   * Log name
   */
  name?: string;

  /**
   * Log description
   */
  description?: string;
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
 * Public key information
 */
export interface PublicKey {
  /**
   * User ID
   */
  userId: string;

  /**
   * Public key data
   */
  publicKey: string;

  /**
   * Purpose of the public key (e.g., 'admin-promotion')
   */
  purpose: string;

  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Update timestamp
   */
  updatedAt: string;
}

/**
 * User information
 */
export interface User {
  /**
   * User ID
   */
  id: string;

  /**
   * User email
   */
  email: string;

  /**
   * User name
   */
  name?: string;

  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * User role
   */
  role?: string;

  /**
   * User metadata
   */
  metadata?: Record<string, any>;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Update timestamp
   */
  updatedAt: string;
}
