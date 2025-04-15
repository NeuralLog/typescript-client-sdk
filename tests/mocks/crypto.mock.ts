/**
 * Mock implementation of the Web Crypto API for testing
 */

// Mock implementation of the SubtleCrypto interface
export class MockSubtleCrypto {
  // We're not implementing the full SubtleCrypto interface to avoid TypeScript errors
  // Store generated keys for later retrieval in tests
  private keys: Map<string, CryptoKey> = new Map();
  private keyCounter = 0;

  // Mock implementation of digest
  async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
    // Simple mock implementation that returns a fixed hash
    return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).buffer;
  }

  // Mock implementation of encrypt
  async encrypt(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    data: BufferSource
  ): Promise<ArrayBuffer> {
    // Simple mock implementation that returns the data with a prefix
    const dataArray = new Uint8Array(data as ArrayBuffer);
    const result = new Uint8Array(dataArray.length + 2);
    result[0] = 0xAA; // Prefix to indicate "encrypted"
    result[1] = 0xBB;
    result.set(dataArray, 2);
    return result.buffer;
  }

  // Mock implementation of decrypt
  async decrypt(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    data: BufferSource
  ): Promise<ArrayBuffer> {
    // Simple mock implementation that returns the data without the prefix
    const dataArray = new Uint8Array(data as ArrayBuffer);
    if (dataArray.length < 2 || dataArray[0] !== 0xAA || dataArray[1] !== 0xBB) {
      throw new Error('Invalid encrypted data');
    }
    return dataArray.slice(2).buffer;
  }

  // Mock implementation of sign
  async sign(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    data: BufferSource
  ): Promise<ArrayBuffer> {
    // Simple mock implementation that returns a fixed signature
    return new Uint8Array([0xCC, 0xDD, 0xEE, 0xFF]).buffer;
  }

  // Mock implementation of verify
  async verify(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    signature: BufferSource,
    data: BufferSource
  ): Promise<boolean> {
    // Simple mock implementation that always returns true
    return true;
  }

  // Mock implementation of generateKey
  async generateKey(
    algorithm: AlgorithmIdentifier,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey | CryptoKeyPair> {
    if (
      typeof algorithm === 'object' &&
      'name' in algorithm &&
      (algorithm.name === 'RSASSA-PKCS1-v1_5' ||
        algorithm.name === 'RSA-PSS' ||
        algorithm.name === 'RSA-OAEP' ||
        algorithm.name === 'ECDSA' ||
        algorithm.name === 'ECDH')
    ) {
      // Generate a key pair for asymmetric algorithms
      const id = `key-${++this.keyCounter}`;
      const publicKey: CryptoKey = {
        type: 'public',
        extractable: true,
        algorithm: algorithm as Algorithm,
        usages: keyUsages.filter(usage => ['verify', 'encrypt', 'wrapKey'].includes(usage))
      };
      const privateKey: CryptoKey = {
        type: 'private',
        extractable: extractable,
        algorithm: algorithm as Algorithm,
        usages: keyUsages.filter(usage => ['sign', 'decrypt', 'unwrapKey', 'deriveKey', 'deriveBits'].includes(usage))
      };

      this.keys.set(`${id}-public`, publicKey);
      this.keys.set(`${id}-private`, privateKey);

      return { publicKey, privateKey };
    } else {
      // Generate a single key for symmetric algorithms
      const id = `key-${++this.keyCounter}`;
      const key: CryptoKey = {
        type: 'secret',
        extractable: extractable,
        algorithm: typeof algorithm === 'object' ? algorithm as Algorithm : { name: algorithm.toString() },
        usages: keyUsages
      };

      this.keys.set(id, key);
      return key;
    }
  }

  // Mock implementation of deriveKey
  async deriveKey(
    algorithm: AlgorithmIdentifier,
    baseKey: CryptoKey,
    derivedKeyAlgorithm: AlgorithmIdentifier,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey> {
    // Simple mock implementation that generates a new key
    const id = `derived-key-${++this.keyCounter}`;
    const key: CryptoKey = {
      type: 'secret',
      extractable: extractable,
      algorithm: typeof derivedKeyAlgorithm === 'object'
        ? derivedKeyAlgorithm as Algorithm
        : { name: derivedKeyAlgorithm.toString() },
      usages: keyUsages
    };

    this.keys.set(id, key);
    return key;
  }

  // Mock implementation of deriveBits
  async deriveBits(
    algorithm: AlgorithmIdentifier,
    baseKey: CryptoKey,
    length: number
  ): Promise<ArrayBuffer> {
    // Simple mock implementation that returns a fixed number of bits
    const bytes = Math.ceil(length / 8);
    const result = new Uint8Array(bytes);
    for (let i = 0; i < bytes; i++) {
      result[i] = i % 256;
    }
    return result.buffer;
  }

  // Mock implementation of importKey
  async importKey(
    format: KeyFormat,
    keyData: BufferSource | JsonWebKey,
    algorithm: AlgorithmIdentifier,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey> {
    // Simple mock implementation that returns a new key
    const id = `imported-key-${++this.keyCounter}`;
    const key: CryptoKey = {
      type: format === 'jwk' && (keyData as JsonWebKey).d ? 'private' :
            format === 'jwk' && !(keyData as JsonWebKey).d ? 'public' : 'secret',
      extractable: extractable,
      algorithm: typeof algorithm === 'object' ? algorithm as Algorithm : { name: algorithm.toString() },
      usages: keyUsages
    };

    this.keys.set(id, key);
    return key;
  }

  // Mock implementation of exportKey
  async exportKey(format: KeyFormat, key: CryptoKey): Promise<ArrayBuffer | JsonWebKey> {
    if (format === 'jwk') {
      // Return a mock JWK
      const jwk: JsonWebKey = {
        kty: 'oct',
        k: 'mock-key-data',
        alg: key.algorithm.name,
        ext: key.extractable,
        key_ops: key.usages
      };

      // Add private key properties if it's a private key
      if (key.type === 'private') {
        jwk.d = 'mock-private-key-data';
      }

      return jwk;
    } else {
      // Return a mock ArrayBuffer
      return new Uint8Array([0x01, 0x02, 0x03, 0x04]).buffer;
    }
  }

  // Mock implementation of wrapKey
  async wrapKey(
    format: KeyFormat,
    key: CryptoKey,
    wrappingKey: CryptoKey,
    wrapAlgorithm: AlgorithmIdentifier
  ): Promise<ArrayBuffer> {
    // Simple mock implementation that returns a fixed wrapped key
    return new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD]).buffer;
  }

  // Mock implementation of unwrapKey
  async unwrapKey(
    format: KeyFormat,
    wrappedKey: BufferSource,
    unwrappingKey: CryptoKey,
    unwrapAlgorithm: AlgorithmIdentifier,
    unwrappedKeyAlgorithm: AlgorithmIdentifier,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey> {
    // Simple mock implementation that returns a new key
    const id = `unwrapped-key-${++this.keyCounter}`;
    const key: CryptoKey = {
      type: 'secret',
      extractable: extractable,
      algorithm: typeof unwrappedKeyAlgorithm === 'object'
        ? unwrappedKeyAlgorithm as Algorithm
        : { name: unwrappedKeyAlgorithm.toString() },
      usages: keyUsages
    };

    this.keys.set(id, key);
    return key;
  }
}

// Mock implementation of the Crypto interface
export class MockCrypto {
  // We're not implementing the full Crypto interface to avoid TypeScript errors
  subtle = new MockSubtleCrypto();

  getRandomValues<T extends ArrayBufferView | null>(array: T): T {
    if (array === null) {
      return array;
    }

    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }

    return array;
  }

  randomUUID() {
    // Generate a mock UUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }) as `${string}-${string}-${string}-${string}-${string}`;
  }
}

// Create a singleton instance of the mock
export const mockCrypto = new MockCrypto();

// Helper function to install the mock
export function installMockCrypto(): () => void {
  // Store the original crypto object if it exists
  const originalCrypto = global.crypto;

  // Install the mock
  Object.defineProperty(global, 'crypto', {
    value: mockCrypto,
    writable: true
  });

  // Return a function to restore the original
  return function restoreCrypto(): void {
    Object.defineProperty(global, 'crypto', {
      value: originalCrypto,
      writable: true
    });
  };
}
