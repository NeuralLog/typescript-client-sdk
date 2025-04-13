import { AxiosInstance } from 'axios';
import { LogError } from '../errors';
import { EncryptedKEK } from '../types';

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
}
