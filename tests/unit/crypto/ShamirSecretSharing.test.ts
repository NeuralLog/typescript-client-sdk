import { ShamirSecretSharing, SecretShare } from '../../../src/crypto/ShamirSecretSharing';
import { jest, describe, it, expect } from '@jest/globals';

describe('ShamirSecretSharing', () => {
  // Test that the class exists and has the expected static methods
  it('should be defined', () => {
    expect(ShamirSecretSharing).toBeDefined();
  });

  it('should have the expected static methods', () => {
    expect(typeof ShamirSecretSharing.splitSecret).toBe('function');
    expect(typeof ShamirSecretSharing.reconstructSecret).toBe('function');
    expect(typeof ShamirSecretSharing.serializeShare).toBe('function');
    expect(typeof ShamirSecretSharing.deserializeShare).toBe('function');
  });

  // Test the splitSecret and reconstructSecret methods
  it('should split a secret into shares and reconstruct it back', async () => {
    // Create a test secret
    const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    // Split the secret into 5 shares with a threshold of 3
    const shares = await ShamirSecretSharing.splitSecret(secret, 5, 3);

    // Verify the shares
    expect(Array.isArray(shares)).toBe(true);
    expect(shares.length).toBe(5);

    // Each share should have x and y properties
    shares.forEach(share => {
      expect(share).toHaveProperty('x');
      expect(share).toHaveProperty('y');
      expect(typeof share.x).toBe('number');
      expect(share.y).toBeInstanceOf(Uint8Array);
    });

    // Reconstruct the secret from 3 shares
    const recoveredSecret = await ShamirSecretSharing.reconstructSecret(shares.slice(0, 3), secret.length);

    // Verify the recovered secret has the expected properties
    expect(recoveredSecret).toBeInstanceOf(Uint8Array);
    expect(recoveredSecret.length).toBe(secret.length);

    // Verify the recovered secret matches the original
    for (let i = 0; i < secret.length; i++) {
      expect(recoveredSecret[i]).toBe(secret[i]);
    }
  });

  it('should require at least 2 shares to reconstruct the secret', async () => {
    // Create a test secret
    const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    // Split the secret into 5 shares with a threshold of 3
    const shares = await ShamirSecretSharing.splitSecret(secret, 5, 3);

    // Attempt to reconstruct with only 1 share
    await expect(ShamirSecretSharing.reconstructSecret([shares[0]], secret.length)).rejects.toThrow();
  });

  it('should handle different share combinations', async () => {
    // Create a test secret
    const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    // Split the secret into 5 shares with a threshold of 3
    const shares = await ShamirSecretSharing.splitSecret(secret, 5, 3);

    // Try different combinations of shares
    const combinations = [
      [0, 1, 2], // First 3 shares
      [0, 2, 4], // Mix of shares
      [2, 3, 4], // Last 3 shares
    ];

    // Test each combination
    for (const combination of combinations) {
      // Select the shares according to the combination
      const selectedShares = combination.map(i => shares[i]);

      // Reconstruct the secret
      const recoveredSecret = await ShamirSecretSharing.reconstructSecret(selectedShares, secret.length);

      // Verify the recovered secret matches the original
      expect(recoveredSecret.length).toBe(secret.length);
      for (let i = 0; i < secret.length; i++) {
        expect(recoveredSecret[i]).toBe(secret[i]);
      }
    }
  });

  it('should handle secrets of different lengths', async () => {
    // Test with different secret lengths
    const secretLengths = [16, 24, 32];

    for (const length of secretLengths) {
      // Create a test secret of the specified length
      const secret = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        // Use a simple pattern to make debugging easier
        secret[i] = (i % 10) + 1; // Values from 1 to 10
      }

      // Split the secret into 5 shares with a threshold of 3
      const shares = await ShamirSecretSharing.splitSecret(secret, 5, 3);

      // Reconstruct the secret from 3 shares
      const recoveredSecret = await ShamirSecretSharing.reconstructSecret(shares.slice(0, 3), secret.length);

      // Verify the recovered secret matches the original
      expect(recoveredSecret.length).toBe(secret.length);
      for (let i = 0; i < secret.length; i++) {
        expect(recoveredSecret[i]).toBe(secret[i]);
      }
    }
  });

  // Test the serializeShare and deserializeShare methods
  it('should serialize and deserialize shares', async () => {
    // Create a test secret with simple values
    const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    // Split the secret into shares
    const shares = await ShamirSecretSharing.splitSecret(secret, 5, 3);

    // Serialize and deserialize each share
    for (const share of shares) {
      // Serialize the share
      const serializedShare = ShamirSecretSharing.serializeShare(share);

      // Verify the serialized share has the expected properties
      expect(serializedShare).toHaveProperty('x');
      expect(serializedShare).toHaveProperty('y');
      expect(typeof serializedShare.x).toBe('number');
      expect(typeof serializedShare.y).toBe('string');

      // Deserialize the share
      const deserializedShare = ShamirSecretSharing.deserializeShare(serializedShare);

      // Verify the deserialized share matches the original
      expect(deserializedShare.x).toBe(share.x);
      expect(deserializedShare.y).toBeInstanceOf(Uint8Array);
      expect(deserializedShare.y.length).toBe(share.y.length);
      for (let i = 0; i < share.y.length; i++) {
        expect(deserializedShare.y[i]).toBe(share.y[i]);
      }
    }

    // Test reconstruction with serialized/deserialized shares
    const testSecret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const testShares = await ShamirSecretSharing.splitSecret(testSecret, 5, 3);

    // Serialize and deserialize the shares
    const serializedShares = testShares.map(share => ShamirSecretSharing.serializeShare(share));
    const deserializedShares = serializedShares.map(serializedShare => ShamirSecretSharing.deserializeShare(serializedShare));

    // Reconstruct the secret using the deserialized shares
    const recoveredSecret = await ShamirSecretSharing.reconstructSecret(deserializedShares.slice(0, 3), testSecret.length);

    // Verify the recovered secret matches the original
    expect(recoveredSecret.length).toBe(testSecret.length);
    for (let i = 0; i < testSecret.length; i++) {
      expect(recoveredSecret[i]).toBe(testSecret[i]);
    }
  });
});
