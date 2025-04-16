import { KEKBlob, KEKVersion, AdminShareRequest, AdminShare } from '../../generated/auth-service';
import { AuthClientBase } from './AuthClientBase';
import { LogError } from '../../errors';

/**
 * Service for KEK operations using the OpenAPI client
 */
export class KEKService extends AuthClientBase {
  /**
   * Get KEK blobs
   *
   * @param authToken Authentication token
   * @returns Promise that resolves to the KEK blobs
   */
  public async getKEKBlobs(authToken: string): Promise<KEKBlob[]> {
    try {
      // Note: This endpoint is not in the OpenAPI spec yet
      throw new LogError(
        'Get KEK blobs is not implemented in the OpenAPI client yet',
        'not_implemented'
      );
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
      // Note: This endpoint is not in the OpenAPI spec yet
      throw new LogError(
        'Get KEK versions is not implemented in the OpenAPI client yet',
        'not_implemented'
      );
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
      // Note: This endpoint is not in the OpenAPI spec yet
      throw new LogError(
        'Provision KEK blob is not implemented in the OpenAPI client yet',
        'not_implemented'
      );
    } catch (error) {
      throw new LogError(
        `Failed to provision KEK blob: ${error instanceof Error ? error.message : String(error)}`,
        'provision_kek_blob_failed'
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
      // Note: This endpoint is not in the OpenAPI spec yet
      throw new LogError(
        'Provision admin share is not implemented in the OpenAPI client yet',
        'not_implemented'
      );
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
      // Note: This endpoint is not in the OpenAPI spec yet
      throw new LogError(
        'Get admin shares is not implemented in the OpenAPI client yet',
        'not_implemented'
      );
    } catch (error) {
      throw new LogError(
        `Failed to get admin shares: ${error instanceof Error ? error.message : String(error)}`,
        'get_admin_shares_failed'
      );
    }
  }
}
