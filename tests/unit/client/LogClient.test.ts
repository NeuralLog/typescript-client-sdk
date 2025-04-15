import { LogClient } from '../../../src/client/LogClient';
import { LogManager } from '../../../src/managers/LogManager';
import { ConfigurationService } from '../../../src/client/services/ConfigurationService';
import { AuthProvider } from '../../../src/client/services/AuthProvider';



// Mock dependencies
jest.mock('../../../src/managers/LogManager');
jest.mock('../../../src/client/services/ConfigurationService');
jest.mock('../../../src/client/services/AuthProvider');

describe('LogClient', () => {
  let logClient: LogClient;
  let mockLogManager: jest.Mocked<LogManager>;
  let mockConfigService: jest.Mocked<ConfigurationService>;
  let mockAuthProvider: jest.Mocked<AuthProvider>;

  beforeEach(() => {
    mockLogManager = {
      log: jest.fn(),
      getLogs: jest.fn(),
      searchLogs: jest.fn(),
    } as unknown as jest.Mocked<LogManager>;

    mockConfigService = {
      getServerUrl: jest.fn().mockReturnValue('https://api.test.com'),
      getAuthUrl: jest.fn().mockReturnValue('https://auth.test.com'),
      getTenantId: jest.fn().mockReturnValue('test-tenant'),
      getApiKey: jest.fn().mockReturnValue('test-api-key'),
    } as unknown as jest.Mocked<ConfigurationService>;

    mockAuthProvider = {
      getAuthToken: jest.fn().mockReturnValue('test-token'),
      isAuthenticated: jest.fn().mockReturnValue(true),
      checkAuthentication: jest.fn(),
    } as unknown as jest.Mocked<AuthProvider>;

    logClient = new LogClient(
      mockLogManager,
      mockConfigService,
      mockAuthProvider
    );
  });

  describe('initialize', () => {
    it('should set initialized to true', async () => {
      await logClient.initialize();
      expect(logClient['initialized']).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return false by default', () => {
      expect(logClient.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await logClient.initialize();
      expect(logClient.isInitialized()).toBe(true);
    });
  });

  describe('log', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(logClient, 'initialize');
      mockLogManager.log.mockResolvedValue('log-id');

      // Client should auto-initialize
      await logClient.log('log-name', { message: 'test' });

      expect(spy).toHaveBeenCalled();
      expect(logClient.isInitialized()).toBe(true);
    });

    it('should check authentication', async () => {
      await logClient.initialize();
      mockLogManager.log.mockResolvedValue('log-id');

      await logClient.log('log-name', { message: 'test' });

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the log manager', async () => {
      await logClient.initialize();
      mockLogManager.log.mockResolvedValue('log-id');

      const result = await logClient.log('log-name', { message: 'test' }, { kekVersion: 'v1' });

      expect(mockLogManager.log).toHaveBeenCalledWith('log-name', { message: 'test' }, { kekVersion: 'v1' });
      expect(result).toBe('log-id');
    });

    it('should throw an error if log manager throws', async () => {
      await logClient.initialize();
      mockLogManager.log.mockRejectedValue(new Error('Log failed'));

      await expect(logClient.log('log-name', { message: 'test' })).rejects.toThrow('Failed to log data: Log failed');
    });
  });

  describe('getLogs', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(logClient, 'initialize');
      mockLogManager.getLogs.mockResolvedValue([{ id: 'log-1' }]);

      // Client should auto-initialize
      await logClient.getLogs('log-name');

      expect(spy).toHaveBeenCalled();
      expect(logClient.isInitialized()).toBe(true);
    });

    it('should check authentication', async () => {
      await logClient.initialize();
      mockLogManager.getLogs.mockResolvedValue([{ id: 'log-1' }]);

      await logClient.getLogs('log-name');

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the log manager', async () => {
      await logClient.initialize();
      mockLogManager.getLogs.mockResolvedValue([{ id: 'log-1' }]);

      const result = await logClient.getLogs('log-name', { limit: 10 });

      expect(mockLogManager.getLogs).toHaveBeenCalledWith('log-name', { limit: 10 });
      expect(result).toEqual([{ id: 'log-1' }]);
    });

    it('should throw an error if log manager throws', async () => {
      await logClient.initialize();
      mockLogManager.getLogs.mockRejectedValue(new Error('Get logs failed'));

      await expect(logClient.getLogs('log-name')).rejects.toThrow('Failed to get logs: Get logs failed');
    });
  });

  describe('searchLogs', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(logClient, 'initialize');
      mockLogManager.searchLogs.mockResolvedValue([{ id: 'log-1' }]);

      // Client should auto-initialize
      await logClient.searchLogs('log-name', { query: 'test' });

      expect(spy).toHaveBeenCalled();
      expect(logClient.isInitialized()).toBe(true);
    });

    it('should check authentication', async () => {
      await logClient.initialize();
      mockLogManager.searchLogs.mockResolvedValue([{ id: 'log-1' }]);

      await logClient.searchLogs('log-name', { query: 'test' });

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the log manager', async () => {
      await logClient.initialize();
      mockLogManager.searchLogs.mockResolvedValue([{ id: 'log-1' }]);

      const result = await logClient.searchLogs('log-name', { query: 'test', limit: 10 });

      expect(mockLogManager.searchLogs).toHaveBeenCalledWith('log-name', { query: 'test', limit: 10 });
      expect(result).toEqual([{ id: 'log-1' }]);
    });

    it('should throw an error if log manager throws', async () => {
      await logClient.initialize();
      mockLogManager.searchLogs.mockRejectedValue(new Error('Search logs failed'));

      await expect(logClient.searchLogs('log-name', { query: 'test' })).rejects.toThrow('Failed to search logs: Search logs failed');
    });
  });


});
