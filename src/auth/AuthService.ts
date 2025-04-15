import { AxiosInstance } from 'axios';
import axios from 'axios';
import { LogError } from '../errors';
import { ApiError } from '../errors/ApiError';
import {
  Login,
  ApiKey,
  KeysList,
  KEKBlob,
  KEKVersion,
  AdminShareRequest,
  AdminShare,
  UserProfile,
  ApiKeyChallenge,
  ApiKeyChallengeVerification,
  CreateApiKeyRequest,
  ApiKeyInfo
} from '../types';

/**
 * Service for interacting with the NeuralLog auth service
 */
export class AuthService {
  private baseUrl: string;
  private apiClient: AxiosInstance;

  /**
   * Create a new AuthService
   *
   * @param baseUrl Base URL of the auth service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    this.baseUrl = baseUrl;
    this.apiClient = apiClient;
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
  }

  /**
   * Login with username and password
   *
   * @param username Username
   * @param password Password
   * @returns Promise that resolves to the login response
   */
  public async login(username: string, password: string): Promise<Login> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/login`,
        { username, password }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Logout
   *
   * @param authToken Authentication token
   * @returns Promise that resolves when the user is logged out
   */
  public async logout(authToken: string): Promise<void> {
    try {
      await this.apiClient.post(
        `${this.baseUrl}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
          error
        );
      }
      throw error;
    }
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
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/change-password`,
        {
          old_password: oldPassword,
          new_password: newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.success === true;
    } catch (error) {
      throw new LogError(
        `Failed to change password: ${error instanceof Error ? error.message : String(error)}`,
        'change_password_failed'
      );
    }
  }

  /**
   * Validate an API key
   *
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @param proof Zero-knowledge proof for the API key
   * @returns Promise that resolves to true if the API key is valid
   */
  public async validateApiKey(apiKey: string, tenantId: string, proof?: string): Promise<boolean> {
    try {
      const requestBody: any = { api_key: apiKey };

      if (proof) {
        requestBody.proof = proof;
      }

      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/validate-api-key`,
        requestBody,
        {
          params: { tenant_id: tenantId }
        }
      );

      return response.data.valid === true;
    } catch (error) {
      throw new LogError(
        `Failed to validate API key: ${error instanceof Error ? error.message : String(error)}`,
        'validate_api_key_failed'
      );
    }
  }

  /**
   * Get a resource token
   *
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @param resource Resource path
   * @returns Promise that resolves to the resource token
   */
  public async getResourceToken(
    apiKey: string,
    tenantId: string,
    resource: string
  ): Promise<string> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/auth/resource-token`,
        {
          params: {
            tenant_id: tenantId,
            resource
          },
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      );

      return response.data.token;
    } catch (error) {
      throw new LogError(
        `Failed to get resource token: ${error instanceof Error ? error.message : String(error)}`,
        'get_resource_token_failed'
      );
    }
  }

  /**
   * Get a challenge for API key authentication
   *
   * @returns Promise that resolves to the challenge
   */
  public async getApiKeyChallenge(): Promise<ApiKeyChallenge> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/auth/api-key-challenge`
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Verify a challenge response for API key authentication
   *
   * @param challenge Challenge
   * @param response Challenge response
   * @returns Promise that resolves to the verification result
   */
  public async verifyApiKeyChallenge(challenge: string, response: string): Promise<ApiKeyChallengeVerification> {
    try {
      const apiResponse = await this.apiClient.post(
        `${this.baseUrl}/auth/verify-api-key-challenge`,
        { challenge, response }
      );

      return apiResponse.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Get user profile
   *
   * @param userId User ID
   * @returns Promise that resolves to the user profile
   */
  public async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/users/${userId}/profile`
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
          error
        );
      }
      throw error;
    }
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
    try {
      // Convert string permissions to array if needed
      const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];

      // Create the request
      const request: CreateApiKeyRequest = {
        name,
        expires_in: expiresIn
      };

      // Add permissions if they exist
      if (permissionsArray.length > 0) {
        // We need to use any here because TypeScript is having trouble with the type conversion
        const apiKeyPermissions: any[] = permissionsArray.map(p => {
          if (typeof p === 'string') {
            return { action: p, resource: '*' };
          } else if (typeof p === 'object' && p !== null) {
            const pObj = p as any;
            if (typeof pObj.action === 'string' && typeof pObj.resource === 'string') {
              return { action: pObj.action, resource: pObj.resource };
            }
          }
          return { action: 'read', resource: '*' };
        });

        request.permissions = apiKeyPermissions;
      }

      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/api-keys`,
        request,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Create an API key (legacy method)
   *
   * @param request API key creation request
   * @param authToken Authentication token
   * @returns Promise that resolves to the API key ID
   */
  public async createApiKeyWithRequest(
    request: CreateApiKeyRequest,
    authToken: string
  ): Promise<string> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/auth/api-keys`,
        request,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.key_id;
    } catch (error) {
      throw new LogError(
        `Failed to create API key: ${error instanceof Error ? error.message : String(error)}`,
        'create_api_key_failed'
      );
    }
  }

  /**
   * Get API keys
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the API keys
   */
  public async getApiKeys(authToken: string): Promise<ApiKey[]> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/auth/api-keys`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.api_keys || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
          error
        );
      }
      throw error;
    }
  }

  /**
   * List API keys (legacy method)
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the API keys
   */
  public async listApiKeys(authToken: string): Promise<ApiKeyInfo[]> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/auth/api-keys`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.api_keys || [];
    } catch (error) {
      throw new LogError(
        `Failed to list API keys: ${error instanceof Error ? error.message : String(error)}`,
        'list_api_keys_failed'
      );
    }
  }

  /**
   * Revoke an API key
   *
   * @param authToken Authentication token
   * @param keyId API key ID
   * @returns Promise that resolves when the API key is revoked
   */
  public async revokeApiKey(authToken: string, keyId: string): Promise<void> {
    try {
      await this.apiClient.delete(
        `${this.baseUrl}/auth/api-keys/${keyId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
          error
        );
      }
      throw error;
    }
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
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/auth/permissions/check`,
        {
          params: {
            action,
            resource
          },
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.allowed === true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
          error
        );
      }
      throw error;
    }
  }

  /**
   * Get KEK blobs
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the KEK blobs
   */
  public async getKEKBlobs(authToken: string): Promise<KEKBlob[]> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/kek/blobs`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.blobs || [];
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
   * @param authToken Authentication token
   * @returns Promise that resolves to the KEK versions
   */
  public async getKEKVersions(authToken: string): Promise<KEKVersion[]> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/kek/versions`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.versions || [];
    } catch (error) {
      throw new LogError(
        `Failed to get KEK versions: ${error instanceof Error ? error.message : String(error)}`,
        'get_kek_versions_failed'
      );
    }
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
    try {
      await this.apiClient.post(
        `${this.baseUrl}/kek/blobs`,
        {
          user_id: userId,
          kek_version_id: kekVersionId,
          encrypted_blob: encryptedBlob
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to provision KEK blob: ${error instanceof Error ? error.message : String(error)}`,
        'provision_kek_blob_failed'
      );
    }
  }

  /**
   * Upload public key
   *
   * @param publicKey Public key
   * @param authToken Authentication token
   * @returns Promise that resolves when the public key is uploaded
   */
  public async uploadPublicKey(publicKey: string, authToken: string): Promise<void> {
    try {
      await this.apiClient.post(
        `${this.baseUrl}/users/public-key`,
        { public_key: publicKey },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to upload public key: ${error instanceof Error ? error.message : String(error)}`,
        'upload_public_key_failed'
      );
    }
  }

  /**
   * Get public key
   *
   * @param userId User ID
   * @param authToken Authentication token
   * @returns Promise that resolves to the public key
   */
  public async getPublicKey(userId: string, authToken: string): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/users/${userId}/public-key`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to get public key: ${error instanceof Error ? error.message : String(error)}`,
        'get_public_key_failed'
      );
    }
  }

  /**
   * Get users
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the users
   */
  public async getUsers(authToken: string): Promise<any[]> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/users`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.users || [];
    } catch (error) {
      throw new LogError(
        `Failed to get users: ${error instanceof Error ? error.message : String(error)}`,
        'get_users_failed'
      );
    }
  }

  /**
   * Get pending admin promotions
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the pending admin promotions
   */
  public async getPendingAdminPromotions(authToken: string): Promise<any[]> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/admin/promotions/pending`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.promotions || [];
    } catch (error) {
      throw new LogError(
        `Failed to get pending admin promotions: ${error instanceof Error ? error.message : String(error)}`,
        'get_pending_admin_promotions_failed'
      );
    }
  }

  /**
   * Get admin promotion
   *
   * @param promotionId Promotion ID
   * @param authToken Authentication token
   * @returns Promise that resolves to the admin promotion
   */
  public async getAdminPromotion(promotionId: string, authToken: string): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/admin/promotions/${promotionId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to get admin promotion: ${error instanceof Error ? error.message : String(error)}`,
        'get_admin_promotion_failed'
      );
    }
  }

  /**
   * Approve admin promotion
   *
   * @param promotionId Promotion ID
   * @param share Share
   * @param authToken Authentication token
   * @returns Promise that resolves when the admin promotion is approved
   */
  public async approveAdminPromotion(promotionId: string, share: any, authToken: string): Promise<void> {
    try {
      await this.apiClient.post(
        `${this.baseUrl}/admin/promotions/${promotionId}/approve`,
        { share },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to approve admin promotion: ${error instanceof Error ? error.message : String(error)}`,
        'approve_admin_promotion_failed'
      );
    }
  }

  /**
   * Reject admin promotion
   *
   * @param promotionId Promotion ID
   * @param authToken Authentication token
   * @returns Promise that resolves when the admin promotion is rejected
   */
  public async rejectAdminPromotion(promotionId: string, authToken: string): Promise<void> {
    try {
      await this.apiClient.post(
        `${this.baseUrl}/admin/promotions/${promotionId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to reject admin promotion: ${error instanceof Error ? error.message : String(error)}`,
        'reject_admin_promotion_failed'
      );
    }
  }

  /**
   * Provision admin share
   *
   * @param authToken Authentication token
   * @param request Admin share request
   * @returns Promise that resolves to the admin share response
   */
  public async provisionAdminShare(authToken: string, request: AdminShareRequest): Promise<AdminShare> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/admin/shares`,
        request,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to provision admin share: ${error instanceof Error ? error.message : String(error)}`,
        'provision_admin_share_failed'
      );
    }
  }

  /**
   * Get admin shares
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the admin shares
   */
  public async getAdminShares(authToken: string): Promise<AdminShare[]> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/admin/shares`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data.shares || [];
    } catch (error) {
      throw new LogError(
        `Failed to get admin shares: ${error instanceof Error ? error.message : String(error)}`,
        'get_admin_shares_failed'
      );
    }
  }
}
