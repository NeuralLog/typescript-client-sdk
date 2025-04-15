/**
 * Shamir's Secret Sharing implementation for NeuralLog
 *
 * This implementation uses the 'shamir-secret-sharing' library, which is a simple,
 * independently audited, zero-dependency TypeScript implementation of Shamir's Secret Sharing algorithm.
 */

import { LogError } from '../errors/LogError';
import { split, combine } from 'shamir-secret-sharing';

/**
 * A share of a secret
 */
export interface SecretShare {
  /**
   * The x-coordinate of the share
   */
  x: number;

  /**
   * The y-coordinate of the share (the actual share value)
   */
  y: Uint8Array;
}

/**
 * Serialized secret share for storage or transmission
 */
export interface SerializedSecretShare {
  /**
   * The x-coordinate of the share
   */
  x: number;

  /**
   * The y-coordinate of the share (the actual share value) as a Base64 string
   */
  y: string;
}

/**
 * Shamir's Secret Sharing implementation using the 'shamir-secret-sharing' library
 */
export class ShamirSecretSharing {
  /**
   * Split a secret into n shares such that any m of them can reconstruct the original secret
   *
   * @param secret The secret to split
   * @param numShares The number of shares to create
   * @param threshold The minimum number of shares required to reconstruct the secret
   * @returns Array of secret shares
   */
  public static async splitSecret(secret: Uint8Array, numShares: number, threshold: number): Promise<SecretShare[]> {
    if (numShares < threshold) {
      throw new LogError('Number of shares must be greater than or equal to threshold', 'invalid_parameters');
    }

    if (threshold < 2) {
      throw new LogError('Threshold must be at least 2', 'invalid_parameters');
    }

    try {
      // Use the library to split the secret
      const shares = await split(secret, numShares, threshold);

      // Convert the shares to our format
      return shares.map((share, index) => ({
        x: index + 1, // Use 1-based indexing for x-coordinates
        y: share
      }));
    } catch (error: any) {
      throw new LogError(`Failed to split secret: ${error.message || 'Unknown error'}`, 'crypto_error');
    }
  }

  /**
   * Reconstruct a secret from shares
   *
   * @param shares The shares to use for reconstruction
   * @param secretLength The length of the original secret in bytes
   * @returns The reconstructed secret
   */
  public static async reconstructSecret(shares: SecretShare[], secretLength: number): Promise<Uint8Array> {
    if (shares.length < 2) {
      throw new LogError('At least 2 shares are required to reconstruct the secret', 'invalid_parameters');
    }

    try {
      // Convert our shares to the format expected by the library
      const libraryShares = shares.map(share => share.y);

      // Use the library to reconstruct the secret
      const secret = await combine(libraryShares);

      // Ensure the secret has the expected length
      if (secret.length !== secretLength) {
        // If the lengths don't match, create a new array with the expected length
        const result = new Uint8Array(secretLength);
        const copyLength = Math.min(secret.length, secretLength);
        result.set(secret.slice(0, copyLength));
        return result;
      }

      return secret;
    } catch (error: any) {
      throw new LogError(`Failed to reconstruct secret: ${error.message || 'Unknown error'}`, 'crypto_error');
    }
  }

  /**
   * Serialize a secret share for storage or transmission
   *
   * @param share The secret share to serialize
   * @returns The serialized secret share
   */
  public static serializeShare(share: SecretShare): SerializedSecretShare {
    return {
      x: share.x,
      y: btoa(String.fromCharCode(...share.y))
    };
  }

  /**
   * Deserialize a secret share
   *
   * @param serializedShare The serialized secret share
   * @returns The deserialized secret share
   */
  public static deserializeShare(serializedShare: SerializedSecretShare): SecretShare {
    const binaryString = atob(serializedShare.y);
    const y = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      y[i] = binaryString.charCodeAt(i);
    }

    return {
      x: serializedShare.x,
      y
    };
  }
}
