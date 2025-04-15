import { AuthManager } from '../../auth/AuthManager';
import { LogError } from '../../errors';

/**
 * Service that provides authentication-related functionality
 */
export class AuthProvider {
  /**
   * Create a new AuthProvider
   *
   * @param authManager Authentication manager
   */
  constructor(private authManager: AuthManager) {}

  /**
   * Get the authentication token
   *
   * @returns Authentication token or null if not authenticated
   */
  getAuthToken(): string | null {
    return this.authManager.getAuthToken();
  }

  /**
   * Check if the user is authenticated
   *
   * @returns True if authenticated
   */
  isAuthenticated(): boolean {
    return this.authManager.isLoggedIn();
  }

  /**
   * Get the current user ID
   *
   * @returns Current user ID or null if not authenticated
   */
  getCurrentUserId(): string | null {
    const user = this.authManager.getCurrentUser();
    return user ? user.id : null;
  }

  /**
   * Check if the user is authenticated and throw an error if not
   *
   * @throws Error if not authenticated
   */
  checkAuthentication(): void {
    if (!this.isAuthenticated()) {
      throw new LogError('Not authenticated', 'not_authenticated');
    }
  }

  /**
   * Get the authentication manager
   *
   * @returns Authentication manager
   */
  getAuthManager(): AuthManager {
    return this.authManager;
  }
}
