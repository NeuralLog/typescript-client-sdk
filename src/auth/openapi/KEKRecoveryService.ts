import { AxiosInstance } from 'axios';
import { BaseService } from './BaseService';
import { SerializedSecretShare } from '../../types';

/**
 * Service for managing KEK recovery
 */
export class KEKRecoveryService extends BaseService {
  /**
   * Create a new KEKRecoveryService
   *
   * @param baseUrl Base URL of the auth service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    super(baseUrl, apiClient);
  }

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
    const response = await this.apiClient.post(
      `${this.baseUrl}/kek/recovery`,
      {
        versionId,
        threshold,
        reason,
        expiresIn
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    return response.data;
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
    const response = await this.apiClient.get(
      `${this.baseUrl}/kek/recovery/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    return response.data;
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
    const response = await this.apiClient.post(
      `${this.baseUrl}/kek/recovery/${sessionId}/shares`,
      {
        share,
        encryptedFor
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    return response.data;
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
    const response = await this.apiClient.post(
      `${this.baseUrl}/kek/recovery/${sessionId}/complete`,
      {
        recoveredKEK,
        newKEKVersion
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );

    return response.data;
  }
}
