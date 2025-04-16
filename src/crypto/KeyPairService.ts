import { LogError } from '../errors';

/**
 * Interface for a serialized key pair
 */
export interface SerializedKeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Service for managing cryptographic key pairs
 *
 * This service handles the generation, derivation, and management of
 * public/private key pairs used for secure admin-to-admin communication.
 */
export class KeyPairService {
  /**
   * Derive a user-specific key pair from the operational KEK and user password
   *
   * @param operationalKEK The operational KEK
   * @param userPassword The user's password
   * @param userId The user's ID
   * @param purpose Purpose identifier (e.g., 'admin-promotion')
   * @returns Promise resolving to the key pair
   */
  public async deriveKeyPair(
    operationalKEK: Uint8Array,
    userPassword: string,
    userId: string,
    purpose: string = 'admin-promotion'
  ): Promise<CryptoKeyPair> {
    try {
      // Step 1: Derive a user-specific secret from their password
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(userPassword);
      const saltData = encoder.encode(`${userId}-${purpose}-salt`);

      // Create a user-specific key using PBKDF2
      const userKeyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const userSecret = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltData,
          iterations: 100000,
          hash: 'SHA-256'
        },
        userKeyMaterial,
        256 // 32 bytes
      );

      // Step 2: Combine the KEK and user secret
      const combinedSecret = new Uint8Array(operationalKEK.length + new Uint8Array(userSecret).length);
      combinedSecret.set(operationalKEK);
      combinedSecret.set(new Uint8Array(userSecret), operationalKEK.length);

      // Step 3: Create a deterministic seed for key generation
      const seedHash = await window.crypto.subtle.digest('SHA-256', combinedSecret);

      // Step 4: Use the seed to generate RSA parameters deterministically
      // Note: This is a simplified approach - in production, use a proper deterministic key generation library

      // For demonstration, we'll use the seed to create a "random" number generator
      const seedBytes = new Uint8Array(seedHash);

