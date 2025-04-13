import { LogError } from '../errors';

/**
 * Service for cryptographic operations
 */
export class CryptoService {
  /**
   * Encrypt log data
   * 
   * @param data Log data
   * @param key Encryption key
   * @returns Promise that resolves to the encrypted data
   */
  public async encryptLogData(
    data: Record<string, any>,
    key: Uint8Array
  ): Promise<Record<string, any>> {
    try {
      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      // Encrypt data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128
        },
        cryptoKey,
        new TextEncoder().encode(jsonData)
      );
      
      // Convert to Base64
      const encryptedBase64 = this.arrayBufferToBase64(encryptedData);
      const ivBase64 = this.arrayBufferToBase64(iv);
      
      // Return encrypted data
      return {
        encrypted: true,
        algorithm: 'aes-256-gcm',
        iv: ivBase64,
        data: encryptedBase64
      };
    } catch (error) {
      throw new LogError(
        `Failed to encrypt log data: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_log_data_failed'
      );
    }
  }
  
  /**
   * Decrypt log data
   * 
   * @param encryptedData Encrypted data
   * @param key Decryption key
   * @returns Promise that resolves to the decrypted data
   */
  public async decryptLogData(
    encryptedData: Record<string, any>,
    key: Uint8Array
  ): Promise<Record<string, any>> {
    try {
      // Check if data is encrypted
      if (!encryptedData.encrypted) {
        return encryptedData;
      }
      
      // Get IV and encrypted data
      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const data = this.base64ToArrayBuffer(encryptedData.data);
      
      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
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
      
      // Parse JSON
      const jsonData = new TextDecoder().decode(decryptedData);
      return JSON.parse(jsonData);
    } catch (error) {
      throw new LogError(
        `Failed to decrypt log data: ${error instanceof Error ? error.message : String(error)}`,
        'decrypt_log_data_failed'
      );
    }
  }
  
  /**
   * Generate search tokens for the specified query
   * 
   * @param query Search query
   * @param searchKey Search key
   * @returns Promise that resolves to the search tokens
   */
  public async generateSearchTokens(
    query: string,
    searchKey: Uint8Array
  ): Promise<string[]> {
    try {
      const tokens: string[] = [];
      
      // Split query into words
      const words = query.toLowerCase().split(/\\s+/);
      
      // Generate token for each word
      for (const word of words) {
        if (!word) {
          continue;
        }
        
        // Import key
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          searchKey,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        // Generate token
        const tokenBuffer = await crypto.subtle.sign(
          'HMAC',
          cryptoKey,
          new TextEncoder().encode(word)
        );
        
        // Convert to Base64
        const token = this.arrayBufferToBase64(tokenBuffer);
        tokens.push(token);
      }
      
      return tokens;
    } catch (error) {
      throw new LogError(
        `Failed to generate search tokens: ${error instanceof Error ? error.message : String(error)}`,
        'generate_search_tokens_failed'
      );
    }
  }
  
  /**
   * Encrypt a log name
   * 
   * @param logName Log name
   * @param logNameKey Log name key
   * @returns Promise that resolves to the encrypted log name
   */
  public async encryptLogName(
    logName: string,
    logNameKey: Uint8Array
  ): Promise<string> {
    try {
      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        logNameKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
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
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);
      
      // Convert to URL-safe Base64
      return this.arrayBufferToBase64Url(combined);
    } catch (error) {
      throw new LogError(
        `Failed to encrypt log name: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_log_name_failed'
      );
    }
  }
  
  /**
   * Decrypt a log name
   * 
   * @param encryptedLogName Encrypted log name
   * @param logNameKey Log name key
   * @returns Promise that resolves to the decrypted log name
   */
  public async decryptLogName(
    encryptedLogName: string,
    logNameKey: Uint8Array
  ): Promise<string> {
    try {
      // Convert from URL-safe Base64
      const combined = this.base64UrlToArrayBuffer(encryptedLogName);
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);
      
      // Import key
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
      .replace(/\\+/g, '-')
      .replace(/\\//g, '_')
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
}
