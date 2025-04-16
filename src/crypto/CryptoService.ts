import { LogError } from '../errors';
import { LogErrorCode } from '../errors/LogErrorCode';
import { EncryptedKEK, KEKVersion, LogEncryptionInfo } from '../types';
import { ShamirSecretSharing, SecretShare, SerializedSecretShare } from './ShamirSecretSharing';
import { MnemonicService } from './MnemonicService';
import { KeyPairService } from './KeyPairService';
import { KeyDerivation } from './KeyDerivation';
import { Base64Utils } from './Base64Utils';
import { AesUtils } from './AesUtils';
import { HmacUtils } from './HmacUtils';
import { RandomUtils } from './RandomUtils';
import { bytesToUtf8 } from '@noble/ciphers/utils';

/**
 * Service for cryptographic operations
 */
export class CryptoService {
  /**
   * Mnemonic service for generating and validating mnemonic phrases
   */
  private mnemonicService: MnemonicService;

  /**
   * Key pair service for managing public/private key pairs
   */
  private keyPairService: KeyPairService;

  /**
   * Master KEK derived from the master secret
   */
  private masterKEK: Uint8Array | null = null;

  /**
   * Map of operational KEKs by version
   */
  private operationalKEKs: Map<string, Uint8Array> = new Map();

  /**
   * Current active KEK version
   */
  private currentKEKVersion: string | null = null;

  /**
   * Create a new CryptoService
   */
  constructor() {
    this.mnemonicService = new MnemonicService();
    this.keyPairService = new KeyPairService();
  }

  /**
   * Helper method to handle errors consistently
   *
   * @param error The error to handle
   * @param operation The operation that failed
   * @param errorCode The error code to use
   * @throws LogError with a consistent format
   */
  protected handleError(error: unknown, operation: string, errorCode: LogErrorCode): never {
    throw new LogError(
      `Failed to ${operation}: ${error instanceof Error ? error.message : String(error)}`,
      errorCode
    );
  }

  /**
   * Get the mnemonic service
   *
   * @returns The mnemonic service
   */
  public getMnemonicService(): MnemonicService {
    return this.mnemonicService;
  }

  /**
   * Get the key pair service
   *
   * @returns The key pair service
   */
  public getKeyPairService(): KeyPairService {
    return this.keyPairService;
  }
  /**
   * Convert an ArrayBuffer to Base64
   *
   * @param buffer ArrayBuffer
   * @returns Base64 string
   */
  public arrayBufferToBase64(buffer: ArrayBuffer): string {
    return Base64Utils.arrayBufferToBase64(buffer);
  }

  /**
   * Convert a Base64 string to ArrayBuffer
   *
   * @param base64 Base64 string
   * @returns ArrayBuffer
   */
  public base64ToArrayBuffer(base64: string): ArrayBuffer {
    return Base64Utils.base64ToArrayBuffer(base64);
  }

  /**
   * Encrypt log data with the current operational KEK
   *
   * @param data Log data
   * @returns Promise that resolves to the encrypted log data with version information
   */
  public async encryptLogData(data: any): Promise<Record<string, any>> {
    try {
      // Get the current KEK version
      const kekVersion = this.getCurrentKEKVersion();

      // Derive the log key
      const logKey = await this.deriveLogKey();

      // Encrypt data using AesEncryptionUtils
      const encryptedData = AesUtils.encrypt(logKey, data);

      // Add KEK version to the encrypted data
      return {
        ...encryptedData,
        kekVersion
      };
    } catch (error) {
      return this.handleError(error, 'encrypt log data', 'encrypt_log_data_failed');
    }
  }

