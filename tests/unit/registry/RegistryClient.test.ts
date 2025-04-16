import { RegistryClient } from '../../../src/registry/RegistryClient';
import { RegistryApi } from '../../../src/registry/openapi';

// Mock the RegistryApi
jest.mock('../../../src/registry/openapi', () => ({
  RegistryApi: jest.fn().mockImplementation(() => ({
    endpoints: {
      getEndpoints: jest.fn()
    }
  }))
}));

describe('RegistryClient', () => {
  let client: RegistryClient;
  const mockRegistryUrl = 'https://registry.test.com';
  const mockTenantId = 'test-tenant';
  const mockAuthUrl = 'https://auth.test.com';
  const mockServerUrl = 'https://api.test.com';
  const mockWebUrl = 'https://web.test.com';

  beforeEach(() => {
    jest.clearAllMocks();
    client = new RegistryClient(
      mockRegistryUrl,
      mockTenantId,
      mockAuthUrl,
      mockServerUrl,
      mockWebUrl
    );
  });

  describe('constructor', () => {
    it('should create a RegistryApi instance with the correct URL', () => {
      expect(RegistryApi).toHaveBeenCalledWith({
        BASE: mockRegistryUrl,
        VERSION: '1.0.0'
      });
    });
  });

  describe('getEndpoints', () => {
    it('should return cached endpoints if cache is valid', async () => {
      // Set up a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };

      // Mock the getEndpoints method to return the mock response
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryApi as jest.Mock).mockImplementation(() => ({
        endpoints: {
          getEndpoints: mockGetEndpoints
        }
      }));

      // Create a new client with the mocked RegistryApi
      const newClient = new RegistryClient(
        mockRegistryUrl,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Call getEndpoints to populate the cache
      await newClient.getEndpoints();

      // Reset the mock to verify it's not called again
      mockGetEndpoints.mockClear();

      // Call getEndpoints again, it should use the cache
      const result = await newClient.getEndpoints();

      // Verify the mock wasn't called again
      expect(mockGetEndpoints).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should fetch endpoints from registry if cache is invalid', async () => {
      // Set up a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };

      // Mock the getEndpoints method to return the mock response
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryApi as jest.Mock).mockImplementation(() => ({
        endpoints: {
          getEndpoints: mockGetEndpoints
        }
      }));

      // Create a new client with the mocked RegistryApi
      const newClient = new RegistryClient(
        mockRegistryUrl,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Call getEndpoints with forceRefresh=true
      const result = await newClient.getEndpoints(true);

      // Verify the mock was called
      expect(mockGetEndpoints).toHaveBeenCalledWith(mockTenantId);
      expect(result).toEqual(mockResponse);
    });

    it('should fall back to environment variables if registry fetch fails', async () => {
      // Mock the getEndpoints method to throw an error
      const mockGetEndpoints = jest.fn().mockRejectedValue(new Error('Registry fetch failed'));
      (RegistryApi as jest.Mock).mockImplementation(() => ({
        endpoints: {
          getEndpoints: mockGetEndpoints
        }
      }));

      // Create a new client with the mocked RegistryApi
      const newClient = new RegistryClient(
        mockRegistryUrl,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Call getEndpoints
      const result = await newClient.getEndpoints();

      // Verify the mock was called
      expect(mockGetEndpoints).toHaveBeenCalledWith(mockTenantId);
      expect(result).toEqual({
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      });
    });

    it('should throw an error if registry fetch fails and no environment variables are available', async () => {
      // Mock the getEndpoints method to throw an error
      const mockGetEndpoints = jest.fn().mockRejectedValue(new Error('Registry fetch failed'));
      (RegistryApi as jest.Mock).mockImplementation(() => ({
        endpoints: {
          getEndpoints: mockGetEndpoints
        }
      }));

      // Create a new client with the mocked RegistryApi but no environment variables
      const newClient = new RegistryClient(
        mockRegistryUrl,
        mockTenantId
      );

      // Call getEndpoints and expect it to throw
      await expect(newClient.getEndpoints()).rejects.toThrow('Failed to get endpoints from registry and no environment variables are available');
    });
  });

  describe('getAuthUrl', () => {
    it('should return the auth URL from the endpoints', async () => {
      // Set up a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };

      // Mock the getEndpoints method to return the mock response
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryApi as jest.Mock).mockImplementation(() => ({
        endpoints: {
          getEndpoints: mockGetEndpoints
        }
      }));

      // Create a new client with the mocked RegistryApi
      const newClient = new RegistryClient(
        mockRegistryUrl,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Call getAuthUrl
      const result = await newClient.getAuthUrl();

      // Verify the result
      expect(result).toBe(mockAuthUrl);
    });
  });

  describe('getServerUrl', () => {
    it('should return the server URL from the endpoints', async () => {
      // Set up a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };

      // Mock the getEndpoints method to return the mock response
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryApi as jest.Mock).mockImplementation(() => ({
        endpoints: {
          getEndpoints: mockGetEndpoints
        }
      }));

      // Create a new client with the mocked RegistryApi
      const newClient = new RegistryClient(
        mockRegistryUrl,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Call getServerUrl
      const result = await newClient.getServerUrl();

      // Verify the result
      expect(result).toBe(mockServerUrl);
    });
  });

  describe('getWebUrl', () => {
    it('should return the web URL from the endpoints', async () => {
      // Set up a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };

      // Mock the getEndpoints method to return the mock response
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryApi as jest.Mock).mockImplementation(() => ({
        endpoints: {
          getEndpoints: mockGetEndpoints
        }
      }));

      // Create a new client with the mocked RegistryApi
      const newClient = new RegistryClient(
        mockRegistryUrl,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Call getWebUrl
      const result = await newClient.getWebUrl();

      // Verify the result
      expect(result).toBe(mockWebUrl);
    });
  });

  describe('getApiVersion', () => {
    it('should return the API version from the endpoints', async () => {
      // Set up a mock response
      const mockResponse = {
        tenantId: mockTenantId,
        authUrl: mockAuthUrl,
        serverUrl: mockServerUrl,
        webUrl: mockWebUrl,
        apiVersion: 'v1'
      };

      // Mock the getEndpoints method to return the mock response
      const mockGetEndpoints = jest.fn().mockResolvedValue(mockResponse);
      (RegistryApi as jest.Mock).mockImplementation(() => ({
        endpoints: {
          getEndpoints: mockGetEndpoints
        }
      }));

      // Create a new client with the mocked RegistryApi
      const newClient = new RegistryClient(
        mockRegistryUrl,
        mockTenantId,
        mockAuthUrl,
        mockServerUrl,
        mockWebUrl
      );

      // Call getApiVersion
      const result = await newClient.getApiVersion();

      // Verify the result
      expect(result).toBe('v1');
    });
  });
});
