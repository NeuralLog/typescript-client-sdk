import { CryptoService } from '../crypto/CryptoService';
import { AuthService } from '../auth/AuthService';
import { LogError } from '../errors';
import { User, AdminPromotionRequest } from '../types';

/**
 * Manager for user operations
 */
export class UserManager {
  private cryptoService: CryptoService;
  private authService: AuthService;
  private userId: string | null = null;
  
  /**
   * Create a new UserManager
   * 
   * @param cryptoService Crypto service
   * @param authService Auth service
   */
  constructor(cryptoService: CryptoService, authService: AuthService) {
    this.cryptoService = cryptoService;
    this.authService = authService;
  }
  
  /**
   * Set the current user ID
   * 
   * @param userId User ID
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }
  
  /**
   * Get the current user ID
   * 
   * @returns The current user ID
   */
  public getCurrentUserId(): string {
    if (!this.userId) {
      throw new LogError('User ID not set', 'user_id_not_set');
    }
    
    return this.userId;
  }
  
  /**
   * Get a user key pair
   * 
   * @param userPassword User password
   * @returns Promise that resolves to the user key pair
   */
  public async getUserKeyPair(userPassword: string): Promise<CryptoKeyPair> {
    try {
      // Get the current user ID
      const userId = this.getCurrentUserId();
      
      // Derive the user-specific key pair
      return await this.cryptoService.deriveKeyPair(
        this.cryptoService.getCurrentOperationalKEK(),
        userId,
        userPassword
      );
    } catch (error) {
      throw new LogError(
        `Failed to get user key pair: ${error instanceof Error ? error.message : String(error)}`,
        'get_user_key_pair_failed'
      );
    }
  }
  
  /**
   * Upload a user's public key
   * 
   * @param userPassword User password
   * @param authToken Authentication token
   * @returns Promise that resolves when the public key is uploaded
   */
  public async uploadUserPublicKey(userPassword: string, authToken: string): Promise<void> {
    try {
      // Get the user key pair
      const keyPair = await this.getUserKeyPair(userPassword);
      
      // Export the public key
      const publicKeyData = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      
      // Convert to Base64
      const publicKeyBase64 = this.cryptoService.arrayBufferToBase64(publicKeyData);
      
      // Upload the public key
      await this.authService.uploadPublicKey(publicKeyBase64, authToken);
    } catch (error) {
      throw new LogError(
        `Failed to upload user public key: ${error instanceof Error ? error.message : String(error)}`,
        'upload_public_key_failed'
      );
    }
  }
  
  /**
   * Get a user's public key
   * 
   * @param userId User ID
   * @param authToken Authentication token
   * @returns Promise that resolves to the user's public key
   */
  public async getUserPublicKey(userId: string, authToken: string): Promise<CryptoKey> {
    try {
      // Get the public key from the server
      const publicKeyResponse = await this.authService.getPublicKey(userId, authToken);
      
      // Convert from Base64
      const publicKeyData = this.cryptoService.base64ToArrayBuffer(publicKeyResponse.publicKey);
      
      // Import the public key
      return await crypto.subtle.importKey(
        'spki',
        publicKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      throw new LogError(
        `Failed to get user public key: ${error instanceof Error ? error.message : String(error)}`,
        'get_public_key_failed'
      );
    }
  }
  
  /**
   * Get all users
   * 
   * @param authToken Authentication token
   * @returns Promise that resolves to the users
   */
  public async getUsers(authToken: string): Promise<User[]> {
    try {
      return await this.authService.getUsers(authToken);
    } catch (error) {
      throw new LogError(
        `Failed to get users: ${error instanceof Error ? error.message : String(error)}`,
        'get_users_failed'
      );
    }
  }
  
  /**
   * Get pending admin promotions
   * 
   * @param authToken Authentication token
   * @returns Promise that resolves to the pending admin promotions
   */
  public async getPendingAdminPromotions(authToken: string): Promise<AdminPromotionRequest[]> {
    try {
      return await this.authService.getPendingAdminPromotions(authToken);
    } catch (error) {
      throw new LogError(
        `Failed to get pending admin promotions: ${error instanceof Error ? error.message : String(error)}`,
        'get_pending_admin_promotions_failed'
      );
    }
  }
  
  /**
   * Approve an admin promotion
   * 
   * @param promotionId Promotion ID
   * @param userPassword User password
   * @param authToken Authentication token
   * @returns Promise that resolves when the promotion is approved
   */
  public async approveAdminPromotion(
    promotionId: string,
    userPassword: string,
    authToken: string
  ): Promise<void> {
    try {
      // Get the user key pair
      const keyPair = await this.getUserKeyPair(userPassword);
      
      // Get the promotion
      const promotion = await this.authService.getAdminPromotion(promotionId, authToken);
      
      // Get the encrypted share for this user
      const encryptedShare = promotion.encryptedShares[this.getCurrentUserId()];
      
      if (!encryptedShare) {
        throw new Error('No encrypted share found for this user');
      }
      
      // Decrypt the share
      const shareString = await this.cryptoService.decryptWithPrivateKey(
        keyPair.privateKey,
        encryptedShare
      );
      
      // Parse the share
      const share = JSON.parse(shareString);
      
      // Approve the promotion
      await this.authService.approveAdminPromotion(promotionId, share, authToken);
    } catch (error) {
      throw new LogError(
        `Failed to approve admin promotion: ${error instanceof Error ? error.message : String(error)}`,
        'approve_admin_promotion_failed'
      );
    }
  }
  
  /**
   * Reject an admin promotion
   * 
   * @param promotionId Promotion ID
   * @param authToken Authentication token
   * @returns Promise that resolves when the promotion is rejected
   */
  public async rejectAdminPromotion(promotionId: string, authToken: string): Promise<void> {
    try {
      await this.authService.rejectAdminPromotion(promotionId, authToken);
    } catch (error) {
      throw new LogError(
        `Failed to reject admin promotion: ${error instanceof Error ? error.message : String(error)}`,
        'reject_admin_promotion_failed'
      );
    }
  }
}
