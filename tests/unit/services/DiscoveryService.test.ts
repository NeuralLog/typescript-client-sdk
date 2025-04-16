import { DiscoveryService } from '../../../src/services/DiscoveryService';
import { RegistryClient } from '../../../src/registry/RegistryClient';

// Mock the RegistryClient
jest.mock('../../../src/registry/RegistryClient');

describe('DiscoveryService', () => {
  const mockTenantId = 'test-tenant';
  const mockRegistryUrl = 'https://registry.test.com';
  const mockAuthUrl = 'https://auth.test.com';
  const mockServerUrl = 'https://api.test.com';
  const mockWebUrl = 'https://web.test.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a RegistryClient if registry URL is provided', () => {
      new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      expect(RegistryClient).toHaveBeenCalledWith(
        mockRegistryUrl,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );
    });

    it('should construct a registry URL from tenant ID if not provided', () => {
      new DiscoveryService(
        mockTenantId,
        undefined,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      expect(RegistryClient).toHaveBeenCalledWith(
        `https://registry.${mockTenantId}.neurallog.app`,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );
    });
  });

  describe('getRegistryUrl', () => {
    it('should return the registry URL', () => {
      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      expect(service.getRegistryUrl()).toBe(mockRegistryUrl);
    });
  });

  describe('setRegistryUrl', () => {
    it('should update the registry URL and create a new RegistryClient', () => {
      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Clear the mock to verify it's called again
      (RegistryClient as jest.Mock).mockClear();

      // Set a new registry URL
      const newRegistryUrl = 'https://new-registry.test.com';
      service.setRegistryUrl(newRegistryUrl);

      expect(service.getRegistryUrl()).toBe(newRegistryUrl);
      expect(RegistryClient).toHaveBeenCalledWith(
        newRegistryUrl,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );
    });
  });

  describe('getTenantId', () => {
    it('should return the tenant ID', () => {
      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      expect(service.getTenantId()).toBe(mockTenantId);
    });
  });

  describe('setTenantId', () => {
    it('should update the tenant ID and create a new RegistryClient if registry URL was constructed from tenant ID', () => {
      const service = new DiscoveryService(
        mockTenantId,
        undefined, // This will construct a registry URL from tenant ID
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Clear the mock to verify it's called again
      (RegistryClient as jest.Mock).mockClear();

      // Set a new tenant ID
      const newTenantId = 'new-tenant';
      service.setTenantId(newTenantId);

      expect(service.getTenantId()).toBe(newTenantId);
      expect(RegistryClient).toHaveBeenCalledWith(
        `https://registry.${newTenantId}.neurallog.app`,
        newTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );
    });

    it('should not update the registry URL if it was not constructed from tenant ID', () => {
      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl, // Explicitly provided registry URL
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Clear the mock to verify it's called again
      (RegistryClient as jest.Mock).mockClear();

      // Set a new tenant ID
      const newTenantId = 'new-tenant';
      service.setTenantId(newTenantId);

      expect(service.getTenantId()).toBe(newTenantId);
      expect(RegistryClient).not.toHaveBeenCalled();
    });
  });

  describe('getEndpoints', () => {
    it('should delegate to the registry client if available', async () => {
      // Mock the getEndpoints method to return a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryClient as jest.Mock).mockImplementation(() => ({
        getEndpoints: mockGetEndpoints
      }));

      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      const result = await service.getEndpoints();

      expect(mockGetEndpoints).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should fall back to environment variables if registry client is not available', async () => {
      // Create a service without a registry URL
      const service = new DiscoveryService(
        mockTenantId,
        undefined,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      const result = await service.getEndpoints();

      expect(result).toEqual({
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      });
    });

    it('should fall back to environment variables if registry client throws', async () => {
      // Mock the getEndpoints method to throw an error
      const mockGetEndpoints = jest.fn().mockRejectedValue(new Error('Registry fetch failed'));
      (RegistryClient as jest.Mock).mockImplementation(() => ({
        getEndpoints: mockGetEndpoints
      }));

      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      const result = await service.getEndpoints();

      expect(mockGetEndpoints).toHaveBeenCalled();
      expect(result).toEqual({
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      });
    });

    it('should throw an error if no environment variables are available', async () => {
      // Create a service without environment variables
      const service = new DiscoveryService(
        mockTenantId,
        undefined
      );

      await expect(service.getEndpoints()).rejects.toThrow('Failed to get endpoints from registry and no environment variables are available');
    });
  });

  describe('getAuthUrl', () => {
    it('should return the auth URL from the endpoints', async () => {
      // Mock the getEndpoints method to return a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryClient as jest.Mock).mockImplementation(() => ({
        getEndpoints: mockGetEndpoints
      }));

      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      const result = await service.getAuthUrl();

      expect(result).toBe(mockAuthUrl);
    });
  });

  describe('getServerUrl', () => {
    it('should return the server URL from the endpoints', async () => {
      // Mock the getEndpoints method to return a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryClient as jest.Mock).mockImplementation(() => ({
        getEndpoints: mockGetEndpoints
      }));

      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      const result = await service.getServerUrl();

      expect(result).toBe(mockServerUrl);
    });
  });

  describe('getWebUrl', () => {
    it('should return the web URL from the endpoints', async () => {
      // Mock the getEndpoints method to return a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryClient as jest.Mock).mockImplementation(() => ({
        getEndpoints: mockGetEndpoints
      }));

      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      const result = await service.getWebUrl();

      expect(result).toBe(mockWebUrl);
    });
  });

  describe('getApiVersion', () => {
    it('should return the API version from the endpoints', async () => {
      // Mock the getEndpoints method to return a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryClient as jest.Mock).mockImplementation(() => ({
        getEndpoints: mockGetEndpoints
      }));

      const service = new DiscoveryService(
        mockTenantId,
        mockRegistryUrl,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      const result = await service.getApiVersion();

      expect(result).toBe('v1');
    });
  });
});
