import { CryptoService } from '../crypto/CryptoService';
import { KekService } from '../auth/KekService';
import { LogError } from '../errors';
import { KEKVersion } from '../types';

/**
 * Manager for the key hierarchy
 */
export class KeyHierarchyManager {
  private cryptoService: CryptoService;
  private kekService: KekService;

  /**
   * Create a new KeyHierarchyManager
   *
   * @param cryptoService Crypto service
   * @param kekService KEK service
   */
  constructor(cryptoService: CryptoService, kekService: KekService) {
    this.cryptoService = cryptoService;
    this.kekService = kekService;
  }

  /**
   * Initialize the key hierarchy from a recovery phrase
   *
   * @param tenantId Tenant ID
   * @param recoveryPhrase Recovery phrase
   * @param versions KEK versions to recover (if not provided, only the latest version is recovered)
   * @returns Promise that resolves when the key hierarchy is initialized
   */
  public async initializeWithRecoveryPhrase(
    tenantId: string,
    recoveryPhrase: string,
    versions?: string[]
  ): Promise<void> {
    try {
      // Get available KEK versions if not provided
      if (!versions || versions.length === 0) {
        const kekVersionsResponse = await this.kekService.getKEKVersions(localStorage.getItem('authToken') || '');
        versions = kekVersionsResponse.map(v => v.id);
      }

      // Initialize the key hierarchy
      await this.cryptoService.initializeKeyHierarchy(tenantId, recoveryPhrase, versions);
    } catch (error) {
      throw new LogError(
        `Failed to initialize with recovery phrase: ${error instanceof Error ? error.message : String(error)}`,
        'initialize_with_recovery_phrase_failed'
      );
    }
  }

  /**
   * Initialize the key hierarchy from a mnemonic phrase
   *
   * @param tenantId Tenant ID
   * @param mnemonicPhrase BIP-39 mnemonic phrase
   * @param versions KEK versions to recover (if not provided, only the latest version is recovered)
   * @returns Promise that resolves when the key hierarchy is initialized
   */
  public async initializeWithMnemonic(
    tenantId: string,
    mnemonicPhrase: string,
    versions?: string[]
  ): Promise<void> {
    try {
      // Validate mnemonic phrase
      const mnemonicService = this.cryptoService.getMnemonicService();
      if (!mnemonicService.validateMnemonic(mnemonicPhrase)) {
        throw new LogError('Invalid mnemonic phrase', 'invalid_mnemonic');
      }

      // Get available KEK versions if not provided
      if (!versions || versions.length === 0) {
        const kekVersionsResponse = await this.kekService.getKEKVersions(localStorage.getItem('authToken') || '');
        versions = kekVersionsResponse.map(v => v.id);
      }

      // Initialize the key hierarchy
      await this.cryptoService.initializeKeyHierarchy(tenantId, mnemonicPhrase, versions);
    } catch (error) {
      throw new LogError(
        `Failed to initialize with mnemonic phrase: ${error instanceof Error ? error.message : String(error)}`,
        'initialize_with_mnemonic_failed'
      );
    }
  }

  /**
   * Initialize the key hierarchy from an API key
   *
   * @param tenantId Tenant ID
   * @param apiKey API key
   * @param versions KEK versions to recover (if not provided, only the latest version is recovered)
   * @returns Promise that resolves when the key hierarchy is initialized
   */
  public async initializeWithApiKey(
    tenantId: string,
    apiKey: string,
    versions?: string[]
  ): Promise<void> {
    try {
      // Get available KEK versions if not provided
      if (!versions || versions.length === 0) {
        const kekVersionsResponse = await this.kekService.getKEKVersions(apiKey);
        versions = kekVersionsResponse.map(v => v.id);
      }

      // Derive the master secret from the API key
      const masterSecret = await this.cryptoService.deriveMasterSecret(tenantId, apiKey);

      // Derive the master KEK
      await this.cryptoService.deriveMasterKEK(masterSecret);

      // Derive operational KEKs for all versions
      for (const version of versions) {
        await this.cryptoService.deriveOperationalKEK(version);
      }

      // Set the current KEK version to the latest one
      if (versions.length > 0) {
        const latestVersion = versions.sort().pop();
        if (latestVersion) {
          this.cryptoService.setCurrentKEKVersion(latestVersion);
        }
      }
    } catch (error) {
      throw new LogError(
        `Failed to initialize with API key: ${error instanceof Error ? error.message : String(error)}`,
        'initialize_with_api_key_failed'
      );
    }
  }

