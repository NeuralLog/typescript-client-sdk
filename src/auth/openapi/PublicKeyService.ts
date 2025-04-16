import { AxiosInstance } from 'axios';
import { BaseService } from './BaseService';

/**
 * Service for managing public keys
 */
export class PublicKeyService extends BaseService {
  /**
   * Create a new PublicKeyService
   *
   * @param baseUrl Base URL of the auth service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    super(baseUrl, apiClient);
  }

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
    const response = await this.apiClient.post(
      `${this.baseUrl}/public-keys`,
      {
        publicKey,
        purpose,
        metadata
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
    const url = `${this.baseUrl}/public-keys/${userId}`;
    const params: Record<string, any> = {};

    if (purpose) {
      params.purpose = purpose;
    }

    const response = await this.apiClient.get(url, {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      params
    });

    return response.data;
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
    const response = await this.apiClient.put(
      `${this.baseUrl}/public-keys/${keyId}`,
      {
        publicKey,
        metadata
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
    await this.apiClient.delete(`${this.baseUrl}/public-keys/${keyId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
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
    const response = await this.apiClient.post(
      `${this.baseUrl}/public-keys/verify`,
      {
        keyId,
        challenge,
        signature
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
