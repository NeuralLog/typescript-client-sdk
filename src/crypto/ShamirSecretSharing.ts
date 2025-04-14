/**
 * Shamir's Secret Sharing implementation for NeuralLog
 * 
 * This implementation is based on the paper "How to Share a Secret" by Adi Shamir.
 * It allows splitting a secret into n shares such that any m of them can reconstruct
 * the original secret, but m-1 shares reveal no information about the secret.
 */

import { LogError } from '../errors/LogError';

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
 * Shamir's Secret Sharing implementation
 */
export class ShamirSecretSharing {
  /**
   * Prime number for finite field arithmetic (2^256 - 189)
   * This is a safe prime that's large enough for our purposes
   */
  private static readonly PRIME = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
  
  /**
   * Split a secret into n shares such that any m of them can reconstruct the original secret
   * 
   * @param secret The secret to split
   * @param numShares The number of shares to create
   * @param threshold The minimum number of shares required to reconstruct the secret
   * @returns Array of secret shares
   */
  public static splitSecret(secret: Uint8Array, numShares: number, threshold: number): SecretShare[] {
    if (numShares < threshold) {
      throw new LogError('Number of shares must be greater than or equal to threshold', 'invalid_parameters');
    }
    
    if (threshold < 2) {
      throw new LogError('Threshold must be at least 2', 'invalid_parameters');
    }
    
    const shares: SecretShare[] = [];
    
    // Process each byte of the secret separately
    for (let byteIndex = 0; byteIndex < secret.length; byteIndex++) {
      // Generate random coefficients for the polynomial
      const coefficients: bigint[] = [];
      coefficients.push(BigInt(secret[byteIndex])); // a0 = secret byte
      
      // Generate random coefficients a1 through a_{threshold-1}
      for (let i = 1; i < threshold; i++) {
        // Generate a random coefficient in the range [0, PRIME-1]
        const randomValue = this.getRandomBigInt(this.PRIME);
        coefficients.push(randomValue);
      }
      
      // Generate shares for this byte
      for (let x = 1; x <= numShares; x++) {
        // Evaluate the polynomial at x
        const xBigInt = BigInt(x);
        let y = coefficients[0]; // Start with the constant term (a0)
        
        // Add the remaining terms: a1*x + a2*x^2 + ... + a_{threshold-1}*x^{threshold-1}
        for (let i = 1; i < threshold; i++) {
          // y += coefficients[i] * x^i
          y = this.mod(y + coefficients[i] * this.modPow(xBigInt, BigInt(i), this.PRIME), this.PRIME);
        }
        
        // Convert y to a byte
        const yByte = Number(y & BigInt(0xFF));
        
        // Add the share for this byte
        if (byteIndex === 0) {
          // First byte, create a new share
          shares.push({
            x,
            y: new Uint8Array([yByte])
          });
        } else {
          // Append to existing share
          const newY = new Uint8Array(shares[x - 1].y.length + 1);
          newY.set(shares[x - 1].y);
          newY[byteIndex] = yByte;
          shares[x - 1].y = newY;
        }
      }
    }
    
    return shares;
  }
  
  /**
   * Reconstruct a secret from shares
   * 
   * @param shares The shares to use for reconstruction
   * @param secretLength The length of the original secret in bytes
   * @returns The reconstructed secret
   */
  public static reconstructSecret(shares: SecretShare[], secretLength: number): Uint8Array {
    if (shares.length < 2) {
      throw new LogError('At least 2 shares are required to reconstruct the secret', 'invalid_parameters');
    }
    
    // Check that all shares have the same length
    const shareLength = shares[0].y.length;
    for (const share of shares) {
      if (share.y.length !== shareLength) {
        throw new LogError('All shares must have the same length', 'invalid_parameters');
      }
    }
    
    // Reconstruct each byte of the secret separately
    const secret = new Uint8Array(secretLength);
    
    for (let byteIndex = 0; byteIndex < secretLength; byteIndex++) {
      // Extract the shares for this byte
      const byteShares: { x: bigint; y: bigint }[] = shares.map(share => ({
        x: BigInt(share.x),
        y: BigInt(share.y[byteIndex])
      }));
      
      // Reconstruct the byte using Lagrange interpolation
      let secretByte = BigInt(0);
      
      for (let i = 0; i < byteShares.length; i++) {
        let numerator = BigInt(1);
        let denominator = BigInt(1);
        
        for (let j = 0; j < byteShares.length; j++) {
          if (i !== j) {
            numerator = this.mod(numerator * byteShares[j].x, this.PRIME);
            denominator = this.mod(denominator * this.mod(byteShares[j].x - byteShares[i].x, this.PRIME), this.PRIME);
          }
        }
        
        const lagrangeBasis = this.mod(numerator * this.modInverse(denominator, this.PRIME), this.PRIME);
        secretByte = this.mod(secretByte + byteShares[i].y * lagrangeBasis, this.PRIME);
      }
      
      // Convert the reconstructed byte to a number and store it
      secret[byteIndex] = Number(secretByte & BigInt(0xFF));
    }
    
    return secret;
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
  
  /**
   * Calculate (base^exponent) % modulus efficiently
   * 
   * @param base The base
   * @param exponent The exponent
   * @param modulus The modulus
   * @returns (base^exponent) % modulus
   */
  private static modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    if (modulus === BigInt(1)) return BigInt(0);
    
    let result = BigInt(1);
    base = this.mod(base, modulus);
    
    while (exponent > BigInt(0)) {
      if (exponent & BigInt(1)) {
        result = this.mod(result * base, modulus);
      }
      
      exponent = exponent >> BigInt(1);
      base = this.mod(base * base, modulus);
    }
    
    return result;
  }
  
  /**
   * Calculate the modular multiplicative inverse using the extended Euclidean algorithm
   * 
   * @param a The number to find the inverse of
   * @param m The modulus
   * @returns The modular multiplicative inverse of a modulo m
   */
  private static modInverse(a: bigint, m: bigint): bigint {
    a = this.mod(a, m);
    
    if (a === BigInt(0)) {
      throw new LogError('Modular inverse does not exist', 'math_error');
    }
    
    let [oldR, r] = [a, m];
    let [oldS, s] = [BigInt(1), BigInt(0)];
    let [oldT, t] = [BigInt(0), BigInt(1)];
    
    while (r !== BigInt(0)) {
      const quotient = oldR / r;
      [oldR, r] = [r, oldR - quotient * r];
      [oldS, s] = [s, oldS - quotient * s];
      [oldT, t] = [t, oldT - quotient * t];
    }
    
    if (oldR !== BigInt(1)) {
      throw new LogError('Modular inverse does not exist', 'math_error');
    }
    
    return this.mod(oldS, m);
  }
  
  /**
   * Calculate a % b, ensuring the result is always positive
   * 
   * @param a The dividend
   * @param b The divisor
   * @returns a % b, always positive
   */
  private static mod(a: bigint, b: bigint): bigint {
    return ((a % b) + b) % b;
  }
  
  /**
   * Generate a random BigInt in the range [0, max-1]
   * 
   * @param max The maximum value (exclusive)
   * @returns A random BigInt
   */
  private static getRandomBigInt(max: bigint): bigint {
    const bytes = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(bytes);
    
    let result = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      result = (result << BigInt(8)) | BigInt(bytes[i]);
    }
    
    return result % max;
  }
}