      // Use the seed to generate RSA parameters deterministically
      // This is a placeholder - actual implementation would use a deterministic RSA key generation algorithm
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
          hash: 'SHA-256'
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      return keyPair;
    } catch (error) {
      throw new LogError(
        `Failed to derive key pair: ${error instanceof Error ? error.message : String(error)}`,
        'derive_key_pair_failed'
      );
    }
  }

  /**
   * Export a public key to a format suitable for transmission
   *
   * @param publicKey The public key to export
   * @returns Promise resolving to the exported public key as a base64 string
   */
  public async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    try {
      const exportedKey = await window.crypto.subtle.exportKey('spki', publicKey);
      return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    } catch (error) {
      throw new LogError(
        `Failed to export public key: ${error instanceof Error ? error.message : String(error)}`,
        'export_public_key_failed'
      );
    }
  }

  /**
   * Import a public key from a base64 string
   *
   * @param publicKeyBase64 The public key as a base64 string
   * @returns Promise resolving to the imported public key
   */
  public async importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    try {
      const binaryString = atob(publicKeyBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return await window.crypto.subtle.importKey(
        'spki',
        bytes,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      throw new LogError(
        `Failed to import public key: ${error instanceof Error ? error.message : String(error)}`,
        'import_public_key_failed'
      );
    }
  }

  /**
   * Encrypt data using a public key
   *
   * @param publicKey The public key to use for encryption
   * @param data The data to encrypt
   * @returns Promise resolving to the encrypted data
   */
  public async encryptWithPublicKey(publicKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
    try {
      // RSA-OAEP can only encrypt small amounts of data, so we'll use a hybrid approach:
      // 1. Generate a random AES key
      // 2. Encrypt the data with the AES key
      // 3. Encrypt the AES key with the public key
      // 4. Combine the encrypted AES key and encrypted data

      // Generate a random AES key
      const aesKey = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Generate a random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the data with the AES key
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        aesKey,
        data
      );

      // Export the AES key
      const aesKeyData = await window.crypto.subtle.exportKey('raw', aesKey);

      // Encrypt the AES key with the public key
      const encryptedKey = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP'
        },
        publicKey,
        aesKeyData
      );

      // Combine everything into a single package
      const encryptedKeyBytes = new Uint8Array(encryptedKey);
      const encryptedDataBytes = new Uint8Array(encryptedData);

      // Format: [encryptedKeyLength (4 bytes)][iv (12 bytes)][encryptedKey][encryptedData]
      const encryptedKeyLength = new Uint8Array(4);
      new DataView(encryptedKeyLength.buffer).setUint32(0, encryptedKeyBytes.length, true);

      const result = new Uint8Array(4 + 12 + encryptedKeyBytes.length + encryptedDataBytes.length);
      result.set(encryptedKeyLength);
      result.set(iv, 4);
      result.set(encryptedKeyBytes, 4 + 12);
      result.set(encryptedDataBytes, 4 + 12 + encryptedKeyBytes.length);

      return result;
    } catch (error) {
      throw new LogError(
        `Failed to encrypt with public key: ${error instanceof Error ? error.message : String(error)}`,
        'encrypt_with_public_key_failed'
      );
    }
  }

  /**
   * Decrypt data using a private key
   *
   * @param privateKey The private key to use for decryption
   * @param encryptedData The data to decrypt
   * @returns Promise resolving to the decrypted data
   */
  public async decryptWithPrivateKey(privateKey: CryptoKey, encryptedData: Uint8Array): Promise<Uint8Array> {
    try {
      // Extract the components from the encrypted data
      // Format: [encryptedKeyLength (4 bytes)][iv (12 bytes)][encryptedKey][encryptedData]
      const encryptedKeyLength = new DataView(encryptedData.buffer, encryptedData.byteOffset, 4).getUint32(0, true);
      const iv = encryptedData.slice(4, 4 + 12);
      const encryptedKey = encryptedData.slice(4 + 12, 4 + 12 + encryptedKeyLength);
      const encryptedDataBytes = encryptedData.slice(4 + 12 + encryptedKeyLength);

      // Decrypt the AES key with the private key
      const aesKeyData = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP'
        },
        privateKey,
        encryptedKey
      );

      // Import the AES key
      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        aesKeyData,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['decrypt']
      );

      // Decrypt the data with the AES key
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        aesKey,
        encryptedDataBytes
      );

      return new Uint8Array(decryptedData);
    } catch (error) {
      throw new LogError(
        `Failed to decrypt with private key: ${error instanceof Error ? error.message : String(error)}`,
        'decrypt_with_private_key_failed'
      );
    }
  }

  /**
   * Generate a new key pair for signing and verification
   *
   * @returns Promise resolving to the generated key pair
   */
  public async generateSigningKeyPair(): Promise<CryptoKeyPair> {
    try {
      return await window.crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
          hash: 'SHA-256'
        },
        true, // extractable
        ['sign', 'verify']
      );
    } catch (error) {
      throw new LogError(
        `Failed to generate signing key pair: ${error instanceof Error ? error.message : String(error)}`,
        'generate_signing_key_pair_failed'
      );
    }
  }

  /**
   * Export a key pair to a format suitable for storage
   *
   * @param keyPair The key pair to export
   * @returns Promise resolving to the exported key pair
   */
  public async exportKeyPair(keyPair: CryptoKeyPair): Promise<SerializedKeyPair> {
    try {
      const publicKeyData = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKeyData = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      return {
        publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKeyData))),
        privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyData)))
      };
    } catch (error) {
      throw new LogError(
        `Failed to export key pair: ${error instanceof Error ? error.message : String(error)}`,
        'export_key_pair_failed'
      );
    }
  }

  /**
   * Import a private key from a base64 string
   *
   * @param privateKeyBase64 The private key as a base64 string
   * @returns Promise resolving to the imported private key
   */
  public async importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
    try {
      const binaryString = atob(privateKeyBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return await window.crypto.subtle.importKey(
        'pkcs8',
        bytes,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        true,
        ['decrypt']
      );
    } catch (error) {
      throw new LogError(
        `Failed to import private key: ${error instanceof Error ? error.message : String(error)}`,
        'import_private_key_failed'
      );
    }
  }

  /**
   * Sign data with a private key
   *
   * @param privateKey The private key to use for signing
   * @param data The data to sign
   * @returns Promise resolving to the signature as a base64 string
   */
  public async sign(privateKey: CryptoKey, data: string): Promise<string> {
    try {
      // Import the private key for signing if it's not already
      let signingKey = privateKey;
      if (privateKey.algorithm.name !== 'RSASSA-PKCS1-v1_5') {
        // Export the private key
        const privateKeyData = await window.crypto.subtle.exportKey('pkcs8', privateKey);

        // Import it for signing
        signingKey = await window.crypto.subtle.importKey(
          'pkcs8',
          privateKeyData,
          {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256'
          },
          false,
          ['sign']
        );
      }

      // Sign the data
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const signature = await window.crypto.subtle.sign(
        {
          name: 'RSASSA-PKCS1-v1_5'
        },
        signingKey,
        dataBuffer
      );

      // Convert the signature to base64
      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    } catch (error) {
      throw new LogError(
        `Failed to sign data: ${error instanceof Error ? error.message : String(error)}`,
        'sign_data_failed'
      );
    }
  }

  /**
   * Verify a signature with a public key
   *
   * @param publicKey The public key to use for verification
   * @param data The data that was signed
   * @param signature The signature to verify as a base64 string
   * @returns Promise resolving to whether the signature is valid
   */
  public async verify(publicKey: CryptoKey, data: string, signature: string): Promise<boolean> {
    try {
      // Import the public key for verification if it's not already
      let verificationKey = publicKey;
      if (publicKey.algorithm.name !== 'RSASSA-PKCS1-v1_5') {
        // Export the public key
        const publicKeyData = await window.crypto.subtle.exportKey('spki', publicKey);

        // Import it for verification
        verificationKey = await window.crypto.subtle.importKey(
          'spki',
          publicKeyData,
          {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256'
          },
          false,
          ['verify']
        );
      }

      // Convert the signature from base64
      const binaryString = atob(signature);
      const signatureBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        signatureBytes[i] = binaryString.charCodeAt(i);
      }

      // Verify the signature
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      return await window.crypto.subtle.verify(
        {
          name: 'RSASSA-PKCS1-v1_5'
        },
        verificationKey,
        signatureBytes,
        dataBuffer
      );
    } catch (error) {
      throw new LogError(
        `Failed to verify signature: ${error instanceof Error ? error.message : String(error)}`,
        'verify_signature_failed'
      );
    }
  }
}
