import { LogError } from '../errors';

/**
 * Key hierarchy for the NeuralLog client
 *
 * The key hierarchy is as follows:
 * 1. Master Secret (derived from username:password)
 * 2. Key Encryption Key (KEK) (encrypted with Master Secret)
 * 3. API Key (derived from KEK + Tenant ID + Key ID)
 * 4. Log Encryption Key (derived from API Key + Tenant ID + Log Name)
 * 5. Log Search Key (derived from API Key + Tenant ID + Log Name)
 * 6. Log Name Key (derived from API Key + Tenant ID)
 */
export class KeyHierarchy {
  private static readonly LOG_ENCRYPTION_KEY_CONTEXT = 'log_encryption';
  private static readonly LOG_SEARCH_KEY_CONTEXT = 'log_search';
  private static readonly LOG_NAME_KEY_CONTEXT = 'log_name';
  private static readonly API_KEY_CONTEXT = 'api_key';
  private static readonly KEK_CONTEXT = 'kek';

  private kek: Uint8Array | null = null;

  /**
   * Create a new KeyHierarchy
   *
   * @param kek Key Encryption Key (KEK)
   */
  constructor(kek?: Uint8Array) {
    if (kek) {
      this.kek = kek;
    }
  }

  /**
   * Derive a log encryption key from the tenant ID and log name
   *
   * @param tenantId Tenant ID
   * @param logName Log name
   * @param kekVersion KEK version (optional, defaults to current version)
   * @returns Promise that resolves to the log encryption key
   */
  public async deriveLogEncryptionKey(
    tenantId: string,
    logName: string,
    kekVersion?: string
  ): Promise<Uint8Array> {
    if (!this.kek) {
      throw new LogError('KEK not initialized before deriving log encryption key.', 'initialization_failed');
    }
    const versionSuffix = kekVersion ? `:${kekVersion}` : '';
    const context = `${KeyHierarchy.LOG_ENCRYPTION_KEY_CONTEXT}:${tenantId}:${logName}${versionSuffix}`;
    return this.deriveKeyFromKEK(context);
  }

  /**
   * Derive a log search key from the tenant ID and log name
   *
   * @param tenantId Tenant ID
   * @param logName Log name
   * @param kekVersion KEK version (optional, defaults to current version)
   * @returns Promise that resolves to the log search key
   */
  public async deriveLogSearchKey(
    tenantId: string,
    logName: string,
    kekVersion?: string
  ): Promise<Uint8Array> {
    if (!this.kek) {
      throw new LogError('KEK not initialized before deriving log search key.', 'initialization_failed');
    }
    const versionSuffix = kekVersion ? `:${kekVersion}` : '';
    const context = `${KeyHierarchy.LOG_SEARCH_KEY_CONTEXT}:${tenantId}:${logName}${versionSuffix}`;
    return this.deriveKeyFromKEK(context);
  }

  /**
   * Derive a log name key from the tenant ID
   *
   * @param tenantId Tenant ID
   * @param kekVersion KEK version (optional, defaults to current version)
   * @returns Promise that resolves to the log name key
   */
  public async deriveLogNameKey(
    tenantId: string,
    kekVersion?: string
  ): Promise<Uint8Array> {
    if (!this.kek) {
      throw new LogError('KEK not initialized before deriving log name key.', 'initialization_failed');
    }
    const versionSuffix = kekVersion ? `:${kekVersion}` : '';
    const context = `${KeyHierarchy.LOG_NAME_KEY_CONTEXT}:${tenantId}${versionSuffix}`;
    return this.deriveKeyFromKEK(context);
  }

  /**
   * Initialize the key hierarchy from an API key
   *
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @returns Promise that resolves when the key hierarchy is initialized
   */
  public async initializeFromApiKey(apiKey: string, tenantId: string): Promise<void> {
    try {
      // Derive KEK from API key
      this.kek = await this.deriveKEK(apiKey, tenantId);
    } catch (error) {
      throw new LogError(
        `Failed to initialize key hierarchy from API key: ${error instanceof Error ? error.message : String(error)}`,
        'initialize_key_hierarchy_failed'
      );
    }
  }

  /**
   * Get the current KEK
   *
   * @returns The current KEK or null if not initialized
   */
  public getKEK(): Uint8Array | null {
    return this.kek;
  }

