import { ConfigurationService } from '../../../../src/client/services/ConfigurationService';

describe('ConfigurationService', () => {
  describe('constructor', () => {
    it('should use default tenantId if not provided', () => {
      const service = new ConfigurationService({} as any);
      expect(service.getTenantId()).toBe('default');
    });

    it('should initialize with the provided options', () => {
      const options = {
        tenantId: 'test-tenant',
        serverUrl: 'https://api.test.com',
        authUrl: 'https://auth.test.com',
        registryUrl: 'https://registry.test.com',
        apiKey: 'test-api-key'
      };

      const service = new ConfigurationService(options);

      expect(service.getTenantId()).toBe('test-tenant');
      expect(service.getServerUrl()).toBe('https://api.test.com');
      expect(service.getAuthUrl()).toBe('https://auth.test.com');
      expect(service.getRegistryUrl()).toBe('https://registry.test.com');
      expect(service.getApiKey()).toBe('test-api-key');
    });

    it('should initialize with default values if not provided', () => {
      const options = {
        tenantId: 'test-tenant'
      };

      const service = new ConfigurationService(options);

      expect(service.getTenantId()).toBe('test-tenant');
      expect(service.getServerUrl()).toBeUndefined();
      expect(service.getAuthUrl()).toBeUndefined();
      expect(service.getRegistryUrl()).toBeUndefined();
      expect(service.getApiKey()).toBeUndefined();
    });
  });

  describe('getTenantId', () => {
    it('should return the tenant ID', () => {
      const service = new ConfigurationService({ tenantId: 'test-tenant' });
      expect(service.getTenantId()).toBe('test-tenant');
    });
  });

  describe('getServerUrl', () => {
    it('should return the server URL if provided', () => {
      const service = new ConfigurationService({
        tenantId: 'test-tenant',
        serverUrl: 'https://api.test.com'
      });
      expect(service.getServerUrl()).toBe('https://api.test.com');
    });

    it('should return undefined if server URL is not provided', () => {
      const service = new ConfigurationService({ tenantId: 'test-tenant' });
      expect(service.getServerUrl()).toBeUndefined();
    });
  });

  describe('getAuthUrl', () => {
    it('should return the auth URL if provided', () => {
      const service = new ConfigurationService({
        tenantId: 'test-tenant',
        authUrl: 'https://auth.test.com'
      });
      expect(service.getAuthUrl()).toBe('https://auth.test.com');
    });

    it('should return undefined if auth URL is not provided', () => {
      const service = new ConfigurationService({ tenantId: 'test-tenant' });
      expect(service.getAuthUrl()).toBeUndefined();
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
