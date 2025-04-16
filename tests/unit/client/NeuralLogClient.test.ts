import { NeuralLogClient } from '../../../src/client/NeuralLogClient';
import { LogClient } from '../../../src/client/LogClient';
import { AuthClient } from '../../../src/client/AuthClient';
import { UserClient } from '../../../src/client/UserClient';
import { KeyManagementClient } from '../../../src/client/KeyManagementClient';
import { ApiKeyClient } from '../../../src/client/ApiKeyClient';
import { ConfigurationService } from '../../../src/client/services/ConfigurationService';
import axios from 'axios';

// Mock the specialized clients
jest.mock('../../../src/client/LogClient');
jest.mock('../../../src/client/AuthClient');
jest.mock('../../../src/client/UserClient');
jest.mock('../../../src/client/KeyManagementClient');
jest.mock('../../../src/client/ApiKeyClient');

// Mock the ConfigurationService
jest.mock('../../../src/client/services/ConfigurationService');

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({})
}));

// Mock the services and managers
jest.mock('../../../src/auth/AuthManager');
jest.mock('../../../src/auth/AuthService');
jest.mock('../../../src/auth/KekService');
jest.mock('../../../src/auth/TokenService');
jest.mock('../../../src/logs/LogsService');
jest.mock('../../../src/crypto/CryptoService');
jest.mock('../../../src/managers/KeyHierarchyManager');
jest.mock('../../../src/managers/LogManager');
jest.mock('../../../src/managers/UserManager');
jest.mock('../../../src/registry/RegistryClient');
jest.mock('../../../src/services/DiscoveryService');