  /**
   * Decrypt log data using the appropriate KEK version
   *
   * @param encryptedData Encrypted log data with version information
   * @returns Promise that resolves to the decrypted log data
   */
  public async decryptLogData(encryptedData: Record<string, any> | string): Promise<any> {
    try {
      // If encryptedData is a string or doesn't have the required properties, handle it in AesUtils.decryptWithMetadata
      if (typeof encryptedData !== 'object' || !encryptedData || !encryptedData.kekVersion) {
        // If no KEK version, use the current one
        const logKey = await this.deriveLogKey();
        return AesUtils.decryptWithMetadata(logKey, encryptedData);
      }

      // Get the KEK version from the encrypted data
      const kekVersion = encryptedData.kekVersion;

      // Get the operational KEK for this version
      const operationalKEK = this.getOperationalKEK(kekVersion);

      // Derive the log key for this KEK version
      const logKey = await KeyDerivation.deriveKeyWithHKDF(operationalKEK, {
        salt: 'NeuralLog-LogKey',
        info: 'logs',
        hash: 'SHA-256',
        keyLength: 256 // 32 bytes
      });

      // Decrypt data using AesEncryptionUtils
      return AesUtils.decryptWithMetadata(logKey, encryptedData);
    } catch (error) {
      return this.handleError(error, 'decrypt log data', 'decrypt_log_data_failed');
    }
  }

  /**
   * Generate search tokens
   *
   * @param query Search query or data object
   * @param searchKey Optional search key (if not provided, will derive from current KEK)
   * @returns Promise that resolves to the search tokens
   */
  public async generateSearchTokens(query: string | any, searchKey?: Uint8Array): Promise<string[]> {
    try {
      // If searchKey is not provided, derive it from the current KEK
      if (!searchKey) {
        searchKey = await this.deriveSearchKey();
      }

      // Generate search tokens using HmacUtils
      return HmacUtils.generateSearchTokens(query, searchKey);
    } catch (error) {
      return this.handleError(error, 'generate search tokens', 'generate_search_tokens_failed');
    }
  }

  /**
   * Encrypt log name with the current operational KEK
   *
   * @param logName Log name
   * @returns Promise that resolves to the encrypted log name with version information
   */
  public async encryptLogName(logName: string): Promise<string> {
    try {
      // Get the current KEK version
      const kekVersion = this.getCurrentKEKVersion();

      // Derive the log name key
      const logNameKey = await this.deriveLogNameKey();

      // Encrypt log name using AesUtils
      return AesUtils.encryptWithVersion(logNameKey, logName, kekVersion);
    } catch (error) {
      return this.handleError(error, 'encrypt log name', 'encrypt_log_name_failed');
    }
  }

  /**
   * Decrypt log name using the appropriate KEK version
   *
   * @param encryptedLogName Encrypted log name with version information
   * @returns Promise that resolves to the decrypted log name
   */
  public async decryptLogName(encryptedLogName: string): Promise<string> {
    try {
      // Convert Base64URL to ArrayBuffer
      const combined = Base64Utils.base64UrlToArrayBuffer(encryptedLogName);
      const combinedArray = new Uint8Array(combined);

      // Extract version length, version, IV and encrypted data
      const versionLength = combinedArray[0];
      const versionBytes = combinedArray.slice(1, 1 + versionLength);
      const kekVersion = bytesToUtf8(versionBytes);

      // Get the operational KEK for this version
      const operationalKEK = this.getOperationalKEK(kekVersion);

      // Derive the log name key for this KEK version
      const logNameKey = await KeyDerivation.deriveKeyWithHKDF(operationalKEK, {
        salt: 'NeuralLog-LogNameKey',
        info: 'log-names',
        hash: 'SHA-256',
        keyLength: 256 // 32 bytes
      });

      // Decrypt log name using AesUtils
      const decryptedResult = AesUtils.decryptWithVersion(logNameKey, encryptedLogName);
      return decryptedResult.data;
    } catch (error) {
      return this.handleError(error, 'decrypt log name', 'decrypt_log_name_failed');
    }
  }

