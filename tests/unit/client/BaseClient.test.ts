import { BaseClient } from '../../../src/client/BaseClient';
import { ConfigurationService } from '../../../src/client/services/ConfigurationService';
import { AuthProvider } from '../../../src/client/services/AuthProvider';
import { LogError } from '../../../src/errors';

// Mock dependencies
jest.mock('../../../src/client/services/ConfigurationService');
jest.mock('../../../src/client/services/AuthProvider');

// Create a concrete implementation of BaseClient for testing
class TestClient extends BaseClient {
  public testMethod(): string {
    return 'test';
  }

  // Expose protected methods for testing
  public testHandleError(error: unknown, operation: string, errorCode: string): never {
    return this.handleError(error, operation, errorCode);
  }

  public testCheckAuthentication(): void {
    return this.checkAuthentication();
  }

  public async testCheckInitialization(): Promise<void> {
    return this.checkInitialization();
  }
}

describe('BaseClient', () => {
  let client: TestClient;
  let mockConfigService: jest.Mocked<ConfigurationService>;
  let mockAuthProvider: jest.Mocked<AuthProvider>;

  beforeEach(() => {
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

    client = new TestClient(mockConfigService, mockAuthProvider);
  });

  describe('constructor', () => {
    it('should initialize with the provided dependencies', () => {
      expect(client['configService']).toBe(mockConfigService);
      expect(client['authProvider']).toBe(mockAuthProvider);
    });
  });

  describe('initialize', () => {
    it('should set initialized to true', async () => {
      await client.initialize();
      expect(client.isInitialized()).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return false by default', () => {
      expect(client.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await client.initialize();
      expect(client.isInitialized()).toBe(true);
    });
  });

  describe('configService', () => {
    it('should return the configuration service', () => {
      expect(client['configService']).toBe(mockConfigService);
    });
  });

  describe('authProvider', () => {
    it('should return the auth provider', () => {
      expect(client['authProvider']).toBe(mockAuthProvider);
    });
  });

  describe('getAuthToken', () => {
    it('should delegate to the auth provider', () => {
      // Execute
      const result = client.getAuthToken();

      // Verify
      expect(mockAuthProvider.getAuthToken).toHaveBeenCalled();
      expect(result).toBe('test-token');
    });
  });

  describe('isAuthenticated', () => {
    it('should delegate to the auth provider', () => {
      // Execute
      const result = client.isAuthenticated();

      // Verify
      expect(mockAuthProvider.isAuthenticated).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('checkAuthentication', () => {
    it('should throw an error if not authenticated', () => {
      // Setup
      mockAuthProvider.isAuthenticated.mockReturnValueOnce(false);

      // Execute & Verify
      expect(() => client.testCheckAuthentication()).toThrow(LogError);
    });

    it('should not throw an error if authenticated', () => {
      // Setup
      mockAuthProvider.isAuthenticated.mockReturnValueOnce(true);

      // Execute & Verify
      expect(() => client.testCheckAuthentication()).not.toThrow();
    });
  });

  describe('checkInitialization', () => {
    it('should initialize if not initialized', async () => {
      // Setup
      expect(client.isInitialized()).toBe(false);

      // Execute
      await client.testCheckInitialization();

      // Verify
      expect(client.isInitialized()).toBe(true);
    });

    it('should not initialize if already initialized', async () => {
      // Setup
      await client.initialize();
      const spy = jest.spyOn(client, 'initialize');

      // Execute
      await client.testCheckInitialization();

      // Verify
      expect(spy).not.toHaveBeenCalled();
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
        client.testHandleError(error, operation, errorCode);
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
        client.testHandleError(error, operation, errorCode);
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
});
