import { AxiosInstance } from 'axios';
import {
  Login,
  ApiKey,
  KEKBlob,
  KEKVersion,
  AdminShareRequest,
  AdminShare,
  UserProfile,
  ApiKeyChallenge,
  ApiKeyChallengeVerification,
  ResourceTokenVerificationResult,
  SerializedSecretShare
} from '../types';
import { AuthServiceImpl } from './AuthServiceImpl';

/**
 * Service for interacting with the NeuralLog auth service
 */
export class AuthService {
  private baseUrl: string;
  private serviceImpl: AuthServiceImpl;

  /**
   * Create a new AuthService
   *
   * @param baseUrl Base URL of the auth service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    this.baseUrl = baseUrl;
    this.serviceImpl = new AuthServiceImpl(baseUrl, apiClient);
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
    this.serviceImpl.setBaseUrl(baseUrl);
  }

  /**
   * Login with username and password
   *
   * @param username Username
   * @param password Password
   * @returns Promise that resolves to the login response
   */
  public async login(username: string, password: string): Promise<Login> {
    return this.serviceImpl.login(username, password);
  }

  /**
   * Logout
   *
   * @param authToken Authentication token
   * @returns Promise that resolves when the user is logged out
   */
  public async logout(authToken: string): Promise<void> {
    return this.serviceImpl.logout(authToken);
  }

  /**
   * Change password
   *
   * @param oldPassword Old password
   * @param newPassword New password
   * @param authToken Authentication token
   * @returns Promise that resolves to true if the password was changed successfully
   */
  public async changePassword(
    oldPassword: string,
    newPassword: string,
    authToken: string
  ): Promise<boolean> {
    return this.serviceImpl.changePassword(oldPassword, newPassword, authToken);
  }

  /**
   * Validate an API key
   *
   * @param apiKey API key
   * @param proof Zero-knowledge proof for the API key
   * @returns Promise that resolves to true if the API key is valid
   */
  public async validateApiKey(apiKey: string, proof?: string): Promise<boolean> {
    return this.serviceImpl.validateApiKey(apiKey, proof);
  }

  /**
   * Get a resource token
   *
   * @param apiKey API key
   * @param resource Resource path
   * @returns Promise that resolves to the resource token
   */
  public async getResourceToken(
    apiKey: string,
    resource: string
  ): Promise<string> {
    return this.serviceImpl.getResourceToken(apiKey, resource);
  }

  /**
   * Get a challenge for API key authentication
   *
   * @returns Promise that resolves to the challenge
   */
  public async getApiKeyChallenge(): Promise<ApiKeyChallenge> {
    return this.serviceImpl.getApiKeyChallenge();
  }

  /**
   * Verify a challenge response for API key authentication
   *
   * @param challenge Challenge
   * @param response Challenge response
   * @returns Promise that resolves to the verification result
   */
  public async verifyApiKeyChallenge(challenge: string, response: string): Promise<ApiKeyChallengeVerification> {
    return this.serviceImpl.verifyApiKeyChallenge(challenge, response);
  }

  /**
   * Get user profile
   *
   * @param userId User ID
   * @returns Promise that resolves to the user profile
   */
  public async getUserProfile(userId: string): Promise<UserProfile> {
    return this.serviceImpl.getUserProfile(userId);
  }

  /**
   * Create an API key
   *
   * @param authToken Authentication token
   * @param name API key name
   * @param permissions API key permissions
   * @param expiresIn Expiration time in days (optional)
   * @returns Promise that resolves to the created API key
   */
  public async createApiKey(
    authToken: string,
    name: string,
    permissions: string | string[],
    expiresIn?: number
  ): Promise<ApiKey> {
    return this.serviceImpl.createApiKey(authToken, name, permissions, expiresIn);
  }

  /**
   * Get API keys
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the API keys
   */
  public async getApiKeys(authToken: string): Promise<ApiKey[]> {
    return this.serviceImpl.getApiKeys(authToken);
  }

  /**
   * Revoke an API key
   *
   * @param authToken Authentication token
   * @param keyId API key ID
   * @returns Promise that resolves when the API key is revoked
   */
  public async revokeApiKey(authToken: string, keyId: string): Promise<void> {
    return this.serviceImpl.revokeApiKey(authToken, keyId);
  }

  /**
   * Check permission
   *
   * @param authToken Authentication token
   * @param action Action to check
   * @param resource Resource to check
   * @returns Promise that resolves to true if the user has permission, false otherwise
   */
  public async checkPermission(authToken: string, action: string, resource: string): Promise<boolean> {
    return this.serviceImpl.checkPermission(authToken, action, resource);
  }

  /**
   * Get KEK blobs
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the KEK blobs
   */
  public async getKEKBlobs(authToken: string): Promise<KEKBlob[]> {
    return this.serviceImpl.getKEKBlobs(authToken);
  }

  /**
   * Get KEK versions
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the KEK versions
   */
  public async getKEKVersions(authToken: string): Promise<KEKVersion[]> {
    return this.serviceImpl.getKEKVersions(authToken);
  }

  /**
   * Provision KEK blob
   *
   * @param authToken Authentication token
   * @param userId User ID
   * @param kekVersionId KEK version ID
   * @param encryptedBlob Encrypted blob
   * @returns Promise that resolves when the KEK blob is provisioned
   */
  public async provisionKEKBlob(
    authToken: string,
    userId: string,
    kekVersionId: string,
    encryptedBlob: string
  ): Promise<void> {
    return this.serviceImpl.provisionKEKBlob(authToken, userId, kekVersionId, encryptedBlob);
  }

