import { NeuralLogClientFactory } from '../../../src/client/NeuralLogClientFactory';
import { NeuralLogClient } from '../../../src/client/NeuralLogClient';
import { LogClient } from '../../../src/client/LogClient';
import { AuthClient } from '../../../src/client/AuthClient';
import { UserClient } from '../../../src/client/UserClient';
import { KeyManagementClient } from '../../../src/client/KeyManagementClient';
import { ApiKeyClient } from '../../../src/client/ApiKeyClient';

// Mock the client classes
jest.mock('../../../src/client/NeuralLogClient');
jest.mock('../../../src/client/LogClient');
jest.mock('../../../src/client/AuthClient');
jest.mock('../../../src/client/UserClient');
jest.mock('../../../src/client/KeyManagementClient');
jest.mock('../../../src/client/ApiKeyClient');

describe('NeuralLogClientFactory', () => {
  const mockOptions = {
    tenantId: 'test-tenant',
    serverUrl: 'https://api.test.com',
    authUrl: 'https://auth.test.com',
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a NeuralLogClient with the provided options', () => {
      const client = NeuralLogClientFactory.createClient(mockOptions);

      expect(NeuralLogClient).toHaveBeenCalledWith(mockOptions);
      expect(client).toBeInstanceOf(NeuralLogClient);
    });
  });

  describe('createLogClient', () => {
    it('should create a LogClient with the provided options', () => {
      const client = NeuralLogClientFactory.createLogClient(mockOptions);

      expect(LogClient).toHaveBeenCalled();
      expect(client).toBeInstanceOf(LogClient);
    });
  });

  describe('createAuthClient', () => {
    it('should create an AuthClient with the provided options', () => {
      const client = NeuralLogClientFactory.createAuthClient(mockOptions);

      expect(AuthClient).toHaveBeenCalled();
      expect(client).toBeInstanceOf(AuthClient);
    });
  });

  describe('createUserClient', () => {
    it('should create a UserClient with the provided options', () => {
      const client = NeuralLogClientFactory.createUserClient(mockOptions);

      expect(UserClient).toHaveBeenCalled();
      expect(client).toBeInstanceOf(UserClient);
    });
  });

  describe('createKeyManagementClient', () => {
    it('should create a KeyManagementClient with the provided options', () => {
      const client = NeuralLogClientFactory.createKeyManagementClient(mockOptions);

      expect(KeyManagementClient).toHaveBeenCalled();
      expect(client).toBeInstanceOf(KeyManagementClient);
    });
  });

  describe('createApiKeyClient', () => {
    it('should create an ApiKeyClient with the provided options', () => {
      const client = NeuralLogClientFactory.createApiKeyClient(mockOptions);

      expect(ApiKeyClient).toHaveBeenCalled();
      expect(client).toBeInstanceOf(ApiKeyClient);
    });
  });
});