  /**
   * Recover specific KEK versions
   *
   * @param versions KEK versions to recover
   * @returns Promise that resolves when the versions are recovered
   */
  public async recoverKEKVersions(versions: string[]): Promise<void> {
    try {
      await this.cryptoService.recoverKEKVersions(versions);
    } catch (error) {
      throw new LogError(
        `Failed to recover KEK versions: ${error instanceof Error ? error.message : String(error)}`,
        'recover_kek_versions_failed'
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
      return await this.kekService.getKEKVersions(authToken);
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
      return await this.kekService.createKEKVersion(reason, authToken);
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
      return await this.kekService.rotateKEK(reason, removedUsers, authToken);
    } catch (error) {
      throw new LogError(
        `Failed to rotate KEK: ${error instanceof Error ? error.message : String(error)}`,
        'rotate_kek_failed'
      );
    }
  }

  /**
   * Provision KEK for a user
   *
   * @param userId User ID
   * @param kekVersionId KEK version ID
   * @param authToken Authentication token
   * @returns Promise that resolves when the KEK is provisioned
   */
  public async provisionKEKForUser(userId: string, kekVersionId: string, authToken: string): Promise<void> {
    try {
      // Get the current operational KEK
      const operationalKEK = this.cryptoService.getCurrentOperationalKEK();

      // Encrypt the KEK for the user
      const encryptedBlob = JSON.stringify({
        data: this.cryptoService.arrayBufferToBase64(operationalKEK),
        version: kekVersionId
      });

      // Store the encrypted KEK blob for the user
      await this.kekService.provisionKEKBlob(userId, kekVersionId, encryptedBlob, authToken);
    } catch (error) {
      throw new LogError(
        `Failed to provision KEK for user: ${error instanceof Error ? error.message : String(error)}`,
        'provision_kek_failed'
      );
    }
  }

  /**
   * Split the KEK into shares using Shamir's Secret Sharing
   *
   * @param numShares The number of shares to create
   * @param threshold The minimum number of shares required to reconstruct the KEK
   * @returns Promise that resolves to the serialized shares
   */
  public async splitKEKIntoShares(numShares: number, threshold: number): Promise<any[]> {
    try {
      // Get the current operational KEK
      const operationalKEK = this.cryptoService.getCurrentOperationalKEK();

      // Split the KEK into shares
      const shares = await this.cryptoService.splitKEK(operationalKEK, numShares, threshold);

      // Serialize the shares
      return shares.map(share => this.cryptoService.serializeShare(share));
    } catch (error) {
      throw new LogError(
        `Failed to split KEK into shares: ${error instanceof Error ? error.message : String(error)}`,
        'split_kek_failed'
      );
    }
  }

  /**
   * Reconstruct the KEK from shares
   *
   * @param serializedShares The serialized shares to use for reconstruction
   * @returns Promise that resolves to the reconstructed KEK
   */
  public async reconstructKEKFromShares(serializedShares: any[]): Promise<Uint8Array> {
    try {
      // Deserialize the shares
      const shares = serializedShares.map(serializedShare =>
        this.cryptoService.deserializeShare(serializedShare)
      );

      // Reconstruct the KEK
      return await this.cryptoService.reconstructKEK(shares);
    } catch (error) {
      throw new LogError(
        `Failed to reconstruct KEK from shares: ${error instanceof Error ? error.message : String(error)}`,
        'reconstruct_kek_failed'
      );
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
    try {
      return await this.cryptoService.reencryptData(data, oldKEKVersion, newKEKVersion);
    } catch (error) {
      throw new LogError(
        `Failed to re-encrypt data: ${error instanceof Error ? error.message : String(error)}`,
        'reencrypt_data_failed'
      );
    }
  }

  /**
   * Get the current KEK version
   *
   * @returns The current KEK version
   */
  public getCurrentKEKVersion(): string {
    try {
      return this.cryptoService.getCurrentKEKVersion();
    } catch (error) {
      throw new LogError(
        `Failed to get current KEK version: ${error instanceof Error ? error.message : String(error)}`,
        'get_current_kek_version_failed'
      );
    }
  }

  /**
   * Set the current KEK version
   *
   * @param version The KEK version to set as current
   */
  public setCurrentKEKVersion(version: string): void {
    try {
      this.cryptoService.setCurrentKEKVersion(version);
    } catch (error) {
      throw new LogError(
        `Failed to set current KEK version: ${error instanceof Error ? error.message : String(error)}`,
        'set_current_kek_version_failed'
      );
    }
  }

  /**
   * Set the base URL for the KEK service
   *
   * @param baseUrl The new base URL
   */
  public setBaseUrl(baseUrl: string): void {
    // Update the base URL for the KEK service
    this.kekService.setBaseUrl(baseUrl);
  }
}
