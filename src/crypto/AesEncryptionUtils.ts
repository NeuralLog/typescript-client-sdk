import { LogError } from '../errors';
import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { utf8ToBytes, bytesToUtf8 } from '@noble/ciphers/utils';
import { Base64Utils } from './Base64Utils';

/**
 * Utility class for AES encryption/decryption operations
 */
export class AesEncryptionUtils {
  /**
   * Encrypt data using AES-GCM
   *
   * @param key Encryption key
   * @param data Data to encrypt (string or object)
   * @returns Encrypted data with IV and metadata
   */
  public static encrypt(key: Uint8Array, data: any): Record<string, any> {
    try {
      // Convert data to string if it's an object
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const dataBytes = utf8ToBytes(dataString);
      
      // Generate a random IV
      const iv = randomBytes(12);
      
      // Create AES-GCM cipher
      const cipher = gcm(key, iv);
      
      // Encrypt the data
      const encryptedData = cipher.encrypt(dataBytes);
      
      // Convert to Base64
      const encryptedDataBase64 = Base64Utils.arrayBufferToBase64(encryptedData.buffer);
      const ivBase64 = Base64Utils.arrayBufferToBase64(iv.buffer);
      
      // Return encrypted data with metadata
      return {
        encrypted: true,
        algorithm: 'aes-256-gcm',
        iv: ivBase64,
        data: encryptedDataBase64
      };
    } catch (error) {
      throw new LogError(
        `Failed to encrypt data: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_data_failed'
      );
    }
  }
  
  /**
   * Decrypt data using AES-GCM
   *
   * @param key Decryption key
   * @param encryptedData Encrypted data with IV and metadata
   * @returns Decrypted data
   */
  public static decrypt(key: Uint8Array, encryptedData: Record<string, any> | string): any {
    // If encryptedData is a string, try to parse it as JSON
    if (typeof encryptedData === 'string') {
      try {
        encryptedData = JSON.parse(encryptedData);
      } catch (error) {
        // If parsing fails, return the string as is
        return encryptedData;
      }
    }
    
    // If encryptedData is not an object or doesn't have the required properties, return it as is
    if (typeof encryptedData !== 'object' || !encryptedData || !encryptedData.data || !encryptedData.iv) {
      return encryptedData;
    }
    
    try {
      // Get IV and encrypted data
      const iv = new Uint8Array(Base64Utils.base64ToArrayBuffer(encryptedData.iv));
      const data = new Uint8Array(Base64Utils.base64ToArrayBuffer(encryptedData.data));
      
      // Create AES-GCM cipher
      const cipher = gcm(key, iv);
      
      // Decrypt the data
      const decryptedData = cipher.decrypt(data);
      
      // Convert to string
      const decryptedString = bytesToUtf8(decryptedData);
      
      // Parse JSON if possible
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      throw new LogError(
        `Failed to decrypt data: ${error instanceof Error ? error.message : String(error)}`,
        'decrypt_data_failed'
      );
    }
  }
  
  /**
   * Encrypt a string with version information
   *
   * @param key Encryption key
   * @param data String to encrypt
   * @param version Version identifier
   * @returns Encrypted data as a Base64URL string with embedded version information
   */
  public static encryptWithVersion(key: Uint8Array, data: string, version: string): string {
    try {
      // Convert data to bytes
      const dataBytes = utf8ToBytes(data);
      
      // Generate a random IV
      const iv = randomBytes(12);
      
      // Create AES-GCM cipher
      const cipher = gcm(key, iv);
      
      // Encrypt the data
      const encryptedData = cipher.encrypt(dataBytes);
      
      // Combine version, IV and encrypted data
      const versionBytes = utf8ToBytes(version);
      const versionLength = new Uint8Array([versionBytes.length]);
      
      const combined = new Uint8Array(
        versionLength.length + versionBytes.length + iv.length + encryptedData.length
      );
      
      let offset = 0;
      
      combined.set(versionLength, offset);
      offset += versionLength.length;
      
      combined.set(versionBytes, offset);
      offset += versionBytes.length;
      
      combined.set(iv, offset);
      offset += iv.length;
      
      combined.set(encryptedData, offset);
      
      // Convert to Base64URL
      return Base64Utils.arrayBufferToBase64Url(combined.buffer);
    } catch (error) {
      throw new LogError(
        `Failed to encrypt with version: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_with_version_failed'
      );
    }
  }
  
  /**
   * Decrypt a string with embedded version information
   *
   * @param key Decryption key
   * @param encryptedData Encrypted data as a Base64URL string with embedded version information
   * @returns Object with decrypted data and version information
   */
  public static decryptWithVersion(key: Uint8Array, encryptedData: string): { data: string; version: string } {
    try {
      // Convert Base64URL to ArrayBuffer
      const combined = Base64Utils.base64UrlToArrayBuffer(encryptedData);
      const combinedArray = new Uint8Array(combined);
      
      // Extract version length, version, IV and encrypted data
      const versionLength = combinedArray[0];
      const versionBytes = combinedArray.slice(1, 1 + versionLength);
      const version = bytesToUtf8(versionBytes);
      
      let offset = 1 + versionLength;
      const iv = combinedArray.slice(offset, offset + 12);
      offset += 12;
      const encryptedBytes = combinedArray.slice(offset);
      
      // Create AES-GCM cipher
      const cipher = gcm(key, iv);
      
      // Decrypt the data
      const decryptedData = cipher.decrypt(encryptedBytes);
      
      // Convert to string
      const decryptedString = bytesToUtf8(decryptedData);
      
      return {
        data: decryptedString,
        version
      };
    } catch (error) {
      throw new LogError(
        `Failed to decrypt with version: ${error instanceof Error ? error.message : String(error)}`,
        'decrypt_with_version_failed'
      );
    }
  }
}
