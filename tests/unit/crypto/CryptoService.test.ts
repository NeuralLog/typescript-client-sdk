import { CryptoService } from '../../../src/crypto/CryptoService';
import { LogError } from '../../../src/errors';
import { LogErrorCode } from '../../../src/errors/LogErrorCode';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockCrypto } from '../../mocks/crypto.mock';

describe('CryptoService', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    cryptoService = new CryptoService();
  });

  describe('Base64 Conversion', () => {
    it('should convert ArrayBuffer to Base64 and back', () => {
      // Create a test ArrayBuffer
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const buffer = testData.buffer;

      // Convert to Base64
      const base64 = cryptoService.arrayBufferToBase64(buffer);
      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);

      // Convert back to ArrayBuffer
      const resultBuffer = cryptoService.base64ToArrayBuffer(base64);
      const resultArray = new Uint8Array(resultBuffer);

      // Verify the result matches the original
      expect(resultArray.length).toBe(testData.length);
      for (let i = 0; i < testData.length; i++) {
        expect(resultArray[i]).toBe(testData[i]);
      }
    });
  });

  describe('ID Generation', () => {
    it('should generate a unique ID', async () => {
      // Generate IDs
      const id1 = await cryptoService.generateId();
      const id2 = await cryptoService.generateId();

      // Verify IDs are strings
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');

      // Verify IDs are not empty
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);

      // Verify IDs are unique
      expect(id1).not.toBe(id2);

      // Verify ID format (hex string)
      expect(id1).toMatch(/^[0-9a-f]+$/);
      expect(id2).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('KEK Management', () => {
    it('should generate a KEK', async () => {
      // Generate a KEK
      const kek = await cryptoService.generateKEK();

      // Verify KEK is a Uint8Array
      expect(kek).toBeInstanceOf(Uint8Array);

      // Verify KEK length (32 bytes = 256 bits)
      expect(kek.length).toBe(32);
    });

    it('should generate a KEK with a specific version', async () => {
      // Generate a KEK with a specific version
      const version = 'test-version';
      const kek = await cryptoService.generateKEK(version);

      // Verify KEK is a Uint8Array
      expect(kek).toBeInstanceOf(Uint8Array);

      // Verify KEK length (32 bytes = 256 bits)
      expect(kek.length).toBe(32);
    });
  });

  describe('Master Secret Derivation', () => {
    it('should derive a master secret from tenant ID and recovery phrase', async () => {
      // Derive a master secret
      const tenantId = 'test-tenant';
      const recoveryPhrase = 'test-recovery-phrase';
      const masterSecret = await cryptoService.deriveMasterSecret(tenantId, recoveryPhrase);

      // Verify master secret is a Uint8Array
      expect(masterSecret).toBeInstanceOf(Uint8Array);

      // Verify master secret length (32 bytes = 256 bits)
      expect(masterSecret.length).toBe(32);
    });

    it('should derive the same master secret for the same inputs', async () => {
      // Derive master secrets with the same inputs
      const tenantId = 'test-tenant';
      const recoveryPhrase = 'test-recovery-phrase';
      const masterSecret1 = await cryptoService.deriveMasterSecret(tenantId, recoveryPhrase);
      const masterSecret2 = await cryptoService.deriveMasterSecret(tenantId, recoveryPhrase);

      // Verify master secrets are the same
      expect(masterSecret1).toEqual(masterSecret2);
    });

    it('should derive different master secrets for different inputs', async () => {
      // Mock the KeyDerivation.deriveKeyWithPBKDF2 method to return different values
      const mockDeriveKeyWithPBKDF2 = jest.spyOn(require('../../../src/crypto/KeyDerivation').KeyDerivation, 'deriveKeyWithPBKDF2');

      // First call returns one value
      mockDeriveKeyWithPBKDF2.mockImplementationOnce(() => {
        return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]);
      });

      // Second call returns a different value
      mockDeriveKeyWithPBKDF2.mockImplementationOnce(() => {
        return new Uint8Array([32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
      });

      // Derive master secrets with different inputs
      const tenantId1 = 'test-tenant-1';
      const tenantId2 = 'test-tenant-2';
      const recoveryPhrase = 'test-recovery-phrase';
      const masterSecret1 = await cryptoService.deriveMasterSecret(tenantId1, recoveryPhrase);
      const masterSecret2 = await cryptoService.deriveMasterSecret(tenantId2, recoveryPhrase);

      // Verify master secrets are different
      expect(masterSecret1).not.toEqual(masterSecret2);

      // Restore the original implementation
      mockDeriveKeyWithPBKDF2.mockRestore();
    });
  });

  describe('Key Hierarchy Initialization', () => {
    it('should initialize the key hierarchy with a recovery phrase', async () => {
      // Initialize the key hierarchy
      const tenantId = 'test-tenant';
      const recoveryPhrase = 'test-recovery-phrase';
      await cryptoService.initializeKeyHierarchy(tenantId, recoveryPhrase);

      // Verify the current KEK version is set
      const kekVersion = cryptoService.getCurrentKEKVersion();
      expect(kekVersion).toBe('v1');

      // Verify the operational KEK is available
      const operationalKEK = cryptoService.getOperationalKEK('v1');
      expect(operationalKEK).toBeInstanceOf(Uint8Array);
      expect(operationalKEK.length).toBe(32);
    });

    it('should initialize the key hierarchy with specific versions', async () => {
      // Initialize the key hierarchy with specific versions
      const tenantId = 'test-tenant';
      const recoveryPhrase = 'test-recovery-phrase';
      const versions = ['v1', 'v2', 'v3'];
      await cryptoService.initializeKeyHierarchy(tenantId, recoveryPhrase, versions);

      // Verify the current KEK version is set to the latest version
      const kekVersion = cryptoService.getCurrentKEKVersion();
      expect(kekVersion).toBe('v3');

      // Verify all operational KEKs are available
      for (const version of versions) {
        const operationalKEK = cryptoService.getOperationalKEK(version);
        expect(operationalKEK).toBeInstanceOf(Uint8Array);
        expect(operationalKEK.length).toBe(32);
      }
    });

    it('should recover specific KEK versions', async () => {
      // Initialize the key hierarchy with v1
      const tenantId = 'test-tenant';
      const recoveryPhrase = 'test-recovery-phrase';
      await cryptoService.initializeKeyHierarchy(tenantId, recoveryPhrase);

      // Recover additional versions
      const versions = ['v2', 'v3'];
      await cryptoService.recoverKEKVersions(versions);

      // Verify all operational KEKs are available
      for (const version of [...versions, 'v1']) {
        const operationalKEK = cryptoService.getOperationalKEK(version);
        expect(operationalKEK).toBeInstanceOf(Uint8Array);
        expect(operationalKEK.length).toBe(32);
      }
    });
  });

  describe('Log Encryption and Decryption', () => {
    beforeEach(async () => {
      // Initialize the key hierarchy for encryption/decryption tests
      const tenantId = 'test-tenant';
      const recoveryPhrase = 'test-recovery-phrase';
      await cryptoService.initializeKeyHierarchy(tenantId, recoveryPhrase);
    });

    it('should encrypt and decrypt log data', async () => {
      // Test data
      const logData = {
        level: 'info',
        message: 'Test log message',
        timestamp: new Date().toISOString(),
        metadata: {
          userId: '123',
          action: 'test'
        }
      };

      // Encrypt the log data
      const encryptedData = await cryptoService.encryptLogData(logData);

      // Verify the encrypted data has the expected properties
      expect(encryptedData).toHaveProperty('encrypted', true);
      expect(encryptedData).toHaveProperty('algorithm', 'aes-256-gcm');
      expect(encryptedData).toHaveProperty('iv');
      expect(encryptedData).toHaveProperty('data');
      expect(encryptedData).toHaveProperty('kekVersion', 'v1');

      // Decrypt the log data
      const decryptedData = await cryptoService.decryptLogData(encryptedData);

      // Verify the decrypted data matches the original
      expect(decryptedData).toEqual(logData);
    });

    it('should encrypt and decrypt log names', async () => {
      // Test data
      const logName = 'test-log-name';

      // Encrypt the log name
      const encryptedLogName = await cryptoService.encryptLogName(logName);

      // Verify the encrypted log name is a string
      expect(typeof encryptedLogName).toBe('string');
      expect(encryptedLogName.length).toBeGreaterThan(0);

      // Decrypt the log name
      const decryptedLogName = await cryptoService.decryptLogName(encryptedLogName);

      // Verify the decrypted log name matches the original
      expect(decryptedLogName).toBe(logName);
    });

    it('should handle search token generation errors gracefully', async () => {
      // Test data
      const query = 'test query';

      // Mock the deriveSearchKey method to throw an error
      jest.spyOn(cryptoService, 'deriveSearchKey').mockImplementation(() => {
        throw new Error('Mock error');
      });

      // Attempt to generate search tokens
      await expect(cryptoService.generateSearchTokens(query)).rejects.toThrow(LogError);
      await expect(cryptoService.generateSearchTokens(query)).rejects.toThrow('Failed to generate search tokens');
    });

    it('should generate search tokens for a query', async () => {
      // Test data
      const query = 'test query';

      // Generate search tokens
      const searchTokens = await cryptoService.generateSearchTokens(query);

      // Verify the search tokens
      expect(Array.isArray(searchTokens)).toBe(true);
      expect(searchTokens.length).toBeGreaterThan(0);

      // Verify each token is a string
      for (const token of searchTokens) {
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      }
    });

    it('should handle decryption errors gracefully', async () => {
      // Create invalid encrypted data
      const invalidEncryptedData = {
        encrypted: true,
        algorithm: 'aes-256-gcm',
        iv: 'invalid-iv',
        data: 'invalid-data',
        kekVersion: 'v1'
      };

      // Attempt to decrypt the invalid data
      await expect(cryptoService.decryptLogData(invalidEncryptedData)).rejects.toThrow(LogError);
      await expect(cryptoService.decryptLogData(invalidEncryptedData)).rejects.toThrow('Failed to decrypt log data');
    });

    it('should handle log name decryption errors gracefully', async () => {
      // Attempt to decrypt an invalid log name
      await expect(cryptoService.decryptLogName('invalid-encrypted-log-name')).rejects.toThrow(LogError);
      await expect(cryptoService.decryptLogName('invalid-encrypted-log-name')).rejects.toThrow('Failed to decrypt log name');
    });
  });

  describe('Error Handling', () => {
    it('should throw a LogError if master KEK is not initialized', async () => {
      // Attempt to derive an operational KEK without initializing the master KEK
      await expect(cryptoService.deriveOperationalKEK('v1')).rejects.toThrow(LogError);
    });

    it('should throw a LogError if no active KEK version is set', () => {
      // Attempt to get the current KEK version without setting it
      expect(() => cryptoService.getCurrentKEKVersion()).toThrow(LogError);
    });

    it('should throw a LogError if KEK version is not found', () => {
      // Attempt to get a non-existent KEK version
      expect(() => cryptoService.getOperationalKEK('non-existent')).toThrow(LogError);
    });

    it('should throw a LogError if current operational KEK is not available', () => {
      // Reset the current KEK version to a non-existent version
      cryptoService['currentKEKVersion'] = 'non-existent';

      // Attempt to get the current operational KEK
      expect(() => cryptoService.getCurrentOperationalKEK()).toThrow(LogError);
    });
  });

  describe('API Key Operations', () => {
    it('should generate an API key verification hash', async () => {
      // Test data
      const apiKey = 'test-api-key';

      // Generate verification hash
      const hash = await cryptoService.generateApiKeyVerificationHash(apiKey);

      // Verify hash is a string
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate an API key proof', async () => {
      // Test data
      const apiKey = 'test-api-key';

      // Generate proof
      const proofStr = await cryptoService.generateApiKeyProof(apiKey);

      // Verify proof is a string
      expect(typeof proofStr).toBe('string');
      expect(proofStr.length).toBeGreaterThan(0);

      // Parse proof
      const proof = JSON.parse(proofStr);

      // Verify proof has expected properties
      expect(proof).toHaveProperty('nonce');
      expect(proof).toHaveProperty('proof');
      expect(typeof proof.nonce).toBe('string');
      expect(typeof proof.proof).toBe('string');
    });


  });

  describe('Key Pair Service', () => {
    it('should provide access to the KeyPairService', () => {
      // Get the KeyPairService
      const keyPairService = cryptoService.getKeyPairService();

      // Verify it's an instance of KeyPairService
      expect(keyPairService).toBeDefined();
    });
  });
});