  /**
   * Re-encrypt log data from one KEK version to another
   *
   * @param encryptedData Encrypted log data
   * @param tenantId Tenant ID
   * @param logName Log name
   * @param sourceKekVersion Source KEK version
   * @param targetKekVersion Target KEK version
   * @returns Promise that resolves to the re-encrypted log data
   */
  public async reencryptLogData(
    encryptedData: any,
    tenantId: string,
    logName: string,
    sourceKekVersion: string,
    targetKekVersion: string
  ): Promise<any> {
    if (!this.kek) {
      throw new LogError('KEK not initialized before re-encrypting log data.', 'initialization_failed');
    }

    try {
      // Import crypto service
      const cryptoService = new (await import('./CryptoService')).CryptoService();

      // Derive source log encryption key
      const sourceLogKey = await this.deriveLogEncryptionKey(tenantId, logName, sourceKekVersion);

      // Decrypt data with source key
      const decryptedData = await cryptoService.decryptLogData(encryptedData, sourceLogKey);

      // Derive target log encryption key
      const targetLogKey = await this.deriveLogEncryptionKey(tenantId, logName, targetKekVersion);

      // Re-encrypt data with target key
      const reencryptedData = await cryptoService.encryptLogData(decryptedData, targetLogKey);

      // Add KEK version to the encrypted data
      return {
        ...reencryptedData,
        kekVersion: targetKekVersion
      };
    } catch (error) {
      throw new LogError(
        `Failed to re-encrypt log data: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_log_data_failed'
      );
    }
  }



  /**
   * Derive a KEK from an API key and tenant ID
   *
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @returns Promise that resolves to the KEK
   */
  public async deriveKEK(apiKey: string, tenantId: string): Promise<Uint8Array> {
    const context = `${KeyHierarchy.KEK_CONTEXT}:${tenantId}`;
    return this.deriveKey(apiKey, context);
  }

  /**
   * Derive an API key from a KEK, tenant ID, and key ID
   *
   * @param kek KEK
   * @param tenantId Tenant ID
   * @param keyId Key ID
   * @returns Promise that resolves to the API key
   */
  public async deriveApiKey(kek: Uint8Array, tenantId: string, keyId: string): Promise<string> {
    try {
      const context = `${KeyHierarchy.API_KEY_CONTEXT}:${tenantId}:${keyId}`;

      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        kek,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Derive key
      const derivedKey = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        new TextEncoder().encode(context)
      );

      // Convert to Base64URL
      const apiKey = this.arrayBufferToBase64Url(derivedKey);

      // Add key ID as prefix
      return `${keyId}.${apiKey}`;
    } catch (error) {
      throw new LogError(
        `Failed to derive API key: ${error instanceof Error ? error.message : String(error)}`,
        'derive_api_key_failed'
      );
    }
  }

  /**
   * Derive a key from the KEK and context using HMAC-SHA256.
   * Assumes this.kek is initialized.
   *
   * @param context Context string for the derivation
   * @returns Promise that resolves to the derived key as Uint8Array
   */
  private async deriveKeyFromKEK(context: string): Promise<Uint8Array> {
    if (!this.kek) {
      // This check is redundant if callers already check, but provides safety
      throw new LogError('KEK is not initialized.', 'initialization_failed');
    }
    try {
      // Import the KEK
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        this.kek, // Use the KEK directly (it's already Uint8Array)
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Derive key using HMAC
      const derivedKeyBuffer = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        new TextEncoder().encode(context)
      );

      return new Uint8Array(derivedKeyBuffer);
    } catch (error) {
      throw new LogError(
        `Failed to derive key from KEK: ${error instanceof Error ? error.message : String(error)}`,
        'derive_key_failed' // Use existing code for derivation failures
      );
    }
  }
  /**
   * Derive a key from the specified key material and context
   *
   * @param keyMaterial Key material
   * @param context Context
   * @returns Promise that resolves to the derived key
   */
  private async deriveKey(keyMaterial: string, context: string): Promise<Uint8Array> {
    try {
      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(keyMaterial),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      // Derive key
      const derivedKey = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        new TextEncoder().encode(context)
      );

      return new Uint8Array(derivedKey);
    } catch (error) {
      throw new LogError(
        `Failed to derive key: ${error instanceof Error ? error.message : String(error)}`,
        'derive_key_failed'
      );
    }
  }

  /**
   * Convert an ArrayBuffer to URL-safe Base64
   *
   * @param buffer ArrayBuffer
   * @returns URL-safe Base64 string
   */
  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}
