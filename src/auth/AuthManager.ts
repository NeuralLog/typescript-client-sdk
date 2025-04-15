import { LogError } from '../errors';
import { AuthService } from './AuthService';
import { KeyHierarchyManager } from '../managers/KeyHierarchyManager';
import { ZKPUtils } from '../crypto/ZKPUtils';
import { CryptoService } from '../crypto/CryptoService';
import {
  Login,
  ApiKey,
  UserProfile,
  KEKVersion,
  KEKBlob,
  AdminShareRequest,
  AdminShare
} from '../types';

/**
 * Manager for authentication and authorization operations
 */
export class AuthManager {
  /**
   * Auth service for API calls
   */
  private authService: AuthService;

  /**
   * Key hierarchy manager
   */
  private keyHierarchyManager: KeyHierarchyManager;

  /**
   * Zero-Knowledge Proof utilities
   */
  private zkpUtils: ZKPUtils;

  /**
   * Current user profile
   */
  private currentUser: UserProfile | null = null;

  /**
   * Current auth token
   */
  private authToken: string | null = null;

  /**
   * Create a new AuthManager
   *
   * @param authService Auth service
   * @param cryptoService Crypto service (optional, for backward compatibility)
   * @param keyHierarchyManager Key hierarchy manager
   */
  constructor(
    authService: AuthService,
    cryptoService: CryptoService | KeyHierarchyManager,
    keyHierarchyManager?: KeyHierarchyManager
  ) {
    this.authService = authService;

    // Handle backward compatibility
    if (keyHierarchyManager) {
      // Called with 3 parameters (old style)
      this.keyHierarchyManager = keyHierarchyManager;
    } else {
      // Called with 2 parameters (new style)
      this.keyHierarchyManager = cryptoService as KeyHierarchyManager;
    }

    this.zkpUtils = new ZKPUtils();
  }

  /**
   * Login with username and password
   *
   * @param username Username
   * @param password Password
   * @returns Promise that resolves to the auth response
   */
  public async login(username: string, password: string): Promise<Login> {
    try {
      // Call the auth service to login
      const response = await this.authService.login(username, password);

      // Store the auth token and user profile
      this.authToken = response.token;
      this.currentUser = response.user || null;

      return response;
    } catch (error) {
      throw new LogError(
        `Login failed: ${error instanceof Error ? error.message : String(error)}`,
        'login_failed'
      );
    }
  }

  /**
   * Login with API key
   *
   * @param apiKey API key
   * @returns Promise that resolves to the auth response
   */
  public async loginWithApiKey(apiKey: string): Promise<Login> {
    try {
      // Get a challenge from the server
      const challengeResponse = await this.authService.getApiKeyChallenge();
      const challenge = challengeResponse.challenge;

      // Generate a challenge response
      const response = this.zkpUtils.generateChallengeResponse(apiKey, challenge);

      // Verify the challenge response
      const verificationResponse = await this.authService.verifyApiKeyChallenge(challenge, response);

      if (!verificationResponse.valid) {
        throw new Error('Invalid API key');
      }

      // Extract user ID and tenant ID from the verification response
      const userId = verificationResponse.userId || '';
      const tenantId = verificationResponse.tenantId || '';
      const scopes = verificationResponse.scopes || [];

      if (!userId || !tenantId) {
        throw new Error('Invalid API key verification response');
      }

      // Generate a token client-side
      const token = this.zkpUtils.generateToken(apiKey, userId, tenantId, scopes);

      // Get user profile
      const userProfile = await this.authService.getUserProfile(userId);

      // Store the auth token and user profile
      this.authToken = token;
      this.currentUser = userProfile;

      return {
        token,
        user_id: userId,
        tenant_id: tenantId,
        user: userProfile
      };
    } catch (error) {
      throw new LogError(
        `Login with API key failed: ${error instanceof Error ? error.message : String(error)}`,
        'login_with_api_key_failed'
      );
    }
  }

  /**
   * Logout
   *
   * @returns Promise that resolves when logout is complete
   */
  public async logout(): Promise<void> {
    try {
      // Call the auth service to logout
      if (this.authToken) {
        await this.authService.logout(this.authToken);
      }

      // Clear the auth token and user profile
      this.authToken = null;
      this.currentUser = null;
    } catch (error) {
      throw new LogError(
        `Logout failed: ${error instanceof Error ? error.message : String(error)}`,
        'logout_failed'
      );
    }
  }

  /**
   * Get the current user profile
   *
   * @returns Current user profile or null if not logged in
   */
  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Get the current auth token
   *
   * @returns Current auth token or null if not logged in
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Check if the user is logged in
   *
   * @returns True if logged in, false otherwise
   */
  public isLoggedIn(): boolean {
    return this.authToken !== null && this.currentUser !== null;
  }

  /**
   * Get KEK blobs for the current user
   *
   * @returns Promise that resolves to the KEK blobs
   */
  public async getKEKBlobs(): Promise<KEKBlob[]> {
    try {
      if (!this.authToken) {
        throw new Error('Not logged in');
      }

      // Call the auth service to get KEK blobs
      return await this.authService.getKEKBlobs(this.authToken);
    } catch (error) {
      throw new LogError(
        `Failed to get KEK blobs: ${error instanceof Error ? error.message : String(error)}`,
        'get_kek_blobs_failed'
      );
    }
  }

