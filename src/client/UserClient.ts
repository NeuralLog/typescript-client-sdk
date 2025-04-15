import { BaseClient } from './BaseClient';
import { UserManager } from '../managers/UserManager';
import { AuthProvider } from './services/AuthProvider';
import { ConfigurationService } from './services/ConfigurationService';
import { LogError } from '../errors';
import { User, AdminPromotionRequest } from '../types';
import { LogErrorCode } from '../errors/LogErrorCode';

/**
 * Client for user operations
 */
export class UserClient extends BaseClient {
  /**
   * Create a new UserClient
   *
   * @param userManager User manager
   * @param configService Configuration service
   * @param authProvider Authentication provider
   */
  constructor(
    private userManager: UserManager,
    configService: ConfigurationService,
    authProvider: AuthProvider
  ) {
    super(configService, authProvider);
  }

  // Using handleError from BaseClient

  /**
   * Get all users
   *
   * @returns Promise that resolves to the users
   */
  public async getUsers(): Promise<User[]> {
    this.checkAuthentication();
    await this.checkInitialization();

    try {
      return await this.userManager.getUsers();
    } catch (error) {
      this.handleError(error, 'get users', 'get_users_failed');
    }
  }

  /**
   * Get pending admin promotions
   *
   * @returns Promise that resolves to the pending admin promotions
   */
  public async getPendingAdminPromotions(): Promise<AdminPromotionRequest[]> {
    this.checkAuthentication();
    await this.checkInitialization();

    try {
      return await this.userManager.getPendingAdminPromotions();
    } catch (error) {
      this.handleError(error, 'get pending admin promotions', 'get_pending_admin_promotions_failed');
    }
  }

  /**
   * Approve an admin promotion
   *
   * @param promotionId Promotion ID
   * @param userPassword User password
   * @returns Promise that resolves when the promotion is approved
   */
  public async approveAdminPromotion(
    promotionId: string,
    userPassword: string
  ): Promise<void> {
    this.checkAuthentication();
    await this.checkInitialization();

    try {
      await this.userManager.approveAdminPromotion(promotionId, userPassword);
    } catch (error) {
      this.handleError(error, 'approve admin promotion', 'approve_admin_promotion_failed');
    }
  }

  /**
   * Reject an admin promotion
   *
   * @param promotionId Promotion ID
   * @returns Promise that resolves when the promotion is rejected
   */
  public async rejectAdminPromotion(promotionId: string): Promise<void> {
    this.checkAuthentication();
    await this.checkInitialization();

    try {
      await this.userManager.rejectAdminPromotion(promotionId);
    } catch (error) {
      this.handleError(error, 'reject admin promotion', 'reject_admin_promotion_failed');
    }
  }

  /**
   * Upload a user's public key
   *
   * @param userPassword User password
   * @returns Promise that resolves when the public key is uploaded
   */
  public async uploadUserPublicKey(userPassword: string): Promise<void> {
    this.checkAuthentication();
    await this.checkInitialization();

    try {
      await this.userManager.uploadUserPublicKey(userPassword);
    } catch (error) {
      this.handleError(error, 'upload user public key', 'upload_user_public_key_failed');
    }
  }

  /**
   * Get a user's public key
   *
   * @param userId User ID
   * @returns Promise that resolves to the user's public key
   */
  public async getUserPublicKey(userId: string): Promise<CryptoKey> {
    this.checkAuthentication();
    await this.checkInitialization();

    try {
      return await this.userManager.getUserPublicKey(userId);
    } catch (error) {
      this.handleError(error, 'get user public key', 'get_user_public_key_failed');
    }
  }
}
