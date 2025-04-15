import { ApiKeyClient } from '../../../src/client/ApiKeyClient';
import { AuthManager } from '../../../src/auth/AuthManager';
import { ConfigurationService } from '../../../src/client/services/ConfigurationService';
import { AuthProvider } from '../../../src/client/services/AuthProvider';

// Mock dependencies
jest.mock('../../../src/auth/AuthManager');
jest.mock('../../../src/client/services/ConfigurationService');
jest.mock('../../../src/client/services/AuthProvider');

describe('ApiKeyClient', () => {
  let apiKeyClient: ApiKeyClient;
  let mockAuthManager: jest.Mocked<AuthManager>;
  let mockConfigService: jest.Mocked<ConfigurationService>;
  let mockAuthProvider: jest.Mocked<AuthProvider>;

  beforeEach(() => {
    mockAuthManager = {
      createApiKey: jest.fn(),
      getApiKeys: jest.fn(),
      revokeApiKey: jest.fn(),
    } as unknown as jest.Mocked<AuthManager>;

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

    apiKeyClient = new ApiKeyClient(
      mockAuthManager,
      mockConfigService,
      mockAuthProvider
    );
  });

  describe('initialize', () => {
    it('should set initialized to true', async () => {
      await apiKeyClient.initialize();
      expect(apiKeyClient['initialized']).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return false by default', () => {
      expect(apiKeyClient.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await apiKeyClient.initialize();
      expect(apiKeyClient.isInitialized()).toBe(true);
    });
  });

  describe('createApiKey', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(apiKeyClient, 'initialize');
      mockAuthManager.createApiKey.mockResolvedValue({ id: 'api-key-1', name: 'test key', scopes: ['logs:read'], createdAt: '2023-01-01T00:00:00Z', userId: 'user-1', tenantId: 'tenant-1', verificationHash: 'hash', expiresAt: '2024-01-01T00:00:00Z', revoked: false });

      await apiKeyClient.createApiKey('test key');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await apiKeyClient.initialize();
      mockAuthManager.createApiKey.mockResolvedValue({ id: 'api-key-1', name: 'test key', scopes: ['logs:read'], createdAt: '2023-01-01T00:00:00Z', userId: 'user-1', tenantId: 'tenant-1', verificationHash: 'hash', expiresAt: '2024-01-01T00:00:00Z', revoked: false });

      await apiKeyClient.createApiKey('test key');

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the auth manager', async () => {
      await apiKeyClient.initialize();
      mockAuthManager.createApiKey.mockResolvedValue({ id: 'api-key-1', name: 'test key', scopes: ['logs:read'], createdAt: '2023-01-01T00:00:00Z', userId: 'user-1', tenantId: 'tenant-1', verificationHash: 'hash', expiresAt: '2024-01-01T00:00:00Z', revoked: false });

      const result = await apiKeyClient.createApiKey('test key', 3600);

      expect(mockAuthManager.createApiKey).toHaveBeenCalledWith('test key', 3600);
      expect(result).toEqual({ id: 'api-key-1', name: 'test key', scopes: ['logs:read'], createdAt: '2023-01-01T00:00:00Z', userId: 'user-1', tenantId: 'tenant-1', verificationHash: 'hash', expiresAt: '2024-01-01T00:00:00Z', revoked: false });
    });

    it('should throw an error if auth manager throws', async () => {
      await apiKeyClient.initialize();
      mockAuthManager.createApiKey.mockRejectedValue(new Error('Create API key failed'));

      await expect(apiKeyClient.createApiKey('test key')).rejects.toThrow('Failed to create API key: Create API key failed');
    });
  });

  describe('getApiKeys', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(apiKeyClient, 'initialize');
      mockAuthManager.getApiKeys.mockResolvedValue([{ id: 'api-key-1', name: 'test key', scopes: ['logs:read'], createdAt: '2023-01-01T00:00:00Z', userId: 'user-1', tenantId: 'tenant-1', verificationHash: 'hash', expiresAt: '2024-01-01T00:00:00Z', revoked: false }]);

      await apiKeyClient.getApiKeys();

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await apiKeyClient.initialize();
      mockAuthManager.getApiKeys.mockResolvedValue([{ id: 'api-key-1', name: 'test key', scopes: ['logs:read'], createdAt: '2023-01-01T00:00:00Z', userId: 'user-1', tenantId: 'tenant-1', verificationHash: 'hash', expiresAt: '2024-01-01T00:00:00Z', revoked: false }]);

      await apiKeyClient.getApiKeys();

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the auth manager', async () => {
      await apiKeyClient.initialize();
      mockAuthManager.getApiKeys.mockResolvedValue([{ id: 'api-key-1', name: 'test key', scopes: ['logs:read'], createdAt: '2023-01-01T00:00:00Z', userId: 'user-1', tenantId: 'tenant-1', verificationHash: 'hash', expiresAt: '2024-01-01T00:00:00Z', revoked: false }]);

      const result = await apiKeyClient.getApiKeys();

      expect(mockAuthManager.getApiKeys).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'api-key-1', name: 'test key', scopes: ['logs:read'], createdAt: '2023-01-01T00:00:00Z', userId: 'user-1', tenantId: 'tenant-1', verificationHash: 'hash', expiresAt: '2024-01-01T00:00:00Z', revoked: false }]);
    });

    it('should throw an error if auth manager throws', async () => {
      await apiKeyClient.initialize();
      mockAuthManager.getApiKeys.mockRejectedValue(new Error('Get API keys failed'));

      await expect(apiKeyClient.getApiKeys()).rejects.toThrow('Failed to get API keys: Get API keys failed');
    });
  });

  describe('revokeApiKey', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(apiKeyClient, 'initialize');
      mockAuthManager.revokeApiKey.mockResolvedValue(undefined);

      await apiKeyClient.revokeApiKey('api-key-1');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await apiKeyClient.initialize();
      mockAuthManager.revokeApiKey.mockResolvedValue(undefined);

      await apiKeyClient.revokeApiKey('api-key-1');

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the auth manager', async () => {
      await apiKeyClient.initialize();
      mockAuthManager.revokeApiKey.mockResolvedValue(undefined);

      await apiKeyClient.revokeApiKey('api-key-1');

      expect(mockAuthManager.revokeApiKey).toHaveBeenCalledWith('api-key-1');
    });

    it('should throw an error if auth manager throws', async () => {
      await apiKeyClient.initialize();
      mockAuthManager.revokeApiKey.mockRejectedValue(new Error('Revoke API key failed'));

      await expect(apiKeyClient.revokeApiKey('api-key-1')).rejects.toThrow('Failed to revoke API key: Revoke API key failed');
    });
  });
});
