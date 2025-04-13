import { LogError } from '../errors';

/**
 * Key hierarchy for the NeuralLog client
 * 
 * The key hierarchy is as follows:
 * 1. API Key
 * 2. Log Encryption Key (derived from API Key + Tenant ID + Log Name)
 * 3. Log Search Key (derived from API Key + Tenant ID + Log Name)
 * 4. Log Name Key (derived from API Key + Tenant ID)
 */
export class KeyHierarchy {
  private static readonly LOG_ENCRYPTION_KEY_CONTEXT = 'log_encryption';
  private static readonly LOG_SEARCH_KEY_CONTEXT = 'log_search';
  private static readonly LOG_NAME_KEY_CONTEXT = 'log_name';
  
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
}
