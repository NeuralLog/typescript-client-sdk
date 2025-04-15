import { LogError } from '../errors';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2';
import { hmac } from '@noble/hashes/hmac';
import { utf8ToBytes } from '@noble/ciphers/utils';

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
 * Utility class for key derivation using noble-hashes
 */
export class KeyDerivation {
  /**
   * Get the hash function based on the hash algorithm name
   *
   * @param hashAlgorithm Hash algorithm name
   * @returns Hash function
   */
  private static getHashFunction(hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256') {
    switch (hashAlgorithm) {
      case 'SHA-256':
        return sha256;
      case 'SHA-384':
        return sha384;
      case 'SHA-512':
        return sha512;
      default:
        return sha256;
    }
  }

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
        ? utf8ToBytes(salt)
        : salt;

      // Convert string password to Uint8Array
      const passwordBytes = typeof password === 'string'
        ? utf8ToBytes(password)
        : password;

      // Get the hash function
      const hashFunction = this.getHashFunction(hash);

      // Derive key using PBKDF2
      const keyBytes = pbkdf2(hashFunction, passwordBytes, saltBytes, {
        c: iterations,
        dkLen: keyLength / 8 // Convert bits to bytes
      });

      return keyBytes;
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
        ? utf8ToBytes(salt)
        : salt;

      // Convert string info to Uint8Array
      const infoBytes = typeof info === 'string'
        ? utf8ToBytes(info)
        : info;

      // Get the hash function
      const hashFunction = this.getHashFunction(hash);

      // Derive key using HKDF
      const keyBytes = hkdf(hashFunction, keyMaterial, saltBytes, infoBytes, keyLength / 8);

      return keyBytes;
    } catch (error) {
      throw new LogError(
        `Failed to derive key with HKDF: ${error instanceof Error ? error.message : String(error)}`,
        'derive_key_hkdf_failed'
      );
    }
  }

  /**
   * Create an HMAC function with the given key and hash algorithm
   *
   * @param key HMAC key
   * @param hashAlgorithm Hash algorithm
   * @returns HMAC function
   */
  public static createHmacFunction(
    key: Uint8Array,
    hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
  ) {
    const hashFunction = this.getHashFunction(hashAlgorithm);
    return (data: Uint8Array) => hmac(hashFunction, key, data);
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
