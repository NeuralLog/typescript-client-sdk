import { randomBytes } from '@noble/ciphers/webcrypto';
import { bytesToHex } from '@noble/ciphers/utils';
import { LogError } from '../errors';
import { LogErrorCode } from '../errors/LogErrorCode';

/**
 * Utility functions for random operations
 */
export class RandomUtils {
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
   * Generate a random ID
   *
   * @param length Length of the ID in bytes (default: 16)
   * @returns Random ID as a hex string
   */
  public static generateId(length: number = 16): string {
    try {
      // Generate random bytes
      const bytes = randomBytes(length);

      // Convert to hex string
      return bytesToHex(bytes);
    } catch (error) {
      return this.handleError(error, 'generate ID', 'generate_id_failed');
    }
  }

  /**
   * Generate random bytes
   *
   * @param length Length of the random bytes
   * @returns Random bytes as a Uint8Array
   */
  public static generateRandomBytes(length: number): Uint8Array {
    try {
      return randomBytes(length);
    } catch (error) {
      return this.handleError(error, 'generate random bytes', 'generate_random_bytes_failed');
    }
  }
}
