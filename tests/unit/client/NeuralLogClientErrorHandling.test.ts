import { NeuralLogClient } from '../../../src/client/NeuralLogClient';
import { LogClient } from '../../../src/client/LogClient';
import { AuthClient } from '../../../src/client/AuthClient';
import { UserClient } from '../../../src/client/UserClient';
import { KeyManagementClient } from '../../../src/client/KeyManagementClient';
import { ApiKeyClient } from '../../../src/client/ApiKeyClient';
import { LogError } from '../../../src/errors/LogError';
import { LoggerService } from '../../../src/utils/LoggerService';

// Mock all client classes
jest.mock('../../../src/client/LogClient');
jest.mock('../../../src/client/AuthClient');
jest.mock('../../../src/client/UserClient');
jest.mock('../../../src/client/KeyManagementClient');
jest.mock('../../../src/client/ApiKeyClient');

describe('NeuralLogClient Error Handling', () => {
  // Test for non-Error objects being thrown
  describe('handleError with non-Error objects', () => {
    it('should handle string errors', async () => {
      // Setup KeyManagementClient to throw a string
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        createKEKVersion: jest.fn().mockImplementation(() => {
          throw 'String error';
        }),
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      // Setup other clients
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const client = new NeuralLogClient(mockOptions);
      await client.initialize();

      // Verify that createKEKVersion handles the string error correctly
      await expect(client.createKEKVersion('test reason')).rejects.toThrow('Failed to create KEK version: String error');
    });

    it('should handle number errors', async () => {
      // Setup KeyManagementClient to throw a number
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        rotateKEK: jest.fn().mockImplementation(() => {
          throw 404;
        }),
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      // Setup other clients
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const client = new NeuralLogClient(mockOptions);
      await client.initialize();

      // Verify that rotateKEK handles the number error correctly
      await expect(client.rotateKEK('test reason')).rejects.toThrow('Failed to rotate KEK: 404');
    });

    it('should handle object errors', async () => {
      // Setup UserClient to throw an object
      (UserClient as jest.Mock).mockImplementation(() => ({
        uploadUserPublicKey: jest.fn().mockImplementation(() => {
          throw { code: 'INVALID_PASSWORD' };
        }),
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      // Setup other clients
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

      const client = new NeuralLogClient(mockOptions);
      await client.initialize();

      // Verify that uploadUserPublicKey handles the object error correctly
      await expect(client.uploadUserPublicKey('password')).rejects.toThrow('Failed to upload user public key: [object Object]');
    });

    it('should handle null errors', async () => {
      // Setup KeyManagementClient to throw null
      (KeyManagementClient as jest.Mock).mockImplementation(() => ({
        provisionKEKForUser: jest.fn().mockImplementation(() => {
          throw null;
        }),
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      // Setup other clients
      (AuthClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (LogClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (UserClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));
      (ApiKeyClient as jest.Mock).mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      const client = new NeuralLogClient(mockOptions);
      await client.initialize();

      // Verify that provisionKEKForUser handles the null error correctly
      await expect(client.provisionKEKForUser('user-id', 'kek-version')).rejects.toThrow('Failed to provision KEK for user: null');
    });

    it('should handle undefined errors', async () => {
      // Setup AuthClient to throw undefined
      (AuthClient as jest.Mock).mockImplementation(() => ({
        checkPermission: jest.fn().mockImplementation(() => {
          throw undefined;
        }),
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      // Setup other clients
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

      const client = new NeuralLogClient(mockOptions);
      await client.initialize();

      // Verify that checkPermission handles the undefined error correctly
      await expect(client.checkPermission('read', 'log:test')).rejects.toThrow('Failed to check permission: undefined');
    });
  });

  // Default options for creating a client
  const mockOptions = {
    baseUrl: 'https://test.example.com',
    tenantId: 'test-tenant'
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('constructor error handling', () => {
    it('should handle API key authentication failure gracefully', async () => {
      // Mock LoggerService.error to capture the error message
      const mockLoggerError = jest.fn();
      jest.spyOn(LoggerService.prototype, 'error').mockImplementation(mockLoggerError);

      // Setup AuthClient to throw an error when loginWithApiKey is called
      (AuthClient as jest.Mock).mockImplementation(() => ({
        loginWithApiKey: jest.fn().mockRejectedValue(new Error('API key authentication failed')),
        initialize: jest.fn().mockResolvedValue(undefined)
      }));

      // Setup other clients
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

      // Create a client with an API key
      const client = new NeuralLogClient({
        ...mockOptions,
        apiKey: 'test-api-key'
      });

      // Wait for the promise in the constructor to resolve
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify that logger.error was called with the expected error message
      expect(mockLoggerError).toHaveBeenCalled();
      expect(mockLoggerError.mock.calls[0][0]).toContain('Failed to authenticate with API key');

      // Restore the original implementation
      jest.restoreAllMocks();
    });
  });

  describe('initialize error handling', () => {
    it('should handle initialization errors for each client type', async () => {
      // Test each client type failing to initialize
      const clientTypes = [
        { name: 'LogClient', clientClass: LogClient },
        { name: 'AuthClient', clientClass: AuthClient },
        { name: 'UserClient', clientClass: UserClient },
        { name: 'KeyManagementClient', clientClass: KeyManagementClient },
        { name: 'ApiKeyClient', clientClass: ApiKeyClient }
      ];

      for (const { name, clientClass } of clientTypes) {
        jest.clearAllMocks();

        // Setup all clients to initialize successfully except the one we're testing
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
        (ApiKeyClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Make the client we're testing fail to initialize
        (clientClass as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockRejectedValue(new Error(`${name} initialization failed`))
        }));

        const client = new NeuralLogClient(mockOptions);

        // Verify that initialize throws the expected error
        await expect(client.initialize()).rejects.toThrow(`Failed to initialize client: ${name} initialization failed`);

        // Verify that isInitialized returns false
        expect(client.isInitialized()).toBe(false);
      }
    });
  });

  describe('login error handling', () => {
    it('should handle login errors with different error types', async () => {
      // Test different types of errors that could occur during login
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Auth Error', error: new LogError('Authentication failed', 'auth_failed') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup AuthClient to throw the specified error
        (AuthClient as jest.Mock).mockImplementation(() => ({
          login: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that login throws the expected error
        await expect(client.login('username', 'password')).rejects.toThrow(`Failed to login: ${error.message}`);
      }
    });
  });

  describe('authenticateWithApiKey error handling', () => {
    it('should handle API key authentication errors with different error types', async () => {
      // Test different types of errors that could occur during API key authentication
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Auth Error', error: new LogError('Invalid API key', 'invalid_api_key') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup AuthClient to throw the specified error
        (AuthClient as jest.Mock).mockImplementation(() => ({
          loginWithApiKey: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that authenticateWithApiKey throws the expected error
        await expect(client.authenticateWithApiKey('api-key')).rejects.toThrow(`Failed to authenticate with API key: ${error.message}`);
      }
    });
  });

  describe('log error handling', () => {
    it('should handle log errors with different error types', async () => {
      // Test different types of errors that could occur during logging
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Validation Error', error: new LogError('Invalid log data', 'invalid_log_data') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup LogClient to throw the specified error
        (LogClient as jest.Mock).mockImplementation(() => ({
          log: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that log throws the expected error
        await expect(client.log('log-name', { message: 'test' })).rejects.toThrow(`Failed to log data: ${error.message}`);
      }
    });
  });

  describe('getLogs error handling', () => {
    it('should handle getLogs errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Permission Error', error: new LogError('Permission denied', 'permission_denied') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup LogClient to throw the specified error
        (LogClient as jest.Mock).mockImplementation(() => ({
          getLogs: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that getLogs throws the expected error
        await expect(client.getLogs('log-name')).rejects.toThrow(`Failed to get logs: ${error.message}`);
      }
    });
  });

  describe('searchLogs error handling', () => {
    it('should handle searchLogs errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Search Error', error: new LogError('Invalid search query', 'invalid_search_query') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup LogClient to throw the specified error
        (LogClient as jest.Mock).mockImplementation(() => ({
          searchLogs: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that searchLogs throws the expected error
        await expect(client.searchLogs('log-name', { query: 'test' })).rejects.toThrow(`Failed to search logs: ${error.message}`);
      }
    });
  });

  describe('getUsers error handling', () => {
    it('should handle getUsers errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Permission Error', error: new LogError('Permission denied', 'permission_denied') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup UserClient to throw the specified error
        (UserClient as jest.Mock).mockImplementation(() => ({
          getUsers: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that getUsers throws the expected error
        await expect(client.getUsers()).rejects.toThrow(`Failed to get users: ${error.message}`);
      }
    });
  });

  describe('createApiKey error handling', () => {
    it('should handle createApiKey errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Validation Error', error: new LogError('Invalid API key name', 'invalid_api_key_name') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup ApiKeyClient to throw the specified error
        (ApiKeyClient as jest.Mock).mockImplementation(() => ({
          createApiKey: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
        (AuthClient as jest.Mock).mockImplementation(() => ({
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that createApiKey throws the expected error
        await expect(client.createApiKey('test-key')).rejects.toThrow(`Failed to create API key: ${error.message}`);
      }
    });
  });

  describe('getApiKeys error handling', () => {
    it('should handle getApiKeys errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Permission Error', error: new LogError('Permission denied', 'permission_denied') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup ApiKeyClient to throw the specified error
        (ApiKeyClient as jest.Mock).mockImplementation(() => ({
          getApiKeys: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
        (AuthClient as jest.Mock).mockImplementation(() => ({
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that getApiKeys throws the expected error
        await expect(client.getApiKeys()).rejects.toThrow(`Failed to get API keys: ${error.message}`);
      }
    });
  });

  describe('revokeApiKey error handling', () => {
    it('should handle revokeApiKey errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Not Found Error', error: new LogError('API key not found', 'api_key_not_found') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup ApiKeyClient to throw the specified error
        (ApiKeyClient as jest.Mock).mockImplementation(() => ({
          revokeApiKey: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
        (AuthClient as jest.Mock).mockImplementation(() => ({
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that revokeApiKey throws the expected error
        await expect(client.revokeApiKey('api-key-id')).rejects.toThrow(`Failed to revoke API key: ${error.message}`);
      }
    });
  });

  describe('getKEKVersions error handling', () => {
    it('should handle getKEKVersions errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Permission Error', error: new LogError('Permission denied', 'permission_denied') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup KeyManagementClient to throw the specified error
        (KeyManagementClient as jest.Mock).mockImplementation(() => ({
          getKEKVersions: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
        (AuthClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (LogClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (UserClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (ApiKeyClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that getKEKVersions throws the expected error
        await expect(client.getKEKVersions()).rejects.toThrow(`Failed to get KEK versions: ${error.message}`);
      }
    });
  });

  describe('createKEKVersion error handling', () => {
    it('should handle createKEKVersion errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Permission Error', error: new LogError('Permission denied', 'permission_denied') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup KeyManagementClient to throw the specified error
        (KeyManagementClient as jest.Mock).mockImplementation(() => ({
          createKEKVersion: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
        (AuthClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (LogClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (UserClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (ApiKeyClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that createKEKVersion throws the expected error
        await expect(client.createKEKVersion('test reason')).rejects.toThrow(`Failed to create KEK version: ${error.message}`);
      }
    });
  });

  describe('rotateKEK error handling', () => {
    it('should handle rotateKEK errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Permission Error', error: new LogError('Permission denied', 'permission_denied') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup KeyManagementClient to throw the specified error
        (KeyManagementClient as jest.Mock).mockImplementation(() => ({
          rotateKEK: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
        (AuthClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (LogClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (UserClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (ApiKeyClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that rotateKEK throws the expected error
        await expect(client.rotateKEK('test reason')).rejects.toThrow(`Failed to rotate KEK: ${error.message}`);
      }
    });
  });

  describe('uploadUserPublicKey error handling', () => {
    it('should handle uploadUserPublicKey errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Validation Error', error: new LogError('Invalid public key', 'invalid_public_key') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup UserClient to throw the specified error
        (UserClient as jest.Mock).mockImplementation(() => ({
          uploadUserPublicKey: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that uploadUserPublicKey throws the expected error
        await expect(client.uploadUserPublicKey('password')).rejects.toThrow(`Failed to upload user public key: ${error.message}`);
      }
    });
  });

  describe('provisionKEKForUser error handling', () => {
    it('should handle provisionKEKForUser errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Not Found Error', error: new LogError('User not found', 'user_not_found') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup KeyManagementClient to throw the specified error
        (KeyManagementClient as jest.Mock).mockImplementation(() => ({
          provisionKEKForUser: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
        (AuthClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (LogClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (UserClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));
        (ApiKeyClient as jest.Mock).mockImplementation(() => ({
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that provisionKEKForUser throws the expected error
        await expect(client.provisionKEKForUser('user-id', 'kek-version')).rejects.toThrow(`Failed to provision KEK for user: ${error.message}`);
      }
    });
  });

  describe('checkPermission error handling', () => {
    it('should handle checkPermission errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Auth Error', error: new LogError('Invalid permission', 'invalid_permission') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup AuthClient to throw the specified error
        (AuthClient as jest.Mock).mockImplementation(() => ({
          checkPermission: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that checkPermission throws the expected error
        await expect(client.checkPermission('read', 'log:test')).rejects.toThrow(`Failed to check permission: ${error.message}`);
      }
    });
  });

  describe('getPendingAdminPromotions error handling', () => {
    it('should handle getPendingAdminPromotions errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Permission Error', error: new LogError('Permission denied', 'permission_denied') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup UserClient to throw the specified error
        (UserClient as jest.Mock).mockImplementation(() => ({
          getPendingAdminPromotions: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that getPendingAdminPromotions throws the expected error
        await expect(client.getPendingAdminPromotions()).rejects.toThrow(`Failed to get pending admin promotions: ${error.message}`);
      }
    });
  });

  describe('approveAdminPromotion error handling', () => {
    it('should handle approveAdminPromotion errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Not Found Error', error: new LogError('Promotion not found', 'promotion_not_found') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup UserClient to throw the specified error
        (UserClient as jest.Mock).mockImplementation(() => ({
          approveAdminPromotion: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that approveAdminPromotion throws the expected error
        await expect(client.approveAdminPromotion('promotion-id', 'share')).rejects.toThrow(`Failed to approve admin promotion: ${error.message}`);
      }
    });
  });

  describe('rejectAdminPromotion error handling', () => {
    it('should handle rejectAdminPromotion errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Not Found Error', error: new LogError('Promotion not found', 'promotion_not_found') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup UserClient to throw the specified error
        (UserClient as jest.Mock).mockImplementation(() => ({
          rejectAdminPromotion: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that rejectAdminPromotion throws the expected error
        await expect(client.rejectAdminPromotion('promotion-id')).rejects.toThrow(`Failed to reject admin promotion: ${error.message}`);
      }
    });
  });

  describe('logout error handling', () => {
    it('should handle logout errors with different error types', async () => {
      const errorTypes = [
        { name: 'Network Error', error: new Error('Network error') },
        { name: 'Auth Error', error: new LogError('Not authenticated', 'not_authenticated') },
        { name: 'Server Error', error: new Error('Internal server error') }
      ];

      for (const { name, error } of errorTypes) {
        jest.clearAllMocks();

        // Setup AuthClient to throw the specified error
        (AuthClient as jest.Mock).mockImplementation(() => ({
          logout: jest.fn().mockRejectedValue(error),
          initialize: jest.fn().mockResolvedValue(undefined)
        }));

        // Setup other clients
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

        const client = new NeuralLogClient(mockOptions);
        await client.initialize();

        // Verify that logout throws the expected error
        await expect(client.logout()).rejects.toThrow(`Failed to logout: ${error.message}`);
      }
    });
  });
});
