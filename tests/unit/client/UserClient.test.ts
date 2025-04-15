import { UserClient } from '../../../src/client/UserClient';
import { UserManager } from '../../../src/managers/UserManager';
import { ConfigurationService } from '../../../src/client/services/ConfigurationService';
import { AuthProvider } from '../../../src/client/services/AuthProvider';
import { LogError } from '../../../src/errors/LogError';

// Mock dependencies
jest.mock('../../../src/managers/UserManager');
jest.mock('../../../src/client/services/ConfigurationService');
jest.mock('../../../src/client/services/AuthProvider');

describe('UserClient', () => {
  let userClient: UserClient;
  let mockUserManager: jest.Mocked<UserManager>;
  let mockConfigService: jest.Mocked<ConfigurationService>;
  let mockAuthProvider: jest.Mocked<AuthProvider>;

  beforeEach(() => {
    mockUserManager = {
      getUsers: jest.fn(),
      getPendingAdminPromotions: jest.fn(),
      approveAdminPromotion: jest.fn(),
      rejectAdminPromotion: jest.fn(),
      uploadUserPublicKey: jest.fn(),
      getUserKeyPair: jest.fn(),
      getUserPublicKey: jest.fn(),
    } as unknown as jest.Mocked<UserManager>;

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

    userClient = new UserClient(
      mockUserManager,
      mockConfigService,
      mockAuthProvider
    );
  });

  describe('initialize', () => {
    it('should set initialized to true', async () => {
      await userClient.initialize();
      expect(userClient['initialized']).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return false by default', () => {
      expect(userClient.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await userClient.initialize();
      expect(userClient.isInitialized()).toBe(true);
    });
  });

  describe('getAuthToken', () => {
    it('should return the auth token from the auth provider', () => {
      // Setup
      const expectedToken = 'test-auth-token';
      mockAuthProvider.getAuthToken.mockReturnValue(expectedToken);

      // Execute
      const result = userClient.getAuthToken();

      // Verify
      expect(mockAuthProvider.getAuthToken).toHaveBeenCalled();
      expect(result).toBe(expectedToken);
    });

    it('should return null if no auth token is available', () => {
      // Setup
      mockAuthProvider.getAuthToken.mockReturnValue(null);

      // Execute
      const result = userClient.getAuthToken();

      // Verify
      expect(mockAuthProvider.getAuthToken).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('handleError', () => {
    it('should format error message correctly when error is an Error instance', () => {
      // Setup
      const error = new Error('Test error');
      const operation = 'test operation';
      const errorCode = 'test_error_code';

      // Execute & Verify
      try {
        userClient['handleError'](error, operation, errorCode);
        fail('Expected an error to be thrown');
      } catch (thrownError) {
        if (thrownError instanceof LogError) {
          expect(thrownError.message).toBe('Failed to test operation: Test error');
          expect(thrownError.code).toBe('test_error_code');
        } else {
          fail('Expected a LogError to be thrown');
        }
      }
    });

    it('should format error message correctly when error is not an Error instance', () => {
      // Setup
      const error = 'String error';
      const operation = 'test operation';
      const errorCode = 'test_error_code';

      // Execute & Verify
      try {
        userClient['handleError'](error, operation, errorCode);
        fail('Expected an error to be thrown');
      } catch (thrownError) {
        if (thrownError instanceof LogError) {
          expect(thrownError.message).toBe('Failed to test operation: String error');
          expect(thrownError.code).toBe('test_error_code');
        } else {
          fail('Expected a LogError to be thrown');
        }
      }
    });
  });

  describe('authentication checks', () => {
    it('should throw an error when not authenticated', async () => {
      // Setup
      mockAuthProvider.isAuthenticated.mockReturnValue(false);

      // Execute & Verify
      await expect(userClient.getUsers()).rejects.toThrow('Not authenticated');
    });

    it('should throw an error with the correct error code when not authenticated', async () => {
      // Setup
      mockAuthProvider.isAuthenticated.mockReturnValue(false);

      // Execute & Verify
      try {
        await userClient.getUsers();
        fail('Expected an error to be thrown');
      } catch (error) {
        if (error instanceof LogError) {
          expect(error.code).toBe('not_authenticated');
        } else {
          fail('Expected a LogError to be thrown');
        }
      }
    });
  });

  describe('getUsers', () => {
    it('should automatically initialize if not initialized', async () => {
      // Ensure the client is not initialized
      userClient['initialized'] = false;

      // Mock the isAuthenticated method to return true to pass authentication check
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      // Spy on the initialize method
      const spy = jest.spyOn(userClient, 'initialize').mockResolvedValue();

      // Mock the user manager to return a value
      mockUserManager.getUsers.mockResolvedValue([{ id: 'user-1', email: 'user1@example.com', name: 'User One', isAdmin: false, createdAt: '2023-01-01T00:00:00Z' }]);

      // Call the method
      await userClient.getUsers();

      // Expect initialize to have been called
      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await userClient.initialize();
      mockUserManager.getUsers.mockResolvedValue([{ id: 'user-1', email: 'user1@example.com', name: 'User One', isAdmin: false, createdAt: '2023-01-01T00:00:00Z' }]);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await userClient.getUsers();

      expect(mockAuthProvider.isAuthenticated).toHaveBeenCalled();
    });

    it('should delegate to the user manager', async () => {
      await userClient.initialize();
      mockUserManager.getUsers.mockResolvedValue([{ id: 'user-1', email: 'user1@example.com', name: 'User One', isAdmin: false, createdAt: '2023-01-01T00:00:00Z' }]);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      const result = await userClient.getUsers();

      expect(mockUserManager.getUsers).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'user-1', email: 'user1@example.com', name: 'User One', isAdmin: false, createdAt: '2023-01-01T00:00:00Z' }]);
    });

    it('should throw an error if user manager throws', async () => {
      await userClient.initialize();
      mockUserManager.getUsers.mockRejectedValue(new Error('Get users failed'));

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await expect(userClient.getUsers()).rejects.toThrow('Failed to get users: Get users failed');
    });
  });

  describe('getPendingAdminPromotions', () => {
    it('should automatically initialize if not initialized', async () => {
      // Ensure the client is not initialized
      userClient['initialized'] = false;

      // Mock the isAuthenticated method to return true to pass authentication check
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      // Spy on the initialize method
      const spy = jest.spyOn(userClient, 'initialize').mockResolvedValue();

      // Mock the user manager to return a value
      mockUserManager.getPendingAdminPromotions.mockResolvedValue([{ id: 'promotion-1', candidate_id: 'user-1', candidate_name: 'User 1', requester_id: 'admin-1', requester_name: 'Admin 1', status: 'pending', timestamp: '2023-01-01T00:00:00Z', threshold: 1, approvals: 0 }]);

      // Call the method
      await userClient.getPendingAdminPromotions();

      // Expect initialize to have been called
      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await userClient.initialize();
      mockUserManager.getPendingAdminPromotions.mockResolvedValue([{ id: 'promotion-1', candidate_id: 'user-1', candidate_name: 'User 1', requester_id: 'admin-1', requester_name: 'Admin 1', status: 'pending', timestamp: '2023-01-01T00:00:00Z', threshold: 1, approvals: 0 }]);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await userClient.getPendingAdminPromotions();

      expect(mockAuthProvider.isAuthenticated).toHaveBeenCalled();
    });

    it('should delegate to the user manager', async () => {
      await userClient.initialize();
      mockUserManager.getPendingAdminPromotions.mockResolvedValue([{ id: 'promotion-1', candidate_id: 'user-1', candidate_name: 'User 1', requester_id: 'admin-1', requester_name: 'Admin 1', status: 'pending', timestamp: '2023-01-01T00:00:00Z', threshold: 1, approvals: 0 }]);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      const result = await userClient.getPendingAdminPromotions();

      expect(mockUserManager.getPendingAdminPromotions).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'promotion-1', candidate_id: 'user-1', candidate_name: 'User 1', requester_id: 'admin-1', requester_name: 'Admin 1', status: 'pending', timestamp: '2023-01-01T00:00:00Z', threshold: 1, approvals: 0 }]);
    });

    it('should throw an error if user manager throws', async () => {
      await userClient.initialize();
      mockUserManager.getPendingAdminPromotions.mockRejectedValue(new Error('Get pending admin promotions failed'));

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await expect(userClient.getPendingAdminPromotions()).rejects.toThrow('Failed to get pending admin promotions: Get pending admin promotions failed');
    });
  });

  describe('approveAdminPromotion', () => {
    it('should automatically initialize if not initialized', async () => {
      // Mock the initialize method to set initialized to true
      const spy = jest.spyOn(userClient, 'initialize').mockImplementation(async () => {
        userClient['initialized'] = true;
      });

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      mockUserManager.approveAdminPromotion.mockResolvedValue(undefined);

      await userClient.approveAdminPromotion('promotion-id', 'password');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await userClient.initialize();
      mockUserManager.approveAdminPromotion.mockResolvedValue(undefined);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await userClient.approveAdminPromotion('promotion-id', 'password');

      expect(mockAuthProvider.isAuthenticated).toHaveBeenCalled();
    });

    it('should delegate to the user manager', async () => {
      await userClient.initialize();
      mockUserManager.approveAdminPromotion.mockResolvedValue(undefined);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await userClient.approveAdminPromotion('promotion-id', 'password');

      expect(mockUserManager.approveAdminPromotion).toHaveBeenCalledWith('promotion-id', 'password');
    });

    it('should throw an error if user manager throws', async () => {
      await userClient.initialize();
      mockUserManager.approveAdminPromotion.mockRejectedValue(new Error('Approve admin promotion failed'));

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await expect(userClient.approveAdminPromotion('promotion-id', 'password')).rejects.toThrow('Failed to approve admin promotion: Approve admin promotion failed');
    });
  });

  describe('rejectAdminPromotion', () => {
    it('should automatically initialize if not initialized', async () => {
      // Mock the initialize method to set initialized to true
      const spy = jest.spyOn(userClient, 'initialize').mockImplementation(async () => {
        userClient['initialized'] = true;
      });

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      mockUserManager.rejectAdminPromotion.mockResolvedValue(undefined);

      await userClient.rejectAdminPromotion('promotion-id');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await userClient.initialize();
      mockUserManager.rejectAdminPromotion.mockResolvedValue(undefined);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await userClient.rejectAdminPromotion('promotion-id');

      expect(mockAuthProvider.isAuthenticated).toHaveBeenCalled();
    });

    it('should delegate to the user manager', async () => {
      await userClient.initialize();
      mockUserManager.rejectAdminPromotion.mockResolvedValue(undefined);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await userClient.rejectAdminPromotion('promotion-id');

      expect(mockUserManager.rejectAdminPromotion).toHaveBeenCalledWith('promotion-id');
    });

    it('should throw an error if user manager throws', async () => {
      await userClient.initialize();
      mockUserManager.rejectAdminPromotion.mockRejectedValue(new Error('Reject admin promotion failed'));

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await expect(userClient.rejectAdminPromotion('promotion-id')).rejects.toThrow('Failed to reject admin promotion: Reject admin promotion failed');
    });
  });

  describe('uploadUserPublicKey', () => {
    it('should automatically initialize if not initialized', async () => {
      // Mock the initialize method to set initialized to true
      const spy = jest.spyOn(userClient, 'initialize').mockImplementation(async () => {
        userClient['initialized'] = true;
      });

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      mockUserManager.uploadUserPublicKey.mockResolvedValue(undefined);

      await userClient.uploadUserPublicKey('password');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await userClient.initialize();
      mockUserManager.uploadUserPublicKey.mockResolvedValue(undefined);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await userClient.uploadUserPublicKey('password');

      expect(mockAuthProvider.isAuthenticated).toHaveBeenCalled();
    });

    it('should delegate to the user manager', async () => {
      await userClient.initialize();
      mockUserManager.uploadUserPublicKey.mockResolvedValue(undefined);

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await userClient.uploadUserPublicKey('password');

      expect(mockUserManager.uploadUserPublicKey).toHaveBeenCalledWith('password');
    });

    it('should throw an error if user manager throws', async () => {
      await userClient.initialize();
      mockUserManager.uploadUserPublicKey.mockRejectedValue(new Error('Upload user public key failed'));

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      await expect(userClient.uploadUserPublicKey('password')).rejects.toThrow('Failed to upload user public key: Upload user public key failed');
    });
  });

  describe('getUserPublicKey', () => {
    it('should automatically initialize if not initialized', async () => {
      // Mock the initialize method to set initialized to true
      const spy = jest.spyOn(userClient, 'initialize').mockImplementation(async () => {
        userClient['initialized'] = true;
      });

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      // Mock the user manager to return a value
      const mockPublicKey = {} as CryptoKey;
      mockUserManager.getUserPublicKey.mockResolvedValue(mockPublicKey);

      await userClient.getUserPublicKey('user-id');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await userClient.initialize();

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      // Mock the user manager to return a value
      const mockPublicKey = {} as CryptoKey;
      mockUserManager.getUserPublicKey.mockResolvedValue(mockPublicKey);

      await userClient.getUserPublicKey('user-id');

      expect(mockAuthProvider.isAuthenticated).toHaveBeenCalled();
    });

    it('should delegate to the user manager', async () => {
      await userClient.initialize();

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      // Mock the user manager to return a value
      const mockPublicKey = {} as CryptoKey;
      mockUserManager.getUserPublicKey.mockResolvedValue(mockPublicKey);

      const result = await userClient.getUserPublicKey('user-id');

      expect(mockUserManager.getUserPublicKey).toHaveBeenCalledWith('user-id');
      expect(result).toBe(mockPublicKey);
    });

    it('should throw an error if user manager throws', async () => {
      await userClient.initialize();

      // Mock the isAuthenticated method to return true
      mockAuthProvider.isAuthenticated.mockReturnValue(true);

      // Mock the user manager to throw an error
      mockUserManager.getUserPublicKey.mockRejectedValue(new Error('Get user public key failed'));

      await expect(userClient.getUserPublicKey('user-id')).rejects.toThrow('Failed to get user public key: Get user public key failed');
    });
  });
});
