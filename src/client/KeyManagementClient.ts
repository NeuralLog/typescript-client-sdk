import { BaseClient } from './BaseClient';
import { KeyHierarchyManager } from '../managers/KeyHierarchyManager';
import { AuthProvider } from './services/AuthProvider';
import { ConfigurationService } from './services/ConfigurationService';
import { KEKVersion } from '../types';
import { LogError } from '../errors';

/**
 * Client for key management operations
 */
export class KeyManagementClient extends BaseClient {
  /**
   * Create a new KeyManagementClient
   *
   * @param keyHierarchyManager Key hierarchy manager
   * @param configService Configuration service
   * @param authProvider Authentication provider
   */
  constructor(
    private keyHierarchyManager: KeyHierarchyManager,
    configService: ConfigurationService,
    authProvider: AuthProvider
  ) {
    super(configService, authProvider);
  }

  /**
   * Get KEK versions
   *
   * @returns Promise that resolves to the KEK versions
   */
  public async getKEKVersions(): Promise<KEKVersion[]> {
    this.authProvider.checkAuthentication();
    this.checkInitialization();

    try {
      const authToken = this.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      return await this.keyHierarchyManager.getKEKVersions(authToken);
    } catch (error) {
      this.handleError(error, 'get KEK versions', 'get_kek_versions_failed');
    }
  }

  /**
   * Create a new KEK version
   *
   * @param reason Reason for creating the KEK version
   * @returns Promise that resolves to the created KEK version
   */
  public async createKEKVersion(reason: string): Promise<any> {
    this.authProvider.checkAuthentication();
    this.checkInitialization();

    try {
      const authToken = this.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      return await this.keyHierarchyManager.createKEKVersion(reason, authToken);
    } catch (error) {
      this.handleError(error, 'create KEK version', 'create_kek_version_failed');
    }
  }

  /**
   * Rotate KEK
   *
   * @param reason Reason for rotating the KEK
   * @param removedUsers Users to remove from the KEK
   * @returns Promise that resolves to the rotated KEK
   */
  public async rotateKEK(reason: string, removedUsers: string[] = []): Promise<any> {
    this.authProvider.checkAuthentication();
    this.checkInitialization();

    try {
      const authToken = this.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      return await this.keyHierarchyManager.rotateKEK(reason, removedUsers, authToken);
    } catch (error) {
      this.handleError(error, 'rotate KEK', 'rotate_kek_failed');
    }
  }

  /**
   * Provision KEK for a user
   *
   * @param userId User ID
   * @param kekVersionId KEK version ID
   * @returns Promise that resolves when the KEK is provisioned
   */
  public async provisionKEKForUser(userId: string, kekVersionId: string): Promise<void> {
    this.authProvider.checkAuthentication();
    this.checkInitialization();

    try {
      const authToken = this.getAuthToken();
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      await this.keyHierarchyManager.provisionKEKForUser(userId, kekVersionId, authToken);
    } catch (error) {
      this.handleError(error, 'provision KEK for user', 'provision_kek_for_user_failed');
    }
  }

  /**
   * Initialize with recovery phrase
   *
   * @param recoveryPhrase Recovery phrase
   * @param versions Optional KEK versions to initialize
   * @returns Promise that resolves when initialization is complete
   */
  public async initializeWithRecoveryPhrase(recoveryPhrase: string, versions?: string[]): Promise<void> {
    this.authProvider.checkAuthentication();
    await this.checkInitialization();

    try {
      const tenantId = this.configService.getTenantId();
      await this.keyHierarchyManager.initializeWithRecoveryPhrase(tenantId, recoveryPhrase, versions);
    } catch (error) {
      this.handleError(error, 'initialize with recovery phrase', 'initialize_with_recovery_phrase_failed');
    }
  }

  /**
   * Initialize with mnemonic
   *
   * @param mnemonic Mnemonic phrase
   * @param versions Optional KEK versions to initialize
   * @returns Promise that resolves when initialization is complete
   */
  public async initializeWithMnemonic(mnemonic: string, versions?: string[]): Promise<void> {
    this.authProvider.checkAuthentication();
    await this.checkInitialization();

    try {
      const tenantId = this.configService.getTenantId();
      await this.keyHierarchyManager.initializeWithMnemonic(tenantId, mnemonic, versions);
    } catch (error) {
      this.handleError(error, 'initialize with mnemonic', 'initialize_with_mnemonic_failed');
    }
  }

  /**
   * Recover KEK versions
   *
   * @param versions KEK versions to recover
   * @returns Promise that resolves when recovery is complete
   */
  public async recoverKEKVersions(versions: string[]): Promise<void> {
    this.authProvider.checkAuthentication();
    await this.checkInitialization();

    try {
      await this.keyHierarchyManager.recoverKEKVersions(versions);
    } catch (error) {
      this.handleError(error, 'recover KEK versions', 'recover_kek_versions_failed');
    }
  }

  /**
   * Re-encrypt data with a new KEK version
   *
   * @param data The data to re-encrypt
   * @param oldKEKVersion The old KEK version
   * @param newKEKVersion The new KEK version
   * @returns Promise that resolves to the re-encrypted data
   */
  public async reencryptData(data: any, oldKEKVersion: string, newKEKVersion: string): Promise<any> {
    this.authProvider.checkAuthentication();
    this.checkInitialization();

    try {
      return await this.keyHierarchyManager.reencryptData(data, oldKEKVersion, newKEKVersion);
    } catch (error) {
      this.handleError(error, 're-encrypt data', 'reencrypt_data_failed');
    }
  }

  /**
   * Get the current KEK version
   *
   * @returns The current KEK version
   */
  public getCurrentKEKVersion(): string | null {
    try {
      return this.keyHierarchyManager.getCurrentKEKVersion();
    } catch (error) {
      this.handleError(error, 'get current KEK version', 'get_current_kek_version_failed');
      return null;
    }
  }

  /**
   * Set the current KEK version
   *
   * @param version The KEK version to set as current
   */
  public setCurrentKEKVersion(version: string): void {
    try {
      this.keyHierarchyManager.setCurrentKEKVersion(version);
    } catch (error) {
      this.handleError(error, 'set current KEK version', 'set_current_kek_version_failed');
    }
  }

  /**
   * Set the base URL for the client
   *
   * @param baseUrl The new base URL
   */
  public override setBaseUrl(baseUrl: string): void {
    // Update the base URL for the key hierarchy manager
    this.keyHierarchyManager.setBaseUrl(baseUrl);
  }
}
