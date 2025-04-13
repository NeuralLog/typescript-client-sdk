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
   * Derive a log encryption key from the API key, tenant ID, and log name
   *
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @param logName Log name
   * @returns Promise that resolves to the log encryption key
   */
  public async deriveLogEncryptionKey(
    apiKey: string,
    tenantId: string,
    logName: string
  ): Promise<Uint8Array> {
    const context = `${KeyHierarchy.LOG_ENCRYPTION_KEY_CONTEXT}:${tenantId}:${logName}`;
    return this.deriveKey(apiKey, context);
  }

  /**
   * Derive a log search key from the API key, tenant ID, and log name
   *
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @param logName Log name
   * @returns Promise that resolves to the log search key
   */
  public async deriveLogSearchKey(
    apiKey: string,
    tenantId: string,
    logName: string
  ): Promise<Uint8Array> {
    const context = `${KeyHierarchy.LOG_SEARCH_KEY_CONTEXT}:${tenantId}:${logName}`;
    return this.deriveKey(apiKey, context);
  }

  /**
   * Derive a log name key from the API key and tenant ID
   *
   * @param apiKey API key
   * @param tenantId Tenant ID
   * @returns Promise that resolves to the log name key
   */
  public async deriveLogNameKey(
    apiKey: string,
    tenantId: string
  ): Promise<Uint8Array> {
    const context = `${KeyHierarchy.LOG_NAME_KEY_CONTEXT}:${tenantId}`;
    return this.deriveKey(apiKey, context);
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
