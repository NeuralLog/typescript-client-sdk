import { AuthClient } from '../../../src/client/AuthClient';
import { AuthManager } from '../../../src/auth/AuthManager';
import { TokenService } from '../../../src/auth/TokenService';
import { ConfigurationService } from '../../../src/client/services/ConfigurationService';
import { AuthProvider } from '../../../src/client/services/AuthProvider';
import { LogError } from '../../../src/errors';

// Mock dependencies
jest.mock('../../../src/auth/AuthManager');
jest.mock('../../../src/auth/TokenService');
jest.mock('../../../src/client/services/ConfigurationService');
jest.mock('../../../src/client/services/AuthProvider');

describe('AuthClient', () => {
  let authClient: AuthClient;
  let mockAuthManager: jest.Mocked<AuthManager>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockConfigService: jest.Mocked<ConfigurationService>;
  let mockAuthProvider: jest.Mocked<AuthProvider>;

  beforeEach(() => {
    mockAuthManager = {
      login: jest.fn(),
      loginWithApiKey: jest.fn(),
      logout: jest.fn(),
      isLoggedIn: jest.fn(),
      getAuthToken: jest.fn(),
      checkPermission: jest.fn(),
    } as unknown as jest.Mocked<AuthManager>;

    mockTokenService = {
      getUserIdFromToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

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

    authClient = new AuthClient(
      mockAuthManager,
      mockTokenService,
      mockConfigService,
      mockAuthProvider
    );
  });

  describe('initialize', () => {
    it('should set initialized to true', async () => {
      await authClient.initialize();
      expect(authClient['initialized']).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return false by default', () => {
      expect(authClient.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await authClient.initialize();
      expect(authClient.isInitialized()).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should delegate to the auth provider', () => {
      // Create a spy on the authProvider.isAuthenticated method
      const spy = jest.spyOn(authClient['authProvider'], 'isAuthenticated');
      spy.mockReturnValue(true);

      const result = authClient.isAuthenticated();

      expect(spy).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('login', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(authClient, 'initialize');
      mockAuthManager.login.mockResolvedValue({ token: 'test-token', user_id: 'user-id', tenant_id: 'tenant-id' });

      await authClient.login('username', 'password');

      expect(spy).toHaveBeenCalled();
    });

    it('should delegate to the auth manager', async () => {
      await authClient.initialize();
      mockAuthManager.login.mockResolvedValue({ token: 'test-token', user_id: 'user-id', tenant_id: 'tenant-id' });
      mockTokenService.getUserIdFromToken.mockReturnValue('user-id');

      const result = await authClient.login('username', 'password');

      expect(mockAuthManager.login).toHaveBeenCalledWith('username', 'password');
      expect(result).toEqual({ token: 'test-token', user_id: 'user-id', tenant_id: 'tenant-id' });
    });

    it('should extract user ID from token', async () => {
      await authClient.initialize();
      mockAuthManager.login.mockResolvedValue({ token: 'test-token', user_id: 'user-id', tenant_id: 'tenant-id' });
      mockTokenService.getUserIdFromToken.mockReturnValue('user-id');

      await authClient.login('username', 'password');

      expect(mockTokenService.getUserIdFromToken).toHaveBeenCalledWith('test-token');
    });

    it('should throw an error if auth manager throws', async () => {
      await authClient.initialize();
      mockAuthManager.login.mockRejectedValue(new Error('Login failed'));

      await expect(authClient.login('username', 'password')).rejects.toThrow('Failed to login: Login failed');
    });
  });

  describe('loginWithApiKey', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(authClient, 'initialize');
      mockAuthManager.loginWithApiKey.mockResolvedValue({ token: 'test-token', user_id: 'user-id', tenant_id: 'tenant-id' });

      await authClient.loginWithApiKey('api-key');

      expect(spy).toHaveBeenCalled();
    });

    it('should delegate to the auth manager', async () => {
      await authClient.initialize();
      mockAuthManager.loginWithApiKey.mockResolvedValue({ token: 'test-token', user_id: 'user-id', tenant_id: 'tenant-id' });

      const result = await authClient.loginWithApiKey('api-key');

      expect(mockAuthManager.loginWithApiKey).toHaveBeenCalledWith('api-key');
      expect(result).toEqual({ token: 'test-token', user_id: 'user-id', tenant_id: 'tenant-id' });
    });

    it('should throw an error if auth manager throws', async () => {
      await authClient.initialize();
      mockAuthManager.loginWithApiKey.mockRejectedValue(new Error('Login with API key failed'));

      await expect(authClient.loginWithApiKey('api-key')).rejects.toThrow('Failed to login with API key: Login with API key failed');
    });
  });

  describe('logout', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(authClient, 'initialize');
      mockAuthManager.logout.mockResolvedValue(undefined);

      await authClient.logout();

      expect(spy).toHaveBeenCalled();
    });

    it('should delegate to the auth manager', async () => {
      await authClient.initialize();
      mockAuthManager.logout.mockResolvedValue(undefined);

      await authClient.logout();

      expect(mockAuthManager.logout).toHaveBeenCalled();
    });

    it('should throw an error if auth manager throws', async () => {
      await authClient.initialize();
      mockAuthManager.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(authClient.logout()).rejects.toThrow('Failed to logout: Logout failed');
    });
  });

  describe('getAuthToken', () => {
    it('should delegate to the auth provider', () => {
      // Create a spy on the authProvider.getAuthToken method
      const spy = jest.spyOn(authClient['authProvider'], 'getAuthToken');
      spy.mockReturnValue('test-token');

      const result = authClient.getAuthToken();

      expect(spy).toHaveBeenCalled();
      expect(result).toBe('test-token');
    });
  });

  describe('getUserIdFromToken', () => {
    it('should return the user ID from a token', () => {
      mockTokenService.getUserIdFromToken.mockReturnValue('user-id');

      const result = authClient.getUserIdFromToken('test-token');

      expect(mockTokenService.getUserIdFromToken).toHaveBeenCalledWith('test-token');
      expect(result).toBe('user-id');
    });

    it('should return null if an error occurs', () => {
      mockTokenService.getUserIdFromToken.mockImplementation(() => {
        throw new Error('Token error');
      });

      const result = authClient.getUserIdFromToken('test-token');

      expect(mockTokenService.getUserIdFromToken).toHaveBeenCalledWith('test-token');
      expect(result).toBeNull();
    });
  });

  describe('checkPermission', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(authClient, 'initialize');
      mockAuthManager.checkPermission.mockResolvedValue(true);

      await authClient.checkPermission('read', 'logs/log-name');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await authClient.initialize();
      mockAuthManager.checkPermission.mockResolvedValue(true);
      const spy = jest.spyOn(authClient, 'isAuthenticated');

      await authClient.checkPermission('read', 'logs/log-name');

      expect(spy).toHaveBeenCalled();
    });

    it('should throw an error if not authenticated', async () => {
      await authClient.initialize();
      // Mock isAuthenticated to return false to trigger the error in checkAuthentication
      const spy = jest.spyOn(authClient, 'isAuthenticated');
      spy.mockReturnValue(false);

      await expect(authClient.checkPermission('read', 'logs/log-name')).rejects.toThrow('Not authenticated');
    });

    it('should delegate to the auth manager', async () => {
      await authClient.initialize();
      mockAuthManager.checkPermission.mockResolvedValue(true);

      const result = await authClient.checkPermission('read', 'logs/log-name');

      expect(mockAuthManager.checkPermission).toHaveBeenCalledWith('read', 'logs/log-name');
      expect(result).toBe(true);
    });

    it('should throw an error if auth manager throws', async () => {
      await authClient.initialize();
      mockAuthManager.checkPermission.mockRejectedValue(new Error('Check permission failed'));

      await expect(authClient.checkPermission('read', 'logs/log-name')).rejects.toThrow('Failed to check permission: Check permission failed');
    });
  });
});