  /**
   * Derive a master secret from tenant ID and recovery phrase
   *
   * @param tenantId Tenant ID
   * @param recoveryPhrase Recovery phrase
   * @returns Promise that resolves to the master secret
   */
  public async deriveMasterSecret(tenantId: string, recoveryPhrase: string): Promise<Uint8Array> {
    try {
      // Create salt from tenant ID
      const salt = `NeuralLog-${tenantId}-MasterSecret`;

      // Derive key using PBKDF2
      return await KeyDerivation.deriveKeyWithPBKDF2(recoveryPhrase, {
        salt,
        iterations: 100000,
        hash: 'SHA-256',
        keyLength: 256 // 32 bytes
      });
    } catch (error) {
      return this.handleError(error, 'derive master secret', 'derive_master_secret_failed');
    }
  }

  /**
   * Derive a master secret from tenant ID and mnemonic phrase
   *
   * @param tenantId Tenant ID
   * @param mnemonicPhrase BIP-39 mnemonic phrase
   * @returns Promise that resolves to the master secret
   */
  public async deriveMasterSecretFromMnemonic(tenantId: string, mnemonicPhrase: string): Promise<Uint8Array> {
    try {
      // Validate mnemonic phrase
      if (!this.mnemonicService.validateMnemonic(mnemonicPhrase)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Convert mnemonic to seed
      const seed = this.mnemonicService.mnemonicToSeed(mnemonicPhrase, tenantId);

      // Derive bits using HKDF
      return await KeyDerivation.deriveKeyWithHKDF(seed, {
        salt: `neurallog:${tenantId}`,
        info: 'master-secret',
        hash: 'SHA-256',
        keyLength: 256 // 32 bytes
      });
    } catch (error) {
      return this.handleError(error, 'derive master secret from mnemonic', 'derive_master_secret_from_mnemonic_failed');
    }
  }

  /**
   * Generate a Key Encryption Key (KEK)
   *
   * @param version Optional version identifier (defaults to 'v1')
   * @returns Promise that resolves to the KEK and sets it as the current version
   */
  public async generateKEK(version: string = 'v1'): Promise<Uint8Array> {
    try {
      // Generate a random key
      const key = RandomUtils.generateRandomBytes(32);

      // Store in the map
      this.operationalKEKs.set(version, key);

      // Update current version
      this.currentKEKVersion = version;

      return key;
    } catch (error) {
      return this.handleError(error, 'generate KEK', 'generate_kek_failed');
    }
  }

  /**
   * Derive the Master KEK from the master secret
   *
   * @param masterSecret Master secret
   * @returns Promise that resolves to the master KEK
   */
  public async deriveMasterKEK(masterSecret: Uint8Array): Promise<Uint8Array> {
    try {
      // Derive bits using HKDF
      const derivedKey = await KeyDerivation.deriveKeyWithHKDF(masterSecret, {
        salt: 'NeuralLog-MasterKEK',
        info: 'master-key-encryption-key',
        hash: 'SHA-256',
        keyLength: 256 // 32 bytes
      });

      // Store the master KEK
      this.masterKEK = derivedKey;

      return derivedKey;
    } catch (error) {
      return this.handleError(error, 'derive master KEK', 'derive_master_kek_failed');
    }
  }

  /**
   * Derive an Operational KEK from the master KEK
   *
   * @param version KEK version identifier
   * @returns Promise that resolves to the operational KEK
   */
  public async deriveOperationalKEK(version: string): Promise<Uint8Array> {
    try {
      if (!this.masterKEK) {
        throw new Error('Master KEK not initialized');
      }

      // Derive bits using HKDF
      const operationalKEK = await KeyDerivation.deriveKeyWithHKDF(this.masterKEK, {
        salt: `NeuralLog-OpKEK-${version}`,
        info: 'operational-key-encryption-key',
        hash: 'SHA-256',
        keyLength: 256 // 32 bytes
      });

      // Store in the map
      this.operationalKEKs.set(version, operationalKEK);

      // Update current version if not set
      if (!this.currentKEKVersion) {
        this.currentKEKVersion = version;
      }

      return operationalKEK;
    } catch (error) {
      return this.handleError(error, 'derive KEK', 'derive_kek_failed');
    }
  }

  /**
   * Encrypt a Key Encryption Key (KEK) with a master secret
   *
   * @param kek KEK
   * @param masterSecret Master secret
   * @param version Optional KEK version identifier
   * @returns Promise that resolves to the encrypted KEK
   */
  public async encryptKEK(kek: Uint8Array, masterSecret: string, version: string = 'v1'): Promise<EncryptedKEK> {
    try {
      // Decode master secret
      const masterKeyBytes = this.base64ToArrayBuffer(masterSecret);

      // Import master key
      const masterKey = await crypto.subtle.importKey(
        'raw',
        masterKeyBytes,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt KEK
      const encryptedKEK = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128
        },
        masterKey,
        kek
      );

      // Convert to Base64
      const encryptedKEKBase64 = this.arrayBufferToBase64(encryptedKEK);
      const ivBase64 = this.arrayBufferToBase64(iv);

      // Return encrypted KEK
      return {
        // Note: The 'encrypted' property is not in the EncryptedKEK interface
        // but is used internally. We cast to any to avoid type errors.
        data: encryptedKEKBase64,
        iv: ivBase64,
        version
      } as EncryptedKEK;
    } catch (error) {
      return this.handleError(error, 'encrypt KEK', 'encrypt_kek_failed');
    }
  }