describe('NeuralLogClient', () => {
  let client: NeuralLogClient;
  const mockOptions = {
    tenantId: 'test-tenant',
    serverUrl: 'https://api.test.com',
    authUrl: 'https://auth.test.com',
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ConfigurationService methods
    (ConfigurationService as jest.Mock).mockImplementation(() => ({
      getServerUrl: jest.fn().mockResolvedValue('https://api.test.com'),
      getAuthUrl: jest.fn().mockResolvedValue('https://auth.test.com'),
      getServerUrlSync: jest.fn().mockReturnValue('https://api.test.com'),
      getAuthUrlSync: jest.fn().mockReturnValue('https://auth.test.com'),
      getTenantId: jest.fn().mockReturnValue('test-tenant'),
      getApiKey: jest.fn().mockReturnValue('test-api-key'),
      getConfig: jest.fn().mockReturnValue(mockOptions)
    }));

    client = new NeuralLogClient(mockOptions);
  });

  describe('constructor', () => {
    it('should create specialized clients', () => {
      expect(LogClient).toHaveBeenCalled();
      expect(AuthClient).toHaveBeenCalled();
      expect(UserClient).toHaveBeenCalled();
      expect(KeyManagementClient).toHaveBeenCalled();
      expect(ApiKeyClient).toHaveBeenCalled();
    });

    it('should initialize with API key if provided', () => {
      const mockAuthenticateWithApiKey = jest.fn().mockResolvedValue(true);
      (AuthClient as jest.Mock).mockImplementation(() => ({
        loginWithApiKey: mockAuthenticateWithApiKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const clientWithApiKey = new NeuralLogClient(mockOptions);

      // We can't directly test the API key initialization since it's done in a catch block
      // But we can verify the AuthClient was created with the correct options
      expect(AuthClient).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          getTenantId: expect.any(Function)
        }),
        expect.anything()
      );
    });
  });

  describe('initialize', () => {
    it('should initialize all specialized clients', async () => {
      // Create a new client with mocked clients
      const mockLogInitialize = jest.fn().mockResolvedValue(undefined);
      const mockAuthInitialize = jest.fn().mockResolvedValue(undefined);
      const mockUserInitialize = jest.fn().mockResolvedValue(undefined);
      const mockKeyManagementInitialize = jest.fn().mockResolvedValue(undefined);
      const mockApiKeyInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks with separate mock functions
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockLogInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockAuthInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockUserInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockKeyManagementInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockApiKeyInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();

      // Each client should have its initialize method called at least once
      expect(mockLogInitialize).toHaveBeenCalled();
      expect(mockAuthInitialize).toHaveBeenCalled();
      expect(mockUserInitialize).toHaveBeenCalled();
      expect(mockKeyManagementInitialize).toHaveBeenCalled();
      expect(mockApiKeyInitialize).toHaveBeenCalled();
    });

    it('should set initialized to true after successful initialization', async () => {
      // Create a new client with mocked clients
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();

      expect(newClient.isInitialized()).toBe(true);
    });

    it('should throw an error if initialization fails', async () => {
      // Create a new client with mocked clients
      const mockInitialize = jest.fn().mockRejectedValue(new Error('Initialization failed'));

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await expect(newClient.initialize()).rejects.toThrow('Failed to initialize client: Initialization failed');
    });
  });

  describe('isInitialized', () => {
    it('should return false by default', () => {
      // Create a new client with mocked clients
      const newClient = new NeuralLogClient(mockOptions);
      expect(newClient.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      // Create a new client with mocked clients
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();

      expect(newClient.isInitialized()).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should delegate to the auth client', () => {
      // Create a new client with mocked AuthClient
      const mockIsAuthenticated = jest.fn().mockReturnValue(true);
      (AuthClient as jest.Mock).mockImplementation(() => ({
        isAuthenticated: mockIsAuthenticated,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      const result = newClient.isAuthenticated();

      expect(mockIsAuthenticated).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('login', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockLogin = jest.fn().mockResolvedValue({ token: 'test-token' });
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        login: mockLogin,
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.login('username', 'password');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the auth client', async () => {
      // Create a new client with mocked clients
      const mockLogin = jest.fn().mockResolvedValue({ token: 'test-token' });

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        login: mockLogin,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.login('username', 'password');

      expect(mockLogin).toHaveBeenCalledWith('username', 'password');
      expect(result).toBe(true);
    });

    it('should return false if login fails', async () => {
      // Create a new client with mocked clients
      const mockLogin = jest.fn().mockResolvedValue({ token: null });

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        login: mockLogin,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.login('username', 'password');

      expect(result).toBe(false);
    });

    it('should throw an error if login throws', async () => {
      // Create a new client with mocked clients
      const mockLogin = jest.fn().mockRejectedValue(new Error('Login failed'));

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        login: mockLogin,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.login('username', 'password')).rejects.toThrow('Failed to login: Login failed');
    });
  });

  describe('authenticateWithApiKey', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockLoginWithApiKey = jest.fn().mockResolvedValue({ token: 'test-token' });
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        loginWithApiKey: mockLoginWithApiKey,
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.authenticateWithApiKey('api-key');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the auth client', async () => {
      // Create a new client with mocked clients
      const mockLoginWithApiKey = jest.fn().mockResolvedValue({ token: 'test-token' });

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        loginWithApiKey: mockLoginWithApiKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.authenticateWithApiKey('api-key');

      expect(mockLoginWithApiKey).toHaveBeenCalledWith('api-key');
      expect(result).toBe(true);
    });

    it('should return false if login with API key fails', async () => {
      // Create a new client with mocked clients
      const mockLoginWithApiKey = jest.fn().mockResolvedValue({ token: null });

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        loginWithApiKey: mockLoginWithApiKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.authenticateWithApiKey('api-key');

      expect(result).toBe(false);
    });

    it('should throw an error if login with API key throws', async () => {
      // Create a new client with mocked clients
      const mockLoginWithApiKey = jest.fn().mockRejectedValue(new Error('API key login failed'));

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        loginWithApiKey: mockLoginWithApiKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.authenticateWithApiKey('api-key')).rejects.toThrow('Failed to authenticate with API key: API key login failed');
    });
  });

  describe('logout', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockLogout = jest.fn().mockResolvedValue(undefined);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        logout: mockLogout,
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.logout();

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the auth client', async () => {
      // Create a new client with mocked clients
      const mockLogout = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        logout: mockLogout,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await newClient.logout();

      expect(mockLogout).toHaveBeenCalled();
    });

    it('should throw an error if logout throws', async () => {
      // Create a new client with mocked clients
      const mockLogout = jest.fn().mockRejectedValue(new Error('Logout failed'));

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        logout: mockLogout,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.logout()).rejects.toThrow('Failed to logout: Logout failed');
    });
  });

  describe('log', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockLog = jest.fn().mockResolvedValue('log-id');
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        log: mockLog,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.log('log-name', { message: 'test' });

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the log client', async () => {
      // Create a new client with mocked clients
      const mockLog = jest.fn().mockResolvedValue('log-id');

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        log: mockLog,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.log('log-name', { message: 'test' }, { kekVersion: 'v1' });

      expect(mockLog).toHaveBeenCalledWith('log-name', { message: 'test' }, { kekVersion: 'v1' });
      expect(result).toBe('log-id');
    });

    it('should throw an error if log throws', async () => {
      // Create a new client with mocked clients
      const mockLog = jest.fn().mockRejectedValue(new Error('Log failed'));

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        log: mockLog,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.log('log-name', { message: 'test' })).rejects.toThrow('Failed to log data: Log failed');
    });
  });

  describe('getLogs', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockGetLogs = jest.fn().mockResolvedValue([{ id: 'log-1' }]);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        getLogs: mockGetLogs,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.getLogs('log-name');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the log client', async () => {
      // Create a new client with mocked clients
      const mockGetLogs = jest.fn().mockResolvedValue([{ id: 'log-1' }]);

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        getLogs: mockGetLogs,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.getLogs('log-name', { limit: 10 });

      expect(mockGetLogs).toHaveBeenCalledWith('log-name', { limit: 10 });
      expect(result).toEqual([{ id: 'log-1' }]);
    });

    it('should throw an error if getLogs throws', async () => {
      // Create a new client with mocked clients
      const mockGetLogs = jest.fn().mockRejectedValue(new Error('Get logs failed'));

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        getLogs: mockGetLogs,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.getLogs('log-name')).rejects.toThrow('Failed to get logs: Get logs failed');
    });
  });

  describe('searchLogs', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockSearchLogs = jest.fn().mockResolvedValue([{ id: 'log-1' }]);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        searchLogs: mockSearchLogs,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.searchLogs('log-name', { query: 'test' });

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the log client', async () => {
      // Create a new client with mocked clients
      const mockSearchLogs = jest.fn().mockResolvedValue([{ id: 'log-1' }]);

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        searchLogs: mockSearchLogs,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.searchLogs('log-name', { query: 'test' });

      expect(mockSearchLogs).toHaveBeenCalledWith('log-name', { query: 'test' });
      expect(result).toEqual([{ id: 'log-1' }]);
    });

    it('should throw an error if searchLogs throws', async () => {
      // Create a new client with mocked clients
      const mockSearchLogs = jest.fn().mockRejectedValue(new Error('Search logs failed'));

      // Setup all mocks
      (LogClient as jest.Mock).mockImplementation(() => ({
        searchLogs: mockSearchLogs,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.searchLogs('log-name', { query: 'test' })).rejects.toThrow('Failed to search logs: Search logs failed');
    });
  });

  describe('getUsers', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockGetUsers = jest.fn().mockResolvedValue([{ id: 'user-1', email: 'user@example.com', name: 'User 1', isAdmin: false, createdAt: new Date().toISOString() }]);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        getUsers: mockGetUsers,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.getUsers();

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the user client', async () => {
      // Create a new client with mocked clients
      const mockUsers = [{ id: 'user-1', email: 'user@example.com', name: 'User 1', isAdmin: false, createdAt: new Date().toISOString() }];
      const mockGetUsers = jest.fn().mockResolvedValue(mockUsers);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        getUsers: mockGetUsers,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.getUsers();

      expect(mockGetUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should throw an error if getUsers throws', async () => {
      // Create a new client with mocked clients
      const mockGetUsers = jest.fn().mockRejectedValue(new Error('Get users failed'));

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        getUsers: mockGetUsers,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.getUsers()).rejects.toThrow('Failed to get users: Get users failed');
    });
  });

  describe('getPendingAdminPromotions', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockGetPendingAdminPromotions = jest.fn().mockResolvedValue([{ id: 'promotion-1', userId: 'user-1', requestedBy: 'admin-1', status: 'pending', createdAt: new Date().toISOString() }]);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        getPendingAdminPromotions: mockGetPendingAdminPromotions,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.getPendingAdminPromotions();

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the user client', async () => {
      // Create a new client with mocked clients
      const mockPromotions = [{ id: 'promotion-1', userId: 'user-1', requestedBy: 'admin-1', status: 'pending', createdAt: new Date().toISOString() }];
      const mockGetPendingAdminPromotions = jest.fn().mockResolvedValue(mockPromotions);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        getPendingAdminPromotions: mockGetPendingAdminPromotions,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.getPendingAdminPromotions();

      expect(mockGetPendingAdminPromotions).toHaveBeenCalled();
      expect(result).toEqual(mockPromotions);
    });

    it('should throw an error if getPendingAdminPromotions throws', async () => {
      // Create a new client with mocked clients
      const mockGetPendingAdminPromotions = jest.fn().mockRejectedValue(new Error('Get pending admin promotions failed'));

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        getPendingAdminPromotions: mockGetPendingAdminPromotions,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.getPendingAdminPromotions()).rejects.toThrow('Failed to get pending admin promotions: Get pending admin promotions failed');
    });
  });

  describe('approveAdminPromotion', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockApproveAdminPromotion = jest.fn().mockResolvedValue(undefined);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        approveAdminPromotion: mockApproveAdminPromotion,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.approveAdminPromotion('promotion-1', 'password');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the user client', async () => {
      // Create a new client with mocked clients
      const mockApproveAdminPromotion = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        approveAdminPromotion: mockApproveAdminPromotion,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await newClient.approveAdminPromotion('promotion-1', 'password');

      expect(mockApproveAdminPromotion).toHaveBeenCalledWith('promotion-1', 'password');
    });

    it('should throw an error if approveAdminPromotion throws', async () => {
      // Create a new client with mocked clients
      const mockApproveAdminPromotion = jest.fn().mockRejectedValue(new Error('Approve admin promotion failed'));

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        approveAdminPromotion: mockApproveAdminPromotion,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.approveAdminPromotion('promotion-1', 'password')).rejects.toThrow('Failed to approve admin promotion: Approve admin promotion failed');
    });
  });

  describe('rejectAdminPromotion', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockRejectAdminPromotion = jest.fn().mockResolvedValue(undefined);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        rejectAdminPromotion: mockRejectAdminPromotion,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.rejectAdminPromotion('promotion-1');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the user client', async () => {
      // Create a new client with mocked clients
      const mockRejectAdminPromotion = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        rejectAdminPromotion: mockRejectAdminPromotion,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await newClient.rejectAdminPromotion('promotion-1');

      expect(mockRejectAdminPromotion).toHaveBeenCalledWith('promotion-1');
    });

    it('should throw an error if rejectAdminPromotion throws', async () => {
      // Create a new client with mocked clients
      const mockRejectAdminPromotion = jest.fn().mockRejectedValue(new Error('Reject admin promotion failed'));

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        rejectAdminPromotion: mockRejectAdminPromotion,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.rejectAdminPromotion('promotion-1')).rejects.toThrow('Failed to reject admin promotion: Reject admin promotion failed');
    });
  });

  describe('createApiKey', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockCreateApiKey = jest.fn().mockResolvedValue('api-key-id');
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        createApiKey: mockCreateApiKey,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.createApiKey('test-key');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the API key client', async () => {
      // Create a new client with mocked clients
      const mockCreateApiKey = jest.fn().mockResolvedValue('api-key-id');

      // Setup all mocks
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        createApiKey: mockCreateApiKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.createApiKey('test-key', 3600);

      expect(mockCreateApiKey).toHaveBeenCalledWith('test-key', 3600);
      expect(result).toBe('api-key-id');
    });

    it('should throw an error if createApiKey throws', async () => {
      // Create a new client with mocked clients
      const mockCreateApiKey = jest.fn().mockRejectedValue(new Error('Create API key failed'));

      // Setup all mocks
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        createApiKey: mockCreateApiKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.createApiKey('test-key')).rejects.toThrow('Failed to create API key: Create API key failed');
    });
  });

  describe('getApiKeys', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockGetApiKeys = jest.fn().mockResolvedValue([{ id: 'api-key-1', name: 'test-key', permissions: [], createdAt: new Date().toISOString() }]);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        getApiKeys: mockGetApiKeys,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.getApiKeys();

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the API key client', async () => {
      // Create a new client with mocked clients
      const mockApiKeys = [{ id: 'api-key-1', name: 'test-key', permissions: [], createdAt: new Date().toISOString() }];
      const mockGetApiKeys = jest.fn().mockResolvedValue(mockApiKeys);

      // Setup all mocks
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        getApiKeys: mockGetApiKeys,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.getApiKeys();

      expect(mockGetApiKeys).toHaveBeenCalled();
      expect(result).toEqual(mockApiKeys);
    });

    it('should throw an error if getApiKeys throws', async () => {
      // Create a new client with mocked clients
      const mockGetApiKeys = jest.fn().mockRejectedValue(new Error('Get API keys failed'));

      // Setup all mocks
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        getApiKeys: mockGetApiKeys,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.getApiKeys()).rejects.toThrow('Failed to get API keys: Get API keys failed');
    });
  });

  describe('revokeApiKey', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockRevokeApiKey = jest.fn().mockResolvedValue(undefined);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        revokeApiKey: mockRevokeApiKey,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.revokeApiKey('api-key-1');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the API key client', async () => {
      // Create a new client with mocked clients
      const mockRevokeApiKey = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        revokeApiKey: mockRevokeApiKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await newClient.revokeApiKey('api-key-1');

      expect(mockRevokeApiKey).toHaveBeenCalledWith('api-key-1');
    });

    it('should throw an error if revokeApiKey throws', async () => {
      // Create a new client with mocked clients
      const mockRevokeApiKey = jest.fn().mockRejectedValue(new Error('Revoke API key failed'));

      // Setup all mocks
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        revokeApiKey: mockRevokeApiKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.revokeApiKey('api-key-1')).rejects.toThrow('Failed to revoke API key: Revoke API key failed');
    });
  });

  describe('getKEKVersions', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockGetKEKVersions = jest.fn().mockResolvedValue([{ id: 'kek-1', version: 'v1', active: true, createdAt: new Date().toISOString() }]);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        getKEKVersions: mockGetKEKVersions,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.getKEKVersions();

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the key management client', async () => {
      // Create a new client with mocked clients
      const mockKEKVersions = [{ id: 'kek-1', version: 'v1', active: true, createdAt: new Date().toISOString() }];
      const mockGetKEKVersions = jest.fn().mockResolvedValue(mockKEKVersions);

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        getKEKVersions: mockGetKEKVersions,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.getKEKVersions();

      expect(mockGetKEKVersions).toHaveBeenCalled();
      expect(result).toEqual(mockKEKVersions);
    });

    it('should throw an error if getKEKVersions throws', async () => {
      // Create a new client with mocked clients
      const mockGetKEKVersions = jest.fn().mockRejectedValue(new Error('Get KEK versions failed'));

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        getKEKVersions: mockGetKEKVersions,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.getKEKVersions()).rejects.toThrow('Failed to get KEK versions: Get KEK versions failed');
    });
  });

  describe('createKEKVersion', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockCreateKEKVersion = jest.fn().mockResolvedValue({ id: 'kek-1', version: 'v1', active: true, createdAt: new Date().toISOString() });
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        createKEKVersion: mockCreateKEKVersion,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.createKEKVersion('test reason');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the key management client', async () => {
      // Create a new client with mocked clients
      const mockKEKVersion = { id: 'kek-1', version: 'v1', active: true, createdAt: new Date().toISOString() };
      const mockCreateKEKVersion = jest.fn().mockResolvedValue(mockKEKVersion);

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        createKEKVersion: mockCreateKEKVersion,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.createKEKVersion('test reason');

      expect(mockCreateKEKVersion).toHaveBeenCalledWith('test reason');
      expect(result).toEqual(mockKEKVersion);
    });

    it('should throw an error if createKEKVersion throws', async () => {
      // Create a new client with mocked clients
      const mockCreateKEKVersion = jest.fn().mockRejectedValue(new Error('Create KEK version failed'));

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        createKEKVersion: mockCreateKEKVersion,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.createKEKVersion('test reason')).rejects.toThrow('Failed to create KEK version: Create KEK version failed');
    });
  });

  describe('rotateKEK', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockRotateKEK = jest.fn().mockResolvedValue({ id: 'kek-1', version: 'v1', active: true, createdAt: new Date().toISOString() });
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        rotateKEK: mockRotateKEK,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.rotateKEK('test reason');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the key management client', async () => {
      // Create a new client with mocked clients
      const mockKEKVersion = { id: 'kek-1', version: 'v1', active: true, createdAt: new Date().toISOString() };
      const mockRotateKEK = jest.fn().mockResolvedValue(mockKEKVersion);

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        rotateKEK: mockRotateKEK,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.rotateKEK('test reason', ['user-1']);

      expect(mockRotateKEK).toHaveBeenCalledWith('test reason', ['user-1']);
      expect(result).toEqual(mockKEKVersion);
    });

    it('should throw an error if rotateKEK throws', async () => {
      // Create a new client with mocked clients
      const mockRotateKEK = jest.fn().mockRejectedValue(new Error('Rotate KEK failed'));

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        rotateKEK: mockRotateKEK,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.rotateKEK('test reason')).rejects.toThrow('Failed to rotate KEK: Rotate KEK failed');
    });
  });

  describe('uploadUserPublicKey', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockUploadUserPublicKey = jest.fn().mockResolvedValue(undefined);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        uploadUserPublicKey: mockUploadUserPublicKey,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.uploadUserPublicKey('password');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the user client', async () => {
      // Create a new client with mocked clients
      const mockUploadUserPublicKey = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        uploadUserPublicKey: mockUploadUserPublicKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await newClient.uploadUserPublicKey('password');

      expect(mockUploadUserPublicKey).toHaveBeenCalledWith('password');
    });

    it('should throw an error if uploadUserPublicKey throws', async () => {
      // Create a new client with mocked clients
      const mockUploadUserPublicKey = jest.fn().mockRejectedValue(new Error('Upload user public key failed'));

      // Setup all mocks
      (UserClient as jest.Mock).mockImplementation(() => ({
        uploadUserPublicKey: mockUploadUserPublicKey,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.uploadUserPublicKey('password')).rejects.toThrow('Failed to upload user public key: Upload user public key failed');
    });
  });

  describe('provisionKEKForUser', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockProvisionKEKForUser = jest.fn().mockResolvedValue(undefined);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        provisionKEKForUser: mockProvisionKEKForUser,
        initialize: mockInitialize
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.provisionKEKForUser('user-1', 'kek-1');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the key management client', async () => {
      // Create a new client with mocked clients
      const mockProvisionKEKForUser = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        provisionKEKForUser: mockProvisionKEKForUser,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await newClient.provisionKEKForUser('user-1', 'kek-1');

      expect(mockProvisionKEKForUser).toHaveBeenCalledWith('user-1', 'kek-1');
    });

    it('should throw an error if provisionKEKForUser throws', async () => {
      // Create a new client with mocked clients
      const mockProvisionKEKForUser = jest.fn().mockRejectedValue(new Error('Provision KEK for user failed'));

      // Setup all mocks
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        provisionKEKForUser: mockProvisionKEKForUser,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.provisionKEKForUser('user-1', 'kek-1')).rejects.toThrow('Failed to provision KEK for user: Provision KEK for user failed');
    });
  });

  describe('checkPermission', () => {
    it('should initialize the client if not initialized', async () => {
      // Create a new client with mocked clients
      const mockCheckPermission = jest.fn().mockResolvedValue(true);
      const mockInitialize = jest.fn().mockResolvedValue(undefined);

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        checkPermission: mockCheckPermission,
        initialize: mockInitialize
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: mockInitialize
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.checkPermission('read', 'log:test');

      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should delegate to the auth client', async () => {
      // Create a new client with mocked clients
      const mockCheckPermission = jest.fn().mockResolvedValue(true);

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        checkPermission: mockCheckPermission,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      const result = await newClient.checkPermission('read', 'log:test');

      expect(mockCheckPermission).toHaveBeenCalledWith('read', 'log:test');
      expect(result).toBe(true);
    });

    it('should throw an error if checkPermission throws', async () => {
      // Create a new client with mocked clients
      const mockCheckPermission = jest.fn().mockRejectedValue(new Error('Check permission failed'));

      // Setup all mocks
      (AuthClient as jest.Mock).mockImplementation(() => ({
        checkPermission: mockCheckPermission,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      await newClient.initialize();
      await expect(newClient.checkPermission('read', 'log:test')).rejects.toThrow('Failed to check permission: Check permission failed');
    });
  });

  describe('getter methods', () => {
    it('should return the log client', () => {
      // Create a new client with mocked clients
      const mockLogClient = {
        initialize: jest.fn().mockResolvedValue(undefined)
      };
      (LogClient as jest.Mock).mockImplementation(() => mockLogClient);
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      const result = newClient.getLogClient();

      expect(result).toBe(mockLogClient);
    });

    it('should return the auth client', () => {
      // Create a new client with mocked clients
      const mockAuthClient = {
        initialize: jest.fn().mockResolvedValue(undefined)
      };
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => mockAuthClient);
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      const result = newClient.getAuthClient();

      expect(result).toBe(mockAuthClient);
    });

    it('should return the user client', () => {
      // Create a new client with mocked clients
      const mockUserClient = {
        initialize: jest.fn().mockResolvedValue(undefined)
      };
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => mockUserClient);
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      const result = newClient.getUserClient();

      expect(result).toBe(mockUserClient);
    });

    it('should return the key management client', () => {
      // Create a new client with mocked clients
      const mockKeyManagementClient = {
        initialize: jest.fn().mockResolvedValue(undefined)
      };
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => mockKeyManagementClient);
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      const result = newClient.getKeyManagementClient();

      expect(result).toBe(mockKeyManagementClient);
    });

    it('should return the API key client', () => {
      // Create a new client with mocked clients
      const mockApiKeyClient = {
        initialize: jest.fn().mockResolvedValue(undefined)
      };
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => mockApiKeyClient);

      const newClient = new NeuralLogClient(mockOptions);
      const result = newClient.getApiKeyClient();

      expect(result).toBe(mockApiKeyClient);
    });

    it('should return the auth token', () => {
      // Create a new client with mocked clients
      const mockGetAuthToken = jest.fn().mockReturnValue('test-token');
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (AuthClient as jest.Mock).mockImplementation(() => ({
        getAuthToken: mockGetAuthToken,
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const newClient = new NeuralLogClient(mockOptions);
      const result = newClient.getAuthToken();

      expect(mockGetAuthToken).toHaveBeenCalled();
      expect(result).toBe('test-token');
    });
  });
});
