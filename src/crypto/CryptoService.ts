import { LogError } from '../errors';
import { EncryptedKEK, KEKVersion, LogEncryptionInfo } from '../types';
import { ShamirSecretSharing, SecretShare, SerializedSecretShare } from './ShamirSecretSharing';
import { MnemonicService } from './MnemonicService';
import { KeyPairService } from './KeyPairService';
import { KeyDerivation, KeyDerivationOptions } from './KeyDerivation';

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
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  /**
   * Convert a Base64 string to ArrayBuffer
   *
   * @param base64 Base64 string
   * @returns ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  }

  /**
   * Convert an ArrayBuffer to URL-safe Base64
   *
   * @param buffer ArrayBuffer
   * @returns URL-safe Base64 string
   */
  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    return this.arrayBufferToBase64(buffer)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Convert a URL-safe Base64 string to ArrayBuffer
   *
   * @param base64Url URL-safe Base64 string
   * @returns ArrayBuffer
   */
  private base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    return this.base64ToArrayBuffer(base64);
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

      // Convert data to string
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const dataBuffer = new TextEncoder().encode(dataString);

      // Import log key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        logKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128
        },
        cryptoKey,
        dataBuffer
      );

      // Convert to Base64
      const encryptedDataBase64 = this.arrayBufferToBase64(encryptedData);
      const ivBase64 = this.arrayBufferToBase64(iv);

      // Return encrypted data with version information
      return {
        encrypted: true,
        algorithm: 'aes-256-gcm',
        iv: ivBase64,
        data: encryptedDataBase64,
        kekVersion
      };
    } catch (error) {
      throw new LogError(
        `Failed to encrypt log data: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_log_data_failed'
      );
    }
  }

  /**
   * Decrypt log data using the appropriate KEK version
   *
   * @param encryptedData Encrypted log data with version information
   * @returns Promise that resolves to the decrypted log data
   */
  public async decryptLogData(encryptedData: Record<string, any>): Promise<any> {
    try {
      // Get the KEK version from the encrypted data
      const kekVersion = encryptedData.kekVersion || this.getCurrentKEKVersion();

      // Get the operational KEK for this version
      const operationalKEK = this.getOperationalKEK(kekVersion);

      // Import operational KEK as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        operationalKEK,
        { name: 'HKDF' },
        false,
        ['deriveBits', 'deriveKey']
      );

      // Create salt and info for log key
      const salt = new TextEncoder().encode('NeuralLog-LogKey');
      const info = new TextEncoder().encode('logs');

      // Derive log key using HKDF
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt,
          info
        },
        keyMaterial,
        256 // 32 bytes
      );

      const logKey = new Uint8Array(derivedBits);

      // Import log key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        logKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Get IV and encrypted data
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const data = this.base64ToArrayBuffer(encryptedData.data);

      // Decrypt data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128
        },
        cryptoKey,
        data
      );

      // Convert to string
      const decryptedString = new TextDecoder().decode(decryptedData);

      // Parse JSON
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      throw new LogError(
        `Failed to decrypt log data: ${error instanceof Error ? error.message : String(error)}`,
        'decrypt_log_data_failed'
      );
    }
  }

  /**
   * Generate search tokens
   *
   * @param query Search query
   * @param searchKey Search key
   * @returns Promise that resolves to the search tokens
   */
  public async generateSearchTokens(query: string, searchKey: Uint8Array): Promise<string[]> {
    try {
      // Import search key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        searchKey,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Split query into tokens
      const tokens = query.toLowerCase().split(/\s+/);

      // Generate search tokens
      const searchTokens = await Promise.all(
        tokens.map(async (token) => {
          // Generate token hash
          const tokenBuffer = await crypto.subtle.sign(
            'HMAC',
            cryptoKey,
            new TextEncoder().encode(token)
          );

          // Convert to Base64
          return this.arrayBufferToBase64Url(tokenBuffer);
        })
      );

      return searchTokens;
    } catch (error) {
      throw new LogError(
        `Failed to generate search tokens: ${error instanceof Error ? error.message : String(error)}`,
        'generate_search_tokens_failed'
      );
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

      // Import log name key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        logNameKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt log name
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128
        },
        cryptoKey,
        new TextEncoder().encode(logName)
      );

      // Combine version, IV and encrypted data
      const versionBytes = new TextEncoder().encode(kekVersion);
      const versionLength = new Uint8Array([versionBytes.length]);

      const combined = new Uint8Array(versionLength.length + versionBytes.length + iv.length + new Uint8Array(encryptedData).length);
      let offset = 0;

      combined.set(versionLength, offset);
      offset += versionLength.length;

      combined.set(versionBytes, offset);
      offset += versionBytes.length;

      combined.set(iv, offset);
      offset += iv.length;

      combined.set(new Uint8Array(encryptedData), offset);

      // Convert to Base64URL
      return this.arrayBufferToBase64Url(combined.buffer);
    } catch (error) {
      throw new LogError(
        `Failed to encrypt log name: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_log_name_failed'
      );
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
      const combined = this.base64UrlToArrayBuffer(encryptedLogName);
      const combinedArray = new Uint8Array(combined);

      // Extract version length, version, IV and encrypted data
      const versionLength = combinedArray[0];
      const versionBytes = combinedArray.slice(1, 1 + versionLength);
      const kekVersion = new TextDecoder().decode(versionBytes);

      let offset = 1 + versionLength;
      const iv = combinedArray.slice(offset, offset + 12);
      offset += 12;
      const encryptedData = combinedArray.slice(offset);

      // Get the operational KEK for this version
      const operationalKEK = this.getOperationalKEK(kekVersion);

      // Import operational KEK as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        operationalKEK,
        { name: 'HKDF' },
        false,
        ['deriveBits', 'deriveKey']
      );

      // Create salt and info for log name key
      const salt = new TextEncoder().encode('NeuralLog-LogNameKey');
      const info = new TextEncoder().encode('log-names');

      // Derive log name key using HKDF
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt,
          info
        },
        keyMaterial,
        256 // 32 bytes
      );

      const logNameKey = new Uint8Array(derivedBits);

      // Import log name key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        logNameKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt log name
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128
        },
        cryptoKey,
        encryptedData
      );

      // Convert to string
      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      throw new LogError(
        `Failed to decrypt log name: ${error instanceof Error ? error.message : String(error)}`,
        'decrypt_log_name_failed'
      );
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
      throw new LogError(
        `Failed to derive master secret: ${error instanceof Error ? error.message : String(error)}`,
        'derive_master_secret_failed'
      );
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
      throw new LogError(
        `Failed to derive master secret from mnemonic: ${error instanceof Error ? error.message : String(error)}`,
        'derive_master_secret_from_mnemonic_failed'
      );
    }
  }

  /**
   * Generate a Key Encryption Key (KEK)
   *
   * @param version Optional version identifier (defaults to 'v1')
   * @returns Promise that resolves to the KEK
   */
  public async generateKEK(version: string = 'v1'): Promise<Uint8Array> {
    try {
      // Generate a random key
      const key = crypto.getRandomValues(new Uint8Array(32));
      return key;
    } catch (error) {
      throw new LogError(
        `Failed to generate KEK: ${error instanceof Error ? error.message : String(error)}`,
        'generate_kek_failed'
      );
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

      return this.masterKEK;
    } catch (error) {
      throw new LogError(
        `Failed to derive master KEK: ${error instanceof Error ? error.message : String(error)}`,
        'derive_master_kek_failed'
      );
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
      throw new LogError(
        `Failed to derive KEK: ${error instanceof Error ? error.message : String(error)}`,
        'derive_kek_failed'
      );
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
        encrypted: true,
        algorithm: 'aes-256-gcm',
        iv: ivBase64,
        data: encryptedKEKBase64,
        version
      };
    } catch (error) {
      throw new LogError(
        `Failed to encrypt KEK: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_kek_failed'
      );
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
      throw new LogError(
        `Failed to decrypt KEK: ${error instanceof Error ? error.message : String(error)}`,
        'decrypt_kek_failed'
      );
    }
  }

  /**
   * Generate a unique ID
   *
   * @returns Promise that resolves to the ID
   */
  public async generateId(): Promise<string> {
    try {
      // Generate random bytes
      const bytes = crypto.getRandomValues(new Uint8Array(16));

      // Convert to hex string
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      throw new LogError(
        `Failed to generate ID: ${error instanceof Error ? error.message : String(error)}`,
        'generate_id_failed'
      );
    }
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
      throw new LogError(
        `Failed to derive log key: ${error instanceof Error ? error.message : String(error)}`,
        'derive_log_key_failed'
      );
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
      throw new LogError(
        `Failed to derive log name key: ${error instanceof Error ? error.message : String(error)}`,
        'derive_log_name_key_failed'
      );
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
      throw new LogError(
        `Failed to derive search key: ${error instanceof Error ? error.message : String(error)}`,
        'derive_search_key_failed'
      );
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
      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(apiKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Generate hash
      const hashBuffer = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        new TextEncoder().encode('verification')
      );

      // Convert to Base64
      return this.arrayBufferToBase64(hashBuffer);
    } catch (error) {
      throw new LogError(
        `Failed to generate API key verification hash: ${error instanceof Error ? error.message : String(error)}`,
        'generate_api_key_verification_hash_failed'
      );
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
      // Generate a random nonce
      const nonce = crypto.getRandomValues(new Uint8Array(16));
      const nonceBase64 = this.arrayBufferToBase64(nonce);

      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(apiKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Generate proof
      const proofBuffer = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        new TextEncoder().encode(nonceBase64)
      );

      // Convert to Base64
      const proofBase64 = this.arrayBufferToBase64(proofBuffer);

      // Return proof and nonce
      return JSON.stringify({
        nonce: nonceBase64,
        proof: proofBase64
      });
    } catch (error) {
      throw new LogError(
        `Failed to generate API key proof: ${error instanceof Error ? error.message : String(error)}`,
        'generate_api_key_proof_failed'
      );
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
      throw new LogError(
        `Failed to split KEK: ${error instanceof Error ? error.message : String(error)}`,
        'split_kek_failed'
      );
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
      throw new LogError(
        `Failed to derive key pair: ${error instanceof Error ? error.message : String(error)}`,
        'derive_key_pair_failed'
      );
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
      throw new LogError(
        `Failed to export public key: ${error instanceof Error ? error.message : String(error)}`,
        'export_public_key_failed'
      );
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
      throw new LogError(
        `Failed to import public key: ${error instanceof Error ? error.message : String(error)}`,
        'import_public_key_failed'
      );
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
      throw new LogError(
        `Failed to encrypt with public key: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_with_public_key_failed'
      );
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
      throw new LogError(
        `Failed to decrypt with private key: ${error instanceof Error ? error.message : String(error)}`,
        'decrypt_with_private_key_failed'
      );
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
      throw new LogError(
        `Failed to reconstruct KEK: ${error instanceof Error ? error.message : String(error)}`,
        'reconstruct_kek_failed'
      );
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
      throw new LogError(
        `Failed to initialize key hierarchy: ${error instanceof Error ? error.message : String(error)}`,
        'initialize_key_hierarchy_failed'
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
      throw new LogError(
        `Failed to recover KEK versions: ${error instanceof Error ? error.message : String(error)}`,
        'recover_kek_versions_failed'
      );
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
