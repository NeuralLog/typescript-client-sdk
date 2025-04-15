import { AuthProvider } from '../../../../src/client/services/AuthProvider';
import { AuthManager } from '../../../../src/auth/AuthManager';
import { LogError } from '../../../../src/errors';

// Mock LogError
jest.mock('../../../../src/errors', () => ({
  LogError: jest.fn().mockImplementation((message, code) => {
    const error = new Error(message);
    error.name = 'LogError';
    return error;
  })
}));

// Mock dependencies
jest.mock('../../../../src/auth/AuthManager');

describe('AuthProvider', () => {
  let authProvider: AuthProvider;
  let mockAuthManager: jest.Mocked<AuthManager>;

  beforeEach(() => {
    mockAuthManager = {
      isLoggedIn: jest.fn(),
      getAuthToken: jest.fn(),
    } as unknown as jest.Mocked<AuthManager>;

    authProvider = new AuthProvider(mockAuthManager);
  });

  describe('isAuthenticated', () => {
    it('should delegate to the auth manager', () => {
      mockAuthManager.isLoggedIn.mockReturnValue(true);

      const result = authProvider.isAuthenticated();

      expect(mockAuthManager.isLoggedIn).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('getAuthToken', () => {
    it('should delegate to the auth manager', () => {
      mockAuthManager.getAuthToken.mockReturnValue('test-token');

      const result = authProvider.getAuthToken();

      expect(mockAuthManager.getAuthToken).toHaveBeenCalled();
      expect(result).toBe('test-token');
    });
  });

  describe('checkAuthentication', () => {
    it('should not throw an error if authenticated', () => {
      mockAuthManager.isLoggedIn.mockReturnValue(true);

      expect(() => authProvider.checkAuthentication()).not.toThrow();
    });

    it('should throw an error if not authenticated', () => {
      mockAuthManager.isLoggedIn.mockReturnValue(false);

      expect(() => authProvider.checkAuthentication()).toThrow('Not authenticated');
    });
  });
});
