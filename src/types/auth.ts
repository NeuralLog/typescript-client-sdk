/**
 * Auth Service API Types
 * 
 * THIS FILE IS AUTO-GENERATED - DO NOT EDIT DIRECTLY
 * Generated from OpenAPI schema
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
   * @format date-time
   */
  created_at: string;
}

export interface AdminShares {
  /**
   * Admin shares
   */
  shares: AdminShare[];
}

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
   * @format date-time
   */
  timestamp: string;
  /**
   * Request status
   */
  status: "pending" | "approved" | "rejected";
  /**
   * Threshold (number of approvals required)
   */
  threshold: number;
  /**
   * Number of approvals received
   */
  approvals: number;
}

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
   * @format date-time
   */
  createdAt: string;
  /**
   * Update timestamp
   * @format date-time
   */
  updatedAt: string;
}

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
   * @format date-time
   */
  createdAt: string;
  /**
   * When the API key expires
   * @format date-time
   */
  expiresAt: string;
  /**
   * Whether the API key is revoked
   */
  revoked: boolean;
  /**
   * When the API key was revoked
   * @format date-time
   */
  revokedAt?: string;
  /**
   * Last used timestamp
   * @format date-time
   */
  lastUsedAt?: string;
}

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
   * @format date-time
   */
  created_at: string;
  /**
   * Expiration timestamp (if applicable)
   * @format date-time
   */
  expires_at?: string;
  /**
   * Whether the API key is revoked
   */
  revoked: boolean;
}

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

export interface KeysList {
  /**
   * API keys
   */
  api_keys: ApiKey[];
}

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

export interface PermissionCheck {
  /**
   * Whether the user has permission
   */
  allowed: boolean;
}

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

export interface TokenExchangeResult {
  /**
   * The exchanged token
   */
  token: string;
}

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
   * @format date-time
   */
  createdAt: string;
  /**
   * Update date
   * @format date-time
   */
  updatedAt: string;
}

export interface KEKBlobs {
  /**
   * KEK blobs
   */
  blobs: KEKBlob[];
}

export interface KEKVersion {
  /**
   * KEK version ID
   */
  id: string;
  /**
   * Creation date
   * @format date-time
   */
  createdAt: string;
  /**
   * Created by user ID
   */
  createdBy: string;
  /**
   * Status
   */
  status: "active" | "decrypt-only" | "deprecated";
  /**
   * Reason for creation
   */
  reason: string;
  /**
   * Tenant ID
   */
  tenantId: string;
}

export interface KEKVersions {
  /**
   * KEK versions
   */
  versions: KEKVersion[];
}

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

export interface Tenant {
  /**
   * Tenant ID
   */
  tenantId: string;
  /**
   * Admin user ID
   */
  adminUserId: string;
}

export interface Role {
  /**
   * Role ID
   */
  id: string;
  /**
   * Role name
   */
  name: string;
  /**
   * Role description
   */
  description?: string;
  /**
   * Role permissions
   */
  permissions: string[];
  /**
   * Roles this role inherits from
   */
  inherits?: string[];
  /**
   * Tenant ID
   */
  tenantId: string;
}

export interface User {
  /**
   * User ID
   */
  id: string;
  /**
   * User email
   * @format email
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
   * Whether the user is an admin
   */
  isAdmin?: boolean;
  /**
   * Creation date
   * @format date-time
   */
  createdAt: string;
}

export interface UserProfile {
  /**
   * User ID
   */
  id: string;
  /**
   * Email
   * @format email
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

