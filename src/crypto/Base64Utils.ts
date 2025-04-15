import { base64 } from '@scure/base';

/**
 * Utility functions for Base64 encoding/decoding
 */
export class Base64Utils {
  /**
   * Convert an ArrayBuffer to Base64
   *
   * @param buffer ArrayBuffer
   * @returns Base64 string
   */
  public static arrayBufferToBase64(buffer: ArrayBuffer): string {
    return base64.encode(new Uint8Array(buffer));
  }

  /**
   * Convert a Base64 string to ArrayBuffer
   *
   * @param base64Str Base64 string
   * @returns ArrayBuffer
   */
  public static base64ToArrayBuffer(base64Str: string): ArrayBuffer {
    return base64.decode(base64Str).buffer;
  }

  /**
   * Convert an ArrayBuffer to URL-safe Base64
   *
   * @param buffer ArrayBuffer
   * @returns URL-safe Base64 string
   */
  public static arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    return base64.encode(new Uint8Array(buffer))
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
  public static base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
    // Convert URL-safe characters back to standard Base64
    let base64Str = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    while (base64Str.length % 4 !== 0) {
      base64Str += '=';
    }

    return base64.decode(base64Str).buffer;
  }
}
