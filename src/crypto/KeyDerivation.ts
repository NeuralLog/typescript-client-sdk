import { LogError } from '../errors';

/**
 * Options for key derivation
 */
export interface KeyDerivationOptions {
  /**
   * Salt for key derivation
   */
  salt?: Uint8Array | string;
  
  /**
   * Info for key derivation
   */
  info?: Uint8Array | string;
  
  /**
   * Hash algorithm
   */
  hash?: 'SHA-256' | 'SHA-384' | 'SHA-512';
  
  /**
   * Number of iterations for PBKDF2
   */
  iterations?: number;
  
  /**
   * Output key length in bits
   */
  keyLength?: number;
}

/**
 * Utility class for key derivation
 */
export class KeyDerivation {
  /**
   * Derive a key using PBKDF2
   * 
   * @param password Password or key material
   * @param options Key derivation options
   * @returns Promise that resolves to the derived key
   */
  public static async deriveKeyWithPBKDF2(
    password: string | Uint8Array,
    options: KeyDerivationOptions = {}
  ): Promise<Uint8Array> {
    try {
      // Set default options
      const salt = options.salt || new Uint8Array(0);
      const hash = options.hash || 'SHA-256';
      const iterations = options.iterations || 100000;
      const keyLength = options.keyLength || 256;
      
      // Convert string salt to Uint8Array
      const saltBytes = typeof salt === 'string' 
        ? new TextEncoder().encode(salt)
        : salt;
      
      // Convert string password to Uint8Array
      const passwordBytes = typeof password === 'string'
        ? new TextEncoder().encode(password)
        : password;
      
      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      
      // Derive bits using PBKDF2
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations,
          hash
        },
        keyMaterial,
        keyLength
      );
      
      return new Uint8Array(derivedBits);
    } catch (error) {
      throw new LogError(
        `Failed to derive key with PBKDF2: ${error instanceof Error ? error.message : String(error)}`,
        'derive_key_pbkdf2_failed'
      );
    }
  }
  
  /**
   * Derive a key using HKDF
   * 
   * @param keyMaterial Key material
   * @param options Key derivation options
   * @returns Promise that resolves to the derived key
   */
  public static async deriveKeyWithHKDF(
    keyMaterial: Uint8Array,
    options: KeyDerivationOptions = {}
  ): Promise<Uint8Array> {
    try {
      // Set default options
      const salt = options.salt || new Uint8Array(0);
      const info = options.info || new Uint8Array(0);
      const hash = options.hash || 'SHA-256';
      const keyLength = options.keyLength || 256;
      
      // Convert string salt to Uint8Array
      const saltBytes = typeof salt === 'string' 
        ? new TextEncoder().encode(salt)
        : salt;
      
      // Convert string info to Uint8Array
      const infoBytes = typeof info === 'string'
        ? new TextEncoder().encode(info)
        : info;
      
      // Import key material
      const importedKeyMaterial = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'HKDF' },
        false,
        ['deriveBits']
      );
      
      // Derive bits using HKDF
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'HKDF',
          salt: saltBytes,
          info: infoBytes,
          hash
        },
        importedKeyMaterial,
        keyLength
      );
      
      return new Uint8Array(derivedBits);
    } catch (error) {
      throw new LogError(
        `Failed to derive key with HKDF: ${error instanceof Error ? error.message : String(error)}`,
        'derive_key_hkdf_failed'
      );
    }
  }
  
  /**
   * Import a key for AES-GCM
   * 
   * @param keyData Key data
   * @returns Promise that resolves to the imported key
   */
  public static async importAesGcmKey(keyData: Uint8Array): Promise<CryptoKey> {
    try {
      return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new LogError(
        `Failed to import AES-GCM key: ${error instanceof Error ? error.message : String(error)}`,
        'import_aes_gcm_key_failed'
      );
    }
  }
  
  /**
   * Import a key for HMAC
   * 
   * @param keyData Key data
   * @param hash Hash algorithm
   * @returns Promise that resolves to the imported key
   */
  public static async importHmacKey(
    keyData: Uint8Array,
    hash: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
  ): Promise<CryptoKey> {
    try {
      return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash },
        false,
        ['sign', 'verify']
      );
    } catch (error) {
      throw new LogError(
        `Failed to import HMAC key: ${error instanceof Error ? error.message : String(error)}`,
        'import_hmac_key_failed'
      );
    }
  }
}
