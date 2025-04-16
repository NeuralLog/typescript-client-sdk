import { ConfigurationService } from '../../../../src/client/services/ConfigurationService';

describe('ConfigurationService', () => {
  describe('constructor', () => {
    it('should use default tenantId if not provided', () => {
      const service = new ConfigurationService({} as any);
      expect(service.getTenantId()).toBe('default');
    });

    it('should initialize with the provided options', async () => {
      const options = {
        tenantId: 'test-tenant',
        serverUrl: 'https://api.test.com',
        authUrl: 'https://auth.test.com',
        registryUrl: 'https://registry.test.com',
        apiKey: 'test-api-key',
        skipRegistryLookup: true
      };

      const service = new ConfigurationService(options);

      expect(service.getTenantId()).toBe('test-tenant');
      expect(service.getServerUrlSync()).toBe('https://api.test.com');
      expect(service.getAuthUrlSync()).toBe('https://auth.test.com');
      expect(service.getRegistryUrl()).toBe('https://registry.test.com');
      expect(service.getApiKey()).toBe('test-api-key');

      expect(await service.getServerUrl()).toBe('https://api.test.com');
      expect(await service.getAuthUrl()).toBe('https://auth.test.com');
    });

    it('should initialize with default values if not provided', async () => {
      const options = {
        tenantId: 'test-tenant',
        skipRegistryLookup: true
      };

      const service = new ConfigurationService(options);

      expect(service.getTenantId()).toBe('test-tenant');
      expect(service.getServerUrlSync()).toBeUndefined();
      expect(service.getAuthUrlSync()).toBeUndefined();
      expect(service.getRegistryUrl()).toBeUndefined();
      expect(service.getApiKey()).toBeUndefined();

      expect(await service.getServerUrl()).toBe('http://localhost:3030');
      expect(await service.getAuthUrl()).toBe('http://localhost:3040');
    });
  });

  describe('getTenantId', () => {
    it('should return the tenant ID', () => {
      const service = new ConfigurationService({ tenantId: 'test-tenant' });
      expect(service.getTenantId()).toBe('test-tenant');
    });
  });

  describe('getServerUrl', () => {
    it('should return the server URL if provided', async () => {
      const service = new ConfigurationService({
        tenantId: 'test-tenant',
        serverUrl: 'https://api.test.com',
        skipRegistryLookup: true
      });
      expect(await service.getServerUrl()).toBe('https://api.test.com');
    });

    it('should return default URL if server URL is not provided', async () => {
      const service = new ConfigurationService({
        tenantId: 'test-tenant',
        skipRegistryLookup: true
      });
      expect(await service.getServerUrl()).toBe('http://localhost:3030');
    });
  });

  describe('getAuthUrl', () => {
    it('should return the auth URL if provided', async () => {
      const service = new ConfigurationService({
        tenantId: 'test-tenant',
        authUrl: 'https://auth.test.com',
        skipRegistryLookup: true
      });
      expect(await service.getAuthUrl()).toBe('https://auth.test.com');
    });

    it('should return default URL if auth URL is not provided', async () => {
      const service = new ConfigurationService({
        tenantId: 'test-tenant',
        skipRegistryLookup: true
      });
      expect(await service.getAuthUrl()).toBe('http://localhost:3040');
    });
  });

  describe('getRegistryUrl', () => {
    it('should return the registry URL if provided', () => {
      const service = new ConfigurationService({
        tenantId: 'test-tenant',
        registryUrl: 'https://registry.test.com'
      });
      expect(service.getRegistryUrl()).toBe('https://registry.test.com');
    });

    it('should return undefined if registry URL is not provided', () => {
      const service = new ConfigurationService({ tenantId: 'test-tenant' });
      expect(service.getRegistryUrl()).toBeUndefined();
    });
  });

  describe('getApiKey', () => {
    it('should return the API key if provided', () => {
      const service = new ConfigurationService({
        tenantId: 'test-tenant',
        apiKey: 'test-api-key'
      });
      expect(service.getApiKey()).toBe('test-api-key');
    });

    it('should return undefined if API key is not provided', () => {
      const service = new ConfigurationService({ tenantId: 'test-tenant' });
      expect(service.getApiKey()).toBeUndefined();
    });
  });
});
