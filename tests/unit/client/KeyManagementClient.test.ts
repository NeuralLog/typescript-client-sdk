import { KeyManagementClient } from '../../../src/client/KeyManagementClient';
import { KeyHierarchyManager } from '../../../src/managers/KeyHierarchyManager';
import { ConfigurationService } from '../../../src/client/services/ConfigurationService';
import { AuthProvider } from '../../../src/client/services/AuthProvider';

// Mock dependencies
jest.mock('../../../src/managers/KeyHierarchyManager');
jest.mock('../../../src/client/services/ConfigurationService');
jest.mock('../../../src/client/services/AuthProvider');

describe('KeyManagementClient', () => {
  let keyManagementClient: KeyManagementClient;
  let mockKeyHierarchyManager: jest.Mocked<KeyHierarchyManager>;
  let mockConfigService: jest.Mocked<ConfigurationService>;
  let mockAuthProvider: jest.Mocked<AuthProvider>;

  beforeEach(() => {
    mockKeyHierarchyManager = {
      getKEKVersions: jest.fn(),
      createKEKVersion: jest.fn(),
      rotateKEK: jest.fn(),
      provisionKEKForUser: jest.fn(),
      initializeWithRecoveryPhrase: jest.fn(),
      initializeWithMnemonic: jest.fn(),
      recoverKEKVersions: jest.fn(),
    } as unknown as jest.Mocked<KeyHierarchyManager>;

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

    keyManagementClient = new KeyManagementClient(
      mockKeyHierarchyManager,
      mockConfigService,
      mockAuthProvider
    );
  });

  describe('initialize', () => {
    it('should set initialized to true', async () => {
      await keyManagementClient.initialize();
      expect(keyManagementClient['initialized']).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return false by default', () => {
      expect(keyManagementClient.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await keyManagementClient.initialize();
      expect(keyManagementClient.isInitialized()).toBe(true);
    });
  });

  describe('getKEKVersions', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(keyManagementClient, 'initialize');
      mockKeyHierarchyManager.getKEKVersions.mockResolvedValue([{ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' }]);
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await keyManagementClient.getKEKVersions();

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.getKEKVersions.mockResolvedValue([{ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' }]);
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await keyManagementClient.getKEKVersions();

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the key hierarchy manager', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.getKEKVersions.mockResolvedValue([{ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' }]);
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      const result = await keyManagementClient.getKEKVersions();

      expect(mockKeyHierarchyManager.getKEKVersions).toHaveBeenCalledWith('test-token');
      expect(result).toEqual([{ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' }]);
    });

    it('should throw an error if key hierarchy manager throws', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.getKEKVersions.mockRejectedValue(new Error('Get KEK versions failed'));
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await expect(keyManagementClient.getKEKVersions()).rejects.toThrow('Failed to get KEK versions: Get KEK versions failed');
    });

    it('should throw an error if not authenticated', async () => {
      await keyManagementClient.initialize();
      mockAuthProvider.getAuthToken.mockReturnValue(null);

      await expect(keyManagementClient.getKEKVersions()).rejects.toThrow('Failed to get KEK versions: Not authenticated');
    });
  });

  describe('createKEKVersion', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(keyManagementClient, 'initialize');
      mockKeyHierarchyManager.createKEKVersion.mockResolvedValue({ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' });
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await keyManagementClient.createKEKVersion('test reason');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.createKEKVersion.mockResolvedValue({ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' });
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await keyManagementClient.createKEKVersion('test reason');

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the key hierarchy manager', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.createKEKVersion.mockResolvedValue({ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' });
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      const result = await keyManagementClient.createKEKVersion('test reason');

      expect(mockKeyHierarchyManager.createKEKVersion).toHaveBeenCalledWith('test reason', 'test-token');
      expect(result).toEqual({ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' });
    });

    it('should throw an error if key hierarchy manager throws', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.createKEKVersion.mockRejectedValue(new Error('Create KEK version failed'));
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await expect(keyManagementClient.createKEKVersion('test reason')).rejects.toThrow('Failed to create KEK version: Create KEK version failed');
    });

    it('should throw an error if not authenticated', async () => {
      await keyManagementClient.initialize();
      mockAuthProvider.getAuthToken.mockReturnValue(null);

      await expect(keyManagementClient.createKEKVersion('test reason')).rejects.toThrow('Failed to create KEK version: Not authenticated');
    });
  });

  describe('rotateKEK', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(keyManagementClient, 'initialize');
      mockKeyHierarchyManager.rotateKEK.mockResolvedValue({ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' });
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await keyManagementClient.rotateKEK('test reason');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.rotateKEK.mockResolvedValue({ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' });
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await keyManagementClient.rotateKEK('test reason');

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the key hierarchy manager', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.rotateKEK.mockResolvedValue({ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' });
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      const result = await keyManagementClient.rotateKEK('test reason', ['user-1']);

      expect(mockKeyHierarchyManager.rotateKEK).toHaveBeenCalledWith('test reason', ['user-1'], 'test-token');
      expect(result).toEqual({ id: 'kek-1', createdAt: '2023-01-01T00:00:00Z', createdBy: 'user-1', status: 'active', reason: 'Initial KEK' });
    });

    it('should throw an error if key hierarchy manager throws', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.rotateKEK.mockRejectedValue(new Error('Rotate KEK failed'));
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await expect(keyManagementClient.rotateKEK('test reason')).rejects.toThrow('Failed to rotate KEK: Rotate KEK failed');
    });

    it('should throw an error if not authenticated', async () => {
      await keyManagementClient.initialize();
      mockAuthProvider.getAuthToken.mockReturnValue(null);

      await expect(keyManagementClient.rotateKEK('test reason')).rejects.toThrow('Failed to rotate KEK: Not authenticated');
    });
  });

  describe('provisionKEKForUser', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(keyManagementClient, 'initialize');
      mockKeyHierarchyManager.provisionKEKForUser.mockResolvedValue(undefined);
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await keyManagementClient.provisionKEKForUser('user-1', 'kek-1');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.provisionKEKForUser.mockResolvedValue(undefined);
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await keyManagementClient.provisionKEKForUser('user-1', 'kek-1');

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the key hierarchy manager', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.provisionKEKForUser.mockResolvedValue(undefined);
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await keyManagementClient.provisionKEKForUser('user-1', 'kek-1');

      expect(mockKeyHierarchyManager.provisionKEKForUser).toHaveBeenCalledWith('user-1', 'kek-1', 'test-token');
    });

    it('should throw an error if key hierarchy manager throws', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.provisionKEKForUser.mockRejectedValue(new Error('Provision KEK for user failed'));
      mockAuthProvider.getAuthToken.mockReturnValue('test-token');

      await expect(keyManagementClient.provisionKEKForUser('user-1', 'kek-1')).rejects.toThrow('Failed to provision KEK for user: Provision KEK for user failed');
    });

    it('should throw an error if not authenticated', async () => {
      await keyManagementClient.initialize();
      mockAuthProvider.getAuthToken.mockReturnValue(null);

      await expect(keyManagementClient.provisionKEKForUser('user-1', 'kek-1')).rejects.toThrow('Failed to provision KEK for user: Not authenticated');
    });
  });

  describe('initializeWithRecoveryPhrase', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(keyManagementClient, 'initialize');
      mockKeyHierarchyManager.initializeWithRecoveryPhrase.mockResolvedValue();
      mockConfigService.getTenantId.mockReturnValue('test-tenant');

      await keyManagementClient.initializeWithRecoveryPhrase('recovery phrase');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.initializeWithRecoveryPhrase.mockResolvedValue();
      mockConfigService.getTenantId.mockReturnValue('test-tenant');

      await keyManagementClient.initializeWithRecoveryPhrase('recovery phrase');

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the key hierarchy manager', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.initializeWithRecoveryPhrase.mockResolvedValue();
      mockConfigService.getTenantId.mockReturnValue('test-tenant');

      await keyManagementClient.initializeWithRecoveryPhrase('recovery phrase', ['v1']);

      expect(mockKeyHierarchyManager.initializeWithRecoveryPhrase).toHaveBeenCalledWith('test-tenant', 'recovery phrase', ['v1']);
    });

    it('should throw an error if key hierarchy manager throws', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.initializeWithRecoveryPhrase.mockRejectedValue(new Error('Initialize with recovery phrase failed'));
      mockConfigService.getTenantId.mockReturnValue('test-tenant');

      await expect(keyManagementClient.initializeWithRecoveryPhrase('recovery phrase')).rejects.toThrow('Failed to initialize with recovery phrase: Initialize with recovery phrase failed');
    });
  });

  describe('initializeWithMnemonic', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(keyManagementClient, 'initialize');
      mockKeyHierarchyManager.initializeWithMnemonic.mockResolvedValue();
      mockConfigService.getTenantId.mockReturnValue('test-tenant');

      await keyManagementClient.initializeWithMnemonic('mnemonic phrase');

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.initializeWithMnemonic.mockResolvedValue();
      mockConfigService.getTenantId.mockReturnValue('test-tenant');

      await keyManagementClient.initializeWithMnemonic('mnemonic phrase');

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the key hierarchy manager', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.initializeWithMnemonic.mockResolvedValue();
      mockConfigService.getTenantId.mockReturnValue('test-tenant');

      await keyManagementClient.initializeWithMnemonic('mnemonic phrase', ['v1']);

      expect(mockKeyHierarchyManager.initializeWithMnemonic).toHaveBeenCalledWith('test-tenant', 'mnemonic phrase', ['v1']);
    });

    it('should throw an error if key hierarchy manager throws', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.initializeWithMnemonic.mockRejectedValue(new Error('Initialize with mnemonic failed'));
      mockConfigService.getTenantId.mockReturnValue('test-tenant');

      await expect(keyManagementClient.initializeWithMnemonic('mnemonic phrase')).rejects.toThrow('Failed to initialize with mnemonic: Initialize with mnemonic failed');
    });
  });

  describe('recoverKEKVersions', () => {
    it('should initialize if not initialized', async () => {
      const spy = jest.spyOn(keyManagementClient, 'initialize');
      mockKeyHierarchyManager.recoverKEKVersions.mockResolvedValue();

      await keyManagementClient.recoverKEKVersions(['v1']);

      expect(spy).toHaveBeenCalled();
    });

    it('should check authentication', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.recoverKEKVersions.mockResolvedValue();

      await keyManagementClient.recoverKEKVersions(['v1']);

      expect(mockAuthProvider.checkAuthentication).toHaveBeenCalled();
    });

    it('should delegate to the key hierarchy manager', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.recoverKEKVersions.mockResolvedValue();

      await keyManagementClient.recoverKEKVersions(['v1']);

      expect(mockKeyHierarchyManager.recoverKEKVersions).toHaveBeenCalledWith(['v1']);
    });

    it('should throw an error if key hierarchy manager throws', async () => {
      await keyManagementClient.initialize();
      mockKeyHierarchyManager.recoverKEKVersions.mockRejectedValue(new Error('Recover KEK versions failed'));

      await expect(keyManagementClient.recoverKEKVersions(['v1'])).rejects.toThrow('Failed to recover KEK versions: Recover KEK versions failed');
    });
  });
});