  /**
   * Decrypt a Key Encryption Key (KEK) with a master secret
   *
   * @param encryptedKEK Encrypted KEK
   * @param masterSecret Master secret
   * @returns Promise that resolves to the decrypted KEK
   */
  public async decryptKEK(encryptedKEK: EncryptedKEK, masterSecret: string): Promise<Uint8Array> {
    try {
      // Decode master secret
      const masterKeyBytes = this.base64ToArrayBuffer(masterSecret);

      // Import master key
      const masterKey = await crypto.subtle.importKey(
        'raw',
        masterKeyBytes,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Get IV and encrypted data
      const iv = this.base64ToArrayBuffer(encryptedKEK.iv);
      const encryptedData = this.base64ToArrayBuffer(encryptedKEK.data);

      // Decrypt KEK
      const decryptedKEK = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128
        },
        masterKey,
        encryptedData
      );

      // Return decrypted KEK
      return new Uint8Array(decryptedKEK);
    } catch (error) {
      return this.handleError(error, 'decrypt KEK', 'decrypt_kek_failed');
    }
  }

  /**
   * Generate a unique ID
   *
   * @returns Promise that resolves to the ID
   */
  public async generateId(): Promise<string> {
    return RandomUtils.generateId();
  }

  /**
   * Set the current active KEK version
   *
   * @param version KEK version identifier
   */
  public setCurrentKEKVersion(version: string): void {
    if (!this.operationalKEKs.has(version)) {
      throw new LogError(
        `KEK version ${version} not found`,
        'kek_version_not_found'
      );
    }

    this.currentKEKVersion = version;
  }

  /**
   * Get the current active KEK version
   *
   * @returns Current KEK version identifier
   */
  public getCurrentKEKVersion(): string {
    if (!this.currentKEKVersion) {
      throw new LogError(
        'No active KEK version set',
        'no_active_kek_version'
      );
    }

    return this.currentKEKVersion;
  }

  /**
   * Get the operational KEK for a specific version
   *
   * @param version KEK version identifier
   * @returns Operational KEK
   */
  public getOperationalKEK(version: string): Uint8Array {
    const kek = this.operationalKEKs.get(version);

    if (!kek) {
      throw new LogError(
        `KEK version ${version} not found`,
        'kek_version_not_found'
      );
    }

    return kek;
  }

  /**
   * Get the current active operational KEK
   *
   * @returns Current operational KEK
   */
  public getCurrentOperationalKEK(): Uint8Array {
    if (!this.currentKEKVersion) {
      throw new LogError(
        'No active KEK version set',
        'no_active_kek_version'
      );
    }

    return this.getOperationalKEK(this.currentKEKVersion);
  }

  /**
   * Derive a log encryption key from the operational KEK
   *
   * @returns Promise that resolves to the log encryption key
   */
  public async deriveLogKey(): Promise<Uint8Array> {
    try {
      // Get the current operational KEK
      const operationalKEK = this.getCurrentOperationalKEK();

      // Derive bits using HKDF
      return await KeyDerivation.deriveKeyWithHKDF(operationalKEK, {
        salt: 'NeuralLog-LogKey',
        info: 'logs',
        hash: 'SHA-256',
        keyLength: 256 // 32 bytes
      });
    } catch (error) {
      return this.handleError(error, 'derive log key', 'derive_log_key_failed');
    }
  }

  /**
   * Derive a log name encryption key from the operational KEK
   *
   * @returns Promise that resolves to the log name encryption key
   */
  public async deriveLogNameKey(): Promise<Uint8Array> {
    try {
      // Get the current operational KEK
      const operationalKEK = this.getCurrentOperationalKEK();

      // Derive bits using HKDF
      return await KeyDerivation.deriveKeyWithHKDF(operationalKEK, {
        salt: 'NeuralLog-LogNameKey',
        info: 'log-names',
        hash: 'SHA-256',
        keyLength: 256 // 32 bytes
      });
    } catch (error) {
      return this.handleError(error, 'derive log name key', 'derive_log_name_key_failed');
    }
  }

  /**
   * Derive a search key from the operational KEK
   *
   * @returns Promise that resolves to the search key
   */
  public async deriveSearchKey(): Promise<Uint8Array> {
    try {
      // Get the current operational KEK
      const operationalKEK = this.getCurrentOperationalKEK();

      // Derive key material using HKDF
      const keyMaterial = await KeyDerivation.deriveKeyWithHKDF(operationalKEK, {
        salt: 'NeuralLog-SearchKey',
        info: 'search',
        hash: 'SHA-256',
        keyLength: 256 // 32 bytes
      });

      // Import as HMAC key
      const hmacKey = await KeyDerivation.importHmacKey(keyMaterial, 'SHA-256');

      // Export key as raw bytes
      const keyBytes = await crypto.subtle.exportKey('raw', hmacKey);

      return new Uint8Array(keyBytes);
    } catch (error) {
      return this.handleError(error, 'derive search key', 'derive_search_key_failed');
    }
  }

  /**
   * Generate a verification hash for an API key
   *
   * @param apiKey API key
   * @returns Promise that resolves to the verification hash
   */
  public async generateApiKeyVerificationHash(apiKey: string): Promise<string> {
    try {
      // Generate hash using HmacUtils
      return HmacUtils.generateApiKeyVerificationHash(apiKey);
    } catch (error) {
      return this.handleError(error, 'generate API key verification hash', 'generate_api_key_verification_hash_failed');
    }
  }

  /**
   * Generate a zero-knowledge proof for an API key
   *
   * @param apiKey API key
   * @returns Promise that resolves to the proof
   */
  public async generateApiKeyProof(apiKey: string): Promise<string> {
    try {
      // Generate proof using HmacUtils
      return HmacUtils.generateApiKeyProof(apiKey);
    } catch (error) {
      return this.handleError(error, 'generate API key proof', 'generate_api_key_proof_failed');
    }
  }

  /**
   * Split a KEK into shares using Shamir's Secret Sharing
   *
   * @param kek The KEK to split
   * @param numShares The number of shares to create
   * @param threshold The minimum number of shares required to reconstruct the KEK
   * @returns Promise that resolves to the shares
   */
  public async splitKEK(kek: Uint8Array, numShares: number, threshold: number): Promise<SecretShare[]> {
    try {
      return ShamirSecretSharing.splitSecret(kek, numShares, threshold);
    } catch (error) {
      return this.handleError(error, 'split KEK', 'split_kek_failed');
    }
  }

  /**
   * Derive a user-specific key pair from the operational KEK and user password
   *
   * @param operationalKEK The operational KEK
   * @param userPassword The user's password
   * @param userId The user's ID
   * @param purpose Purpose identifier (e.g., 'admin-promotion')
   * @returns Promise resolving to the key pair
   */
  public async deriveKeyPair(
    operationalKEK: Uint8Array,
    userPassword: string,
    userId: string,
    purpose: string = 'admin-promotion'
  ): Promise<CryptoKeyPair> {
    try {
      return await this.keyPairService.deriveKeyPair(operationalKEK, userPassword, userId, purpose);
    } catch (error) {
      return this.handleError(error, 'derive key pair', 'derive_key_pair_failed');
    }
  }

  /**
   * Rotate KEK to a new version
   *
   * @param currentKEK The current KEK
   * @param reason Reason for rotation
   * @returns Promise that resolves to the new KEK and version ID
   */
  public async rotateKEK(currentKEK: Uint8Array, reason: string): Promise<{ kek: Uint8Array, versionId: string }> {
    try {
      // Generate a new KEK
      const versionId = await this.generateId();
      const newKEK = await this.generateKEK(versionId);

      // Store in the map
      this.operationalKEKs.set(versionId, newKEK);

      // Update current version
      this.currentKEKVersion = versionId;

      return { kek: newKEK, versionId };
    } catch (error) {
      return this.handleError(error, 'rotate KEK', 'rotate_kek_failed');
    }
  }

  /**
   * Re-encrypt data with a new KEK version
   *
   * @param data The encrypted data
   * @param oldKEKVersion The old KEK version
   * @param newKEKVersion The new KEK version
   * @returns Promise that resolves to the re-encrypted data
   */
  public async reencryptData(data: any, oldKEKVersion: string, newKEKVersion: string): Promise<any> {
    try {
      // Get the old and new KEKs
      const oldKEK = this.getOperationalKEK(oldKEKVersion);
      const newKEK = this.getOperationalKEK(newKEKVersion);

      // Decrypt the data with the old KEK
      const decryptedData = await this.decryptLogData(data, oldKEK);

      // Encrypt the data with the new KEK
      return await this.encryptLogData(decryptedData, newKEK);
    } catch (error) {
      return this.handleError(error, 're-encrypt data', 'reencrypt_data_failed');
    }
  }

  /**
   * Re-encrypt log name with a new KEK version
   *
   * @param encryptedLogName The encrypted log name
   * @param newKEKVersion The new KEK version
   * @returns Promise that resolves to the re-encrypted log name
   */
  public async reencryptLogName(encryptedLogName: string, newKEKVersion: string): Promise<string> {
    try {
      // Decrypt the log name
      const logName = await this.decryptLogName(encryptedLogName);

      // Encrypt the log name with the new KEK version
      return await this.encryptLogName(logName, newKEKVersion);
    } catch (error) {
      return this.handleError(error, 're-encrypt log name', 'reencrypt_log_name_failed');
    }
  }

  /**
   * Export a public key to a format suitable for transmission
   *
   * @param publicKey The public key to export
   * @returns Promise resolving to the exported public key as a base64 string
   */
  public async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    try {
      return await this.keyPairService.exportPublicKey(publicKey);
    } catch (error) {
      return this.handleError(error, 'export public key', 'export_public_key_failed');
    }
  }

  /**
   * Import a public key from a base64 string
   *
   * @param publicKeyBase64 The public key as a base64 string
   * @returns Promise resolving to the imported public key
   */
  public async importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    try {
      return await this.keyPairService.importPublicKey(publicKeyBase64);
    } catch (error) {
      return this.handleError(error, 'import public key', 'import_public_key_failed');
    }
  }

  /**
   * Encrypt data using a public key
   *
   * @param publicKey The public key to use for encryption
   * @param data The data to encrypt
   * @returns Promise resolving to the encrypted data
   */
  public async encryptWithPublicKey(publicKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
    try {
      return await this.keyPairService.encryptWithPublicKey(publicKey, data);
    } catch (error) {
      return this.handleError(error, 'encrypt with public key', 'encrypt_with_public_key_failed');
    }
  }

  /**
   * Decrypt data using a private key
   *
   * @param privateKey The private key to use for decryption
   * @param encryptedData The data to decrypt
   * @returns Promise resolving to the decrypted data
   */
  public async decryptWithPrivateKey(privateKey: CryptoKey, encryptedData: Uint8Array): Promise<Uint8Array> {
    try {
      return await this.keyPairService.decryptWithPrivateKey(privateKey, encryptedData);
    } catch (error) {
      return this.handleError(error, 'decrypt with private key', 'decrypt_with_private_key_failed');
    }
  }

  /**
   * Reconstruct a KEK from shares
   *
   * @param shares The shares to use for reconstruction
   * @returns Promise that resolves to the reconstructed KEK
   */
  public async reconstructKEK(shares: SecretShare[]): Promise<Uint8Array> {
    try {
      return ShamirSecretSharing.reconstructSecret(shares, 32); // KEK is 32 bytes (256 bits)
    } catch (error) {
      return this.handleError(error, 'reconstruct KEK', 'reconstruct_kek_failed');
    }
  }

  /**
   * Initialize the key hierarchy from a recovery phrase
   *
   * @param tenantId Tenant ID
   * @param recoveryPhrase Recovery phrase
   * @param versions KEK versions to recover (if not provided, only the latest version is recovered)
   * @returns Promise that resolves when the key hierarchy is initialized
   */
  public async initializeKeyHierarchy(
    tenantId: string,
    recoveryPhrase: string,
    versions?: string[]
  ): Promise<void> {
    try {
      // Derive the master secret
      const masterSecret = await this.deriveMasterSecret(tenantId, recoveryPhrase);

      // Derive the master KEK
      await this.deriveMasterKEK(masterSecret);

      // If versions are provided, derive those specific operational KEKs
      if (versions && versions.length > 0) {
        for (const version of versions) {
          await this.deriveOperationalKEK(version);
        }

        // Set the current KEK version to the latest one
        const latestVersion = versions.sort().pop();
        if (latestVersion) {
          this.setCurrentKEKVersion(latestVersion);
        }
      } else {
        // Otherwise, derive the default operational KEK
        await this.deriveOperationalKEK('v1');
        this.setCurrentKEKVersion('v1');
      }
    } catch (error) {
      return this.handleError(error, 'initialize key hierarchy', 'initialize_key_hierarchy_failed');
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
      if (!this.masterKEK) {
        throw new Error('Master KEK not initialized');
      }

      for (const version of versions) {
        // Skip if we already have this version
        if (this.operationalKEKs.has(version)) {
          continue;
        }

        // Derive this operational KEK
        await this.deriveOperationalKEK(version);
      }
    } catch (error) {
      return this.handleError(error, 'recover KEK versions', 'recover_kek_versions_failed');
    }
  }

  /**
   * Serialize a secret share for storage or transmission
   *
   * @param share The secret share to serialize
   * @returns The serialized secret share
   */
  public serializeShare(share: SecretShare): SerializedSecretShare {
    return ShamirSecretSharing.serializeShare(share);
  }

  /**
   * Deserialize a secret share
   *
   * @param serializedShare The serialized secret share
   * @returns The deserialized secret share
   */
  public deserializeShare(serializedShare: SerializedSecretShare): SecretShare {
    return ShamirSecretSharing.deserializeShare(serializedShare);
  }
}
