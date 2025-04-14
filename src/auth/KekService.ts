import { AxiosInstance } from 'axios';
import { LogError } from '../errors';
import { EncryptedKEK, KEKVersion } from '../types';

/**
 * Service for managing Key Encryption Keys (KEKs)
 */
export class KekService {
  private baseUrl: string;
  private apiClient: AxiosInstance;

  /**
   * Create a new KekService
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
   * Get encrypted KEK
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the encrypted KEK or null if not found
   */
  public async getEncryptedKEK(authToken: string): Promise<EncryptedKEK | null> {
    try {
      const response = await this.apiClient.get(
        `${this.baseUrl}/kek`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }

      throw new LogError(
        `Failed to get encrypted KEK: ${error instanceof Error ? error.message : String(error)}`,
        'get_encrypted_kek_failed'
      );
    }
  }

  /**
   * Create encrypted KEK
   *
   * @param encryptedKEK Encrypted KEK
   * @param authToken Authentication token
   * @returns Promise that resolves when the encrypted KEK is created
   */
  public async createEncryptedKEK(encryptedKEK: EncryptedKEK, authToken: string): Promise<void> {
    try {
      await this.apiClient.post(
        `${this.baseUrl}/kek`,
        encryptedKEK,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to create encrypted KEK: ${error instanceof Error ? error.message : String(error)}`,
        'create_encrypted_kek_failed'
      );
    }
  }

  /**
   * Update encrypted KEK
   *
   * @param encryptedKEK Encrypted KEK
   * @param authToken Authentication token
   * @returns Promise that resolves when the encrypted KEK is updated
   */
  public async updateEncryptedKEK(encryptedKEK: EncryptedKEK, authToken: string): Promise<void> {
    try {
      await this.apiClient.put(
        `${this.baseUrl}/kek`,
        encryptedKEK,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    } catch (error) {
      throw new LogError(
        `Failed to update encrypted KEK: ${error instanceof Error ? error.message : String(error)}`,
        'update_encrypted_kek_failed'
      );
    }
  }

  /**
   * Get all KEK versions
   *
   * @param authToken Authentication token or API key
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

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to get KEK versions: ${error instanceof Error ? error.message : String(error)}`,
        'get_kek_versions_failed'
      );
    }
  }

  /**
   * Create a new KEK version
   *
   * @param reason Reason for creating the new version
   * @param authToken Authentication token
   * @returns Promise that resolves to the new KEK version
   */
  public async createKEKVersion(reason: string, authToken: string): Promise<KEKVersion> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/kek/versions`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to create KEK version: ${error instanceof Error ? error.message : String(error)}`,
        'create_kek_version_failed'
      );
    }
  }

  /**
   * Rotate KEK
   *
   * @param reason Reason for rotation
   * @param removedUsers Array of user IDs to remove
   * @param authToken Authentication token
   * @returns Promise that resolves to the new KEK version
   */
  public async rotateKEK(reason: string, removedUsers: string[], authToken: string): Promise<KEKVersion> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/kek/rotate`,
        { reason, removed_users: removedUsers },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to rotate KEK: ${error instanceof Error ? error.message : String(error)}`,
        'rotate_kek_failed'
      );
    }
  }

  /**
   * Create a quorum task
   *
   * @param tenantId Tenant ID
   * @param taskType Task type
   * @param requiredShares Required shares
   * @param metadata Task metadata
   * @param authToken Authentication token
   * @returns Promise that resolves to the quorum task
   */
  public async createQuorumTask(
    tenantId: string,
    taskType: string,
    requiredShares: number,
    metadata: Record<string, any>,
    authToken: string
  ): Promise<any> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/kek/quorum`,
        {
          tenant_id: tenantId,
          task_type: taskType,
          required_shares: requiredShares,
          metadata
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to create quorum task: ${error instanceof Error ? error.message : String(error)}`,
        'create_quorum_task_failed'
      );
    }
  }

  /**
   * Add a share contribution to a quorum task
   *
   * @param taskId Task ID
   * @param shareData Share data
   * @param authToken Authentication token
   * @returns Promise that resolves to the updated quorum task
   */
  public async addShareContribution(
    taskId: string,
    shareData: string,
    authToken: string
  ): Promise<any> {
    try {
      const response = await this.apiClient.post(
        `${this.baseUrl}/kek/quorum/${encodeURIComponent(taskId)}/shares`,
        { share_data: shareData },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to add share contribution: ${error instanceof Error ? error.message : String(error)}`,
        'add_share_contribution_failed'
      );
    }
  }

  /**
   * Provision a KEK blob for a user
   *
   * @param userId User ID
   * @param kekVersionId KEK version ID
   * @param encryptedBlob Encrypted KEK blob
   * @param authToken Authentication token
   * @returns Promise that resolves to the KEK blob
   */
  public async provisionKEKBlob(
    userId: string,
    kekVersionId: string,
    encryptedBlob: string,
    authToken: string
  ): Promise<any> {
    try {
      const response = await this.apiClient.post(
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

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to provision KEK blob: ${error instanceof Error ? error.message : String(error)}`,
        'provision_kek_blob_failed'
      );
    }
  }
}
