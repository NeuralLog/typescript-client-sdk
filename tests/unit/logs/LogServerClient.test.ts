import { LogManager } from '../../../src/managers/LogManager';
import { LogsService } from '../../../src/logs/LogsService';
import { CryptoService } from '../../../src/crypto/CryptoService';
import { AuthService } from '../../../src/auth/AuthService';
import { AuthManager } from '../../../src/auth/AuthManager';
import { LogServerClient } from '../../../src/logs/LogServerClient';
import { LogError } from '../../../src/errors';

// Create mocks
jest.mock('../../../src/logs/LogsService');
jest.mock('../../../src/crypto/CryptoService');
jest.mock('../../../src/auth/AuthService');
jest.mock('../../../src/auth/AuthManager');
jest.mock('../../../src/logs/LogServerClient');

describe('Log Manager Integration Tests', () => {
  let logManager: LogManager;
  let mockLogsService: jest.Mocked<LogsService>;
  let mockCryptoService: jest.Mocked<CryptoService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockAuthManager: jest.Mocked<AuthManager>;
  let mockLogServerClient: jest.Mocked<LogServerClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mocks
    mockLogsService = {
      appendLog: jest.fn().mockResolvedValue('log-id-123'),
      getLogs: jest.fn().mockResolvedValue([{ id: 'log-1', data: { encrypted: 'data' } }]),
      searchLogs: jest.fn().mockResolvedValue([{ id: 'log-1', timestamp: '2023-01-01T00:00:00Z', data: { encrypted: 'data' } }]),
      getBaseUrl: jest.fn().mockReturnValue('https://logs.test.com')
    } as unknown as jest.Mocked<LogsService>;

    mockCryptoService = {
      encryptLogName: jest.fn().mockResolvedValue('encrypted-log-name'),
      encryptLogData: jest.fn().mockResolvedValue({ encrypted: 'data' }),
      decryptLogData: jest.fn().mockResolvedValue({ decrypted: 'data' }),
      deriveSearchKey: jest.fn().mockResolvedValue('search-key'),
      generateSearchTokens: jest.fn().mockResolvedValue(['token1', 'token2']),
      setCurrentKEKVersion: jest.fn()
    } as unknown as jest.Mocked<CryptoService>;

    mockAuthService = {
      getResourceToken: jest.fn().mockResolvedValue('resource-token'),
      getAuthToken: jest.fn().mockResolvedValue('auth-token')
    } as unknown as jest.Mocked<AuthService>;

    mockAuthManager = {
      getAuthToken: jest.fn().mockReturnValue('auth-token')
    } as unknown as jest.Mocked<AuthManager>;

    mockLogServerClient = {
      appendLog: jest.fn().mockResolvedValue('log-id-123'),
      getLogs: jest.fn().mockResolvedValue([{ id: 'log-1', data: { encrypted: 'data' } }]),
      searchLogs: jest.fn().mockResolvedValue([{ id: 'log-1', timestamp: '2023-01-01T00:00:00Z', data: { encrypted: 'data' } }])
    } as unknown as jest.Mocked<LogServerClient>;

    // Mock the LogServerClient constructor
    (LogServerClient as jest.Mock).mockImplementation(() => mockLogServerClient);

    // Create LogManager instance
    logManager = new LogManager(
      mockCryptoService,
      mockLogsService,
      mockAuthService,
      mockAuthManager,
      'test-tenant'
    );

    // Replace the logServerClient property with our mock
    (logManager as any).logServerClient = mockLogServerClient;
  });

  describe('log', () => {
    it('should encrypt log name and data before sending to LogServerClient', async () => {
      // Call log method
      await logManager.log('test-log', { message: 'test message' });

      // Verify encryption was performed
      expect(mockCryptoService.encryptLogName).toHaveBeenCalledWith('test-log');
      expect(mockCryptoService.encryptLogData).toHaveBeenCalledWith({ message: 'test message' });
      expect(mockCryptoService.deriveSearchKey).toHaveBeenCalled();
      expect(mockCryptoService.generateSearchTokens).toHaveBeenCalled();

      // Verify auth token was obtained
      expect(mockAuthManager.getAuthToken).toHaveBeenCalled();
      expect(mockAuthService.getResourceToken).toHaveBeenCalledWith(
        'auth-token',
        'logs/encrypted-log-name'
      );

      // Verify LogServerClient was called with encrypted data
      expect(mockLogServerClient.appendLog).toHaveBeenCalledWith(
        'encrypted-log-name',
        { encrypted: 'data' },
        'resource-token',
        ['token1', 'token2']
      );
    });

    it('should use specified KEK version if provided', async () => {
      // Call log method with KEK version
      await logManager.log('test-log', { message: 'test message' }, { kekVersion: 'v2' });

      // Verify KEK version was set
      expect(mockCryptoService.setCurrentKEKVersion).toHaveBeenCalledWith('v2');
    });

    it('should handle errors when logging', async () => {
      // Mock LogServerClient to throw an error
      mockLogServerClient.appendLog.mockRejectedValue(new Error('Service error'));

      // Call log method and expect it to throw
      await expect(logManager.log('test-log', { message: 'test message' }))
        .rejects.toThrow('Failed to log data: Service error');
    });
  });

  describe('getLogs', () => {
    it('should decrypt logs after retrieving from LogServerClient', async () => {
      // Call getLogs method
      const result = await logManager.getLogs('test-log');

      // Verify encryption was performed
      expect(mockCryptoService.encryptLogName).toHaveBeenCalledWith('test-log');

      // Verify auth token was obtained
      expect(mockAuthManager.getAuthToken).toHaveBeenCalled();
      expect(mockAuthService.getResourceToken).toHaveBeenCalledWith(
        'auth-token',
        'logs/encrypted-log-name'
      );

      // Verify LogServerClient was called with encrypted log name
      expect(mockLogServerClient.getLogs).toHaveBeenCalledWith(
        'encrypted-log-name',
        'resource-token',
        100
      );

      // Verify decryption was performed
      expect(mockCryptoService.decryptLogData).toHaveBeenCalled();

      // Verify result
      expect(result).toEqual([{ decrypted: 'data' }]);
    });

    it('should handle errors when getting logs', async () => {
      // Mock LogServerClient to throw an error
      mockLogServerClient.getLogs.mockRejectedValue(new Error('Service error'));

      // Call getLogs method and expect it to throw
      await expect(logManager.getLogs('test-log'))
        .rejects.toThrow('Failed to get logs: Service error');
    });

    it('should handle decryption errors gracefully', async () => {
      // Mock CryptoService to throw an error during decryption
      mockCryptoService.decryptLogData.mockRejectedValueOnce(new Error('Decryption error'));

      // Call getLogs method
      const result = await logManager.getLogs('test-log');

      // Verify result contains error information
      expect(result[0]).toHaveProperty('error', 'Failed to decrypt log');
      expect(result[0]).toHaveProperty('encryptedWithVersion');
    });
  });

  describe('searchLogs', () => {
    it('should generate search tokens and decrypt results', async () => {
      // Call searchLogs method
      const result = await logManager.searchLogs('test-log', { query: 'search query' });

      // Verify encryption was performed
      expect(mockCryptoService.encryptLogName).toHaveBeenCalledWith('test-log');

      // Verify search tokens were generated
      expect(mockCryptoService.deriveSearchKey).toHaveBeenCalled();
      expect(mockCryptoService.generateSearchTokens).toHaveBeenCalledWith('search query', 'search-key');

      // Verify auth token was obtained
      expect(mockAuthManager.getAuthToken).toHaveBeenCalled();
      expect(mockAuthService.getResourceToken).toHaveBeenCalledWith(
        'auth-token',
        'logs/encrypted-log-name'
      );

      // Verify LogServerClient was called with encrypted log name and search tokens
      expect(mockLogServerClient.searchLogs).toHaveBeenCalledWith(
        'encrypted-log-name',
        ['token1', 'token2'],
        100,
        'resource-token'
      );

      // Verify decryption was performed
      expect(mockCryptoService.decryptLogData).toHaveBeenCalled();

      // Verify result
      expect(result).toEqual([{ decrypted: 'data' }]);
    });

    it('should handle errors when searching logs', async () => {
      // Mock LogServerClient to throw an error
      mockLogServerClient.searchLogs.mockRejectedValue(new Error('Service error'));

      // Call searchLogs method and expect it to throw
      await expect(logManager.searchLogs('test-log', { query: 'search query' }))
        .rejects.toThrow('Failed to search logs: Service error');
    });

    it('should handle decryption errors gracefully', async () => {
      // Mock CryptoService to throw an error during decryption
      mockCryptoService.decryptLogData.mockRejectedValueOnce(new Error('Decryption error'));

      // Call searchLogs method
      const result = await logManager.searchLogs('test-log', { query: 'search query' });

      // Verify result contains error information
      expect(result[0]).toHaveProperty('error', 'Failed to decrypt search result');
      expect(result[0]).toHaveProperty('encryptedWithVersion');
    });
  });
});
