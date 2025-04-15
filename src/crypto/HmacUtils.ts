import { hmac } from '@noble/hashes/hmac';
import { sha256, sha384, sha512 } from '@noble/hashes/sha2';
import { utf8ToBytes } from '@noble/ciphers/utils';
import { Base64Utils } from './Base64Utils';
import { RandomUtils } from './RandomUtils';
import { LogError } from '../errors';
import { LogErrorCode } from '../errors/LogErrorCode';

/**
 * Utility functions for HMAC operations
 */
export class HmacUtils {
  /**
   * Helper method to handle errors consistently
   *
   * @param error The error to handle
   * @param operation The operation that failed
   * @param errorCode The error code to use
   * @throws LogError with a consistent format
   */
  protected static handleError(error: unknown, operation: string, errorCode: LogErrorCode): never {
    throw new LogError(
      `Failed to ${operation}: ${error instanceof Error ? error.message : String(error)}`,
      errorCode
    );
  }
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
   * Generate an HMAC
   *
   * @param key HMAC key
   * @param data Data to hash
   * @param hashAlgorithm Hash algorithm
   * @returns HMAC
   */
  public static generateHmac(
    key: Uint8Array,
    data: Uint8Array | string,
    hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
  ): Uint8Array {
    try {
      // Convert string data to Uint8Array if needed
      const dataBytes = typeof data === 'string' ? utf8ToBytes(data) : data;

      // Get the hash function
      const hashFunction = this.getHashFunction(hashAlgorithm);

      // Generate HMAC
      return hmac(hashFunction, key, dataBytes);
    } catch (error) {
      return this.handleError(error, 'generate HMAC', 'generate_hmac_failed');
    }
  }

  /**
   * Generate search tokens from a query string or object
   *
   * @param query Search query or data object
   * @param searchKey Search key
   * @returns Array of search tokens
   */
  public static generateSearchTokens(query: string | any, searchKey: Uint8Array): string[] {
    try {
      // If query is an object, convert it to a string
      const queryStr = typeof query === 'string' ? query : JSON.stringify(query);

      // Split query into tokens
      const tokens = queryStr.toLowerCase().split(/\s+/);

      // Generate search tokens
      return tokens.map(token => {
        // Generate token hash
        const tokenHash = this.generateHmac(searchKey, token, 'SHA-256');

        // Convert to Base64URL
        return Base64Utils.arrayBufferToBase64Url(tokenHash.buffer);
      });
    } catch (error) {
      return this.handleError(error, 'generate search tokens', 'generate_search_tokens_failed');
    }
  }

  /**
   * Generate a verification hash for an API key
   *
   * @param apiKey API key
   * @returns Verification hash as a Base64 string
   */
  public static generateApiKeyVerificationHash(apiKey: string): string {
    try {
      // Convert API key to bytes
      const keyBytes = utf8ToBytes(apiKey);

      // Generate hash
      const hashBytes = this.generateHmac(keyBytes, 'verification', 'SHA-256');

      // Convert to Base64
      return Base64Utils.arrayBufferToBase64(hashBytes.buffer);
    } catch (error) {
      return this.handleError(error, 'generate API key verification hash', 'generate_api_key_verification_hash_failed');
    }
  }

  /**
   * Generate a zero-knowledge proof for an API key
   *
   * @param apiKey API key
   * @returns Proof as a JSON string
   */
  public static generateApiKeyProof(apiKey: string): string {
    try {
      // Generate a random nonce
      const nonce = RandomUtils.generateRandomBytes(16);
      const nonceBase64 = Base64Utils.arrayBufferToBase64(nonce.buffer);

      // Convert API key to bytes
      const keyBytes = utf8ToBytes(apiKey);

      // Generate proof
      const proofBytes = this.generateHmac(keyBytes, nonceBase64, 'SHA-256');

      // Convert to Base64
      const proofBase64 = Base64Utils.arrayBufferToBase64(proofBytes.buffer);

      // Return proof and nonce
      return JSON.stringify({
        nonce: nonceBase64,
        proof: proofBase64
      });
    } catch (error) {
      return this.handleError(error, 'generate API key proof', 'generate_api_key_proof_failed');
    }
  }
}
