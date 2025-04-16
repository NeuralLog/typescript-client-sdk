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
  ResourceTokenVerificationResult
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
}
