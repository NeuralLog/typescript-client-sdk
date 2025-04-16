import { AuthenticationService } from '../../../../src/auth/openapi/AuthenticationService';
import { LogError } from '../../../../src/errors';
import axios from 'axios';

jest.mock('axios');

// Create a test class that extends AuthenticationService to expose the protected authApi property
class TestAuthenticationService extends AuthenticationService {
  public get testAuthApi() {
    return this.authApi;
  }

  public set testAuthApi(api: any) {
    (this as any).authApi = api;
  }
}

describe('AuthenticationService', () => {
  let authService: TestAuthenticationService;
  const baseUrl = 'https://auth.test.com';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a new axios instance
    const axiosInstance = axios.create();

    // Create a new authentication service
    authService = new TestAuthenticationService(baseUrl, axiosInstance);

    // Mock the authApi property
    authService.testAuthApi = {
      authCheckPost: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('checkPermission', () => {
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const action = 'read';
    const resource = 'logs/test-log';
    const userId = 'user-id';

    it('should call the auth check endpoint and return true if allowed', async () => {
      // Mock the auth check endpoint
      (authService.testAuthApi.authCheckPost as jest.Mock).mockResolvedValue({
        data: { allowed: true }
      });

      const result = await authService.checkPermission(authToken, action, resource);

      expect(result).toBe(true);
      expect(authService.testAuthApi.authCheckPost).toHaveBeenCalledWith(
        {
          authCheckPostRequest: {
            user: userId,
            relation: action,
            object: resource
          }
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    });

    it('should call the auth check endpoint and return false if not allowed', async () => {
      // Mock the auth check endpoint
      (authService.testAuthApi.authCheckPost as jest.Mock).mockResolvedValue({
        data: { allowed: false }
      });

      const result = await authService.checkPermission(authToken, action, resource);

      expect(result).toBe(false);
      expect(authService.testAuthApi.authCheckPost).toHaveBeenCalledWith(
        {
          authCheckPostRequest: {
            user: userId,
            relation: action,
            object: resource
          }
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    });

    it('should throw a LogError if the token is invalid', async () => {
      const invalidToken = 'invalid-token';

      await expect(authService.checkPermission(invalidToken, action, resource)).rejects.toThrow(
        new LogError('Invalid auth token format', 'invalid_token')
      );

      expect(authService.testAuthApi.authCheckPost).not.toHaveBeenCalled();
    });

    it('should throw a LogError if the user ID is not found in the token', async () => {
      // Token with no sub or user_id
      const tokenWithNoUserId = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjJ9.tbDepxpstvGdW8TC3G8zg4B6rUYAOvfzdceoH48wgRQ';

      await expect(authService.checkPermission(tokenWithNoUserId, action, resource)).rejects.toThrow(
        new LogError('User ID not found in token', 'invalid_token')
      );

      expect(authService.testAuthApi.authCheckPost).not.toHaveBeenCalled();
    });

    it('should throw a LogError if the auth service returns an error', async () => {
      // Mock the auth check endpoint to return an error
      const error = new Error('Request failed with status code 500');
      (authService.testAuthApi.authCheckPost as jest.Mock).mockRejectedValue(error);

      await expect(authService.checkPermission(authToken, action, resource)).rejects.toThrow(
        new LogError('Failed to check permission: Request failed with status code 500', 'check_permission_failed')
      );

      expect(authService.testAuthApi.authCheckPost).toHaveBeenCalledWith(
        {
          authCheckPostRequest: {
            user: userId,
            relation: action,
            object: resource
          }
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    });

    it('should include contextual tuples if provided', async () => {
      // Mock the auth check endpoint
      (authService.testAuthApi.authCheckPost as jest.Mock).mockResolvedValue({
        data: { allowed: true }
      });

      const contextualTuples = [
        { user: 'user:123', relation: 'member', object: 'group:456' }
      ];

      const result = await authService.checkPermission(authToken, action, resource, contextualTuples);

      expect(result).toBe(true);
      expect(authService.testAuthApi.authCheckPost).toHaveBeenCalledWith(
        {
          authCheckPostRequest: {
            user: userId,
            relation: action,
            object: resource,
            contextualTuples
          }
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    });
  });
});