  /**
   * Get KEK versions
   *
   * @returns Promise that resolves to the KEK versions
   */
  public async getKEKVersions(): Promise<KEKVersion[]> {
    try {
      if (!this.authToken) {
        throw new Error('Not logged in');
      }

      // Call the auth service to get KEK versions
      return await this.authService.getKEKVersions(this.authToken);
    } catch (error) {
      throw new LogError(
        `Failed to get KEK versions: ${error instanceof Error ? error.message : String(error)}`,
        'get_kek_versions_failed'
      );
    }
  }

  /**
   * Create a new API key
   *
   * @param name Name of the API key
   * @param expiresIn Expiration time in days (optional)
   * @returns Promise that resolves to the created API key
   */
  public async createApiKey(name: string, expiresIn?: number): Promise<ApiKey> {
    try {
      if (!this.authToken) {
        throw new Error('Not logged in');
      }

      // Call the auth service to create an API key
      return await this.authService.createApiKey(this.authToken, name, expiresIn ? [expiresIn.toString()] : []);
    } catch (error) {
      throw new LogError(
        `Failed to create API key: ${error instanceof Error ? error.message : String(error)}`,
        'create_api_key_failed'
      );
    }
  }

  /**
   * Get API keys for the current user
   *
   * @returns Promise that resolves to the API keys
   */
  public async getApiKeys(): Promise<ApiKey[]> {
    try {
      if (!this.authToken) {
        throw new Error('Not logged in');
      }

      // Call the auth service to get API keys
      return await this.authService.getApiKeys(this.authToken);
    } catch (error) {
      throw new LogError(
        `Failed to get API keys: ${error instanceof Error ? error.message : String(error)}`,
        'get_api_keys_failed'
      );
    }
  }

  /**
   * Revoke an API key
   *
   * @param apiKeyId ID of the API key to revoke
   * @returns Promise that resolves when the API key is revoked
   */
  public async revokeApiKey(apiKeyId: string): Promise<void> {
    try {
      if (!this.authToken) {
        throw new Error('Not logged in');
      }

      // Call the auth service to revoke the API key
      await this.authService.revokeApiKey(this.authToken, apiKeyId);
    } catch (error) {
      throw new LogError(
        `Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`,
        'revoke_api_key_failed'
      );
    }
  }

  /**
   * Check if the user has permission to perform an action on a resource
   *
   * @param action Action to check
   * @param resource Resource to check
   * @returns Promise that resolves to true if the user has permission, false otherwise
   */
  public async checkPermission(action: string, resource: string): Promise<boolean> {
    try {
      if (!this.authToken) {
        throw new Error('Not logged in');
      }

      // Call the auth service to check permission
      return await this.authService.checkPermission(this.authToken, action, resource);
    } catch (error) {
      throw new LogError(
        `Failed to check permission: ${error instanceof Error ? error.message : String(error)}`,
        'check_permission_failed'
      );
    }
  }

  /**
   * Provision a KEK blob for a user
   *
   * @param userId User ID to provision the KEK blob for
   * @param kekVersion KEK version
   * @param encryptedKEK Encrypted KEK
   * @returns Promise that resolves when the KEK blob is provisioned
   */
  public async provisionKEKBlob(
    userId: string,
    kekVersion: string,
    encryptedKEK: string
  ): Promise<void> {
    try {
      if (!this.authToken) {
        throw new Error('Not logged in');
      }

      // Call the auth service to provision the KEK blob
      await this.authService.provisionKEKBlob(
        this.authToken,
        userId,
        kekVersion,
        encryptedKEK
      );
    } catch (error) {
      throw new LogError(
        `Failed to provision KEK blob: ${error instanceof Error ? error.message : String(error)}`,
        'provision_kek_blob_failed'
      );
    }
  }

  /**
   * Provision an admin share for a user
   *
   * @param request Admin share request
   * @returns Promise that resolves to the admin share response
   */
  public async provisionAdminShare(request: AdminShareRequest): Promise<AdminShare> {
    try {
      if (!this.authToken) {
        throw new Error('Not logged in');
      }

      // Call the auth service to provision the admin share
      return await this.authService.provisionAdminShare(this.authToken, request);
    } catch (error) {
      throw new LogError(
        `Failed to provision admin share: ${error instanceof Error ? error.message : String(error)}`,
        'provision_admin_share_failed'
      );
    }
  }

  /**
   * Get admin shares for the current user
   *
   * @returns Promise that resolves to the admin shares
   */
  public async getAdminShares(): Promise<AdminShare[]> {
    try {
      if (!this.authToken) {
        throw new Error('Not logged in');
      }

      // Call the auth service to get admin shares
      return await this.authService.getAdminShares(this.authToken);
    } catch (error) {
      throw new LogError(
        `Failed to get admin shares: ${error instanceof Error ? error.message : String(error)}`,
        'get_admin_shares_failed'
      );
    }
  }

  /**
   * Initialize with recovery phrase
   *
   * @param tenantId Tenant ID
   * @param recoveryPhrase Recovery phrase
   * @returns Promise that resolves when initialization is complete
   */
  public async initializeWithRecoveryPhrase(
    tenantId: string,
    recoveryPhrase: string
  ): Promise<void> {
    try {
      // Initialize the key hierarchy
      await this.keyHierarchyManager.initializeWithRecoveryPhrase(
        tenantId,
        recoveryPhrase
      );
    } catch (error) {
      throw new LogError(
        `Failed to initialize with recovery phrase: ${error instanceof Error ? error.message : String(error)}`,
        'initialize_with_recovery_phrase_failed'
      );
    }
  }
}