  /**
   * Provision admin share
   *
   * @param authToken Authentication token
   * @param request Admin share request
   * @returns Promise that resolves to the admin share response
   */
  public async provisionAdminShare(authToken: string, request: AdminShareRequest): Promise<AdminShare> {
    return this.serviceImpl.provisionAdminShare(authToken, request);
  }

  /**
   * Get admin shares
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the admin shares
   */
  public async getAdminShares(authToken: string): Promise<AdminShare[]> {
    return this.serviceImpl.getAdminShares(authToken);
  }

  /**
   * Verify a resource token
   *
   * @param token Resource token to verify
   * @returns Promise that resolves to the verification result
   */
  public async verifyResourceToken(token: string): Promise<ResourceTokenVerificationResult> {
    return this.serviceImpl.verifyResourceToken(token);
  }

  // Public Key Management

  /**
   * Register a public key
   *
   * @param authToken Authentication token
   * @param publicKey Public key data (Base64-encoded)
   * @param purpose Purpose of the public key (e.g., 'admin-promotion')
   * @param metadata Additional metadata (optional)
   * @returns Promise that resolves to the registered public key
   */
  public async registerPublicKey(
    authToken: string,
    publicKey: string,
    purpose: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.serviceImpl.registerPublicKey(authToken, publicKey, purpose, metadata);
  }

  /**
   * Get a user's public key
   *
   * @param authToken Authentication token
   * @param userId User ID
   * @param purpose Purpose of the public key (optional)
   * @returns Promise that resolves to the public key
   */
  public async getPublicKey(
    authToken: string,
    userId: string,
    purpose?: string
  ): Promise<any> {
    return this.serviceImpl.getPublicKey(authToken, userId, purpose);
  }

  /**
   * Update a public key
   *
   * @param authToken Authentication token
   * @param keyId Public key ID
   * @param publicKey Public key data (Base64-encoded)
   * @param metadata Additional metadata (optional)
   * @returns Promise that resolves to the updated public key
   */
  public async updatePublicKey(
    authToken: string,
    keyId: string,
    publicKey: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    return this.serviceImpl.updatePublicKey(authToken, keyId, publicKey, metadata);
  }

  /**
   * Revoke a public key
   *
   * @param authToken Authentication token
   * @param keyId Public key ID
   * @returns Promise that resolves when the public key is revoked
   */
  public async revokePublicKey(
    authToken: string,
    keyId: string
  ): Promise<void> {
    return this.serviceImpl.revokePublicKey(authToken, keyId);
  }

  /**
   * Verify ownership of a public key
   *
   * @param authToken Authentication token
   * @param keyId Public key ID
   * @param challenge Challenge to sign
   * @param signature Signature of the challenge
   * @returns Promise that resolves to the verification result
   */
  public async verifyPublicKey(
    authToken: string,
    keyId: string,
    challenge: string,
    signature: string
  ): Promise<any> {
    return this.serviceImpl.verifyPublicKey(authToken, keyId, challenge, signature);
  }

  // KEK Recovery

  /**
   * Initiate KEK version recovery
   *
   * @param authToken Authentication token
   * @param versionId KEK version ID to recover
   * @param threshold Number of shares required for recovery
   * @param reason Reason for recovery
   * @param expiresIn Expiration time in seconds (optional)
   * @returns Promise that resolves to the recovery session
   */
  public async initiateKEKRecovery(
    authToken: string,
    versionId: string,
    threshold: number,
    reason: string,
    expiresIn?: number
  ): Promise<any> {
    return this.serviceImpl.initiateKEKRecovery(authToken, versionId, threshold, reason, expiresIn);
  }

  /**
   * Get KEK recovery session
   *
   * @param authToken Authentication token
   * @param sessionId Recovery session ID
   * @returns Promise that resolves to the recovery session
   */
  public async getKEKRecoverySession(
    authToken: string,
    sessionId: string
  ): Promise<any> {
    return this.serviceImpl.getKEKRecoverySession(authToken, sessionId);
  }

  /**
   * Submit a recovery share
   *
   * @param authToken Authentication token
   * @param sessionId Recovery session ID
   * @param share The recovery share
   * @param encryptedFor User ID for whom the share is encrypted
   * @returns Promise that resolves to the updated recovery session
   */
  public async submitRecoveryShare(
    authToken: string,
    sessionId: string,
    share: SerializedSecretShare,
    encryptedFor: string
  ): Promise<any> {
    return this.serviceImpl.submitRecoveryShare(authToken, sessionId, share, encryptedFor);
  }

  /**
   * Complete KEK recovery
   *
   * @param authToken Authentication token
   * @param sessionId Recovery session ID
   * @param recoveredKEK The recovered KEK (encrypted with the user's public key)
   * @param newKEKVersion Information about the new KEK version
   * @returns Promise that resolves to the recovery result
   */
  public async completeKEKRecovery(
    authToken: string,
    sessionId: string,
    recoveredKEK: string,
    newKEKVersion: { id: string, reason: string }
  ): Promise<any> {
    return this.serviceImpl.completeKEKRecovery(authToken, sessionId, recoveredKEK, newKEKVersion);
  }
}
