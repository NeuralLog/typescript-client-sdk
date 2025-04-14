import { CryptoService } from '../crypto/CryptoService';
import { AuthService } from '../auth/AuthService';
import { TokenService } from '../auth/TokenService';
import { LogError } from '../errors';

/**
 * Manager for authentication operations
 */
export class AuthManager {
  private cryptoService: CryptoService;
  private authService: AuthService;
  private tokenService: TokenService;
  private tenantId: string;
  
  private apiKey: string | null = null;
  private authenticated: boolean = false;
  private authToken: string | null = null;
  
  /**
   * Create a new AuthManager
   * 
   * @param cryptoService Crypto service
   * @param authService Auth service
   * @param tokenService Token service
   * @param tenantId Tenant ID
   */
  constructor(
    cryptoService: CryptoService,
    authService: AuthService,
    tokenService: TokenService,
    tenantId: string
  ) {
    this.cryptoService = cryptoService;
    this.authService = authService;
    this.tokenService = tokenService;
    this.tenantId = tenantId;
  }
  
  /**
   * Authenticate with an API key
   * 
   * @param apiKey API key
   * @returns Promise that resolves to true if authentication was successful
   */
  public async authenticateWithApiKey(apiKey: string): Promise<boolean> {
    try {
      // Generate zero-knowledge proof for API key
      const proof = await this.cryptoService.generateApiKeyProof(apiKey);
      
      // Validate API key with proof
      const valid = await this.authService.validateApiKey(apiKey, this.tenantId, proof);
      
      if (valid) {
        this.apiKey = apiKey;
        this.authenticated = true;
        return true;
      }
      
      return false;
    } catch (error) {
      throw new LogError(
        `Failed to authenticate with API key: ${error instanceof Error ? error.message : String(error)}`,
        'authentication_failed'
      );
    }
  }
  
  /**
   * Authenticate with a JWT token
   * 
   * @param token JWT token
   * @returns Promise that resolves to true if authentication was successful
   */
  public async authenticateWithToken(token: string): Promise<boolean> {
    try {
      // Validate token
      const valid = await this.tokenService.validateToken(token);
      
      if (valid) {
        this.authToken = token;
        this.authenticated = true;
        return true;
      }
      
      return false;
    } catch (error) {
      throw new LogError(
        `Failed to authenticate with token: ${error instanceof Error ? error.message : String(error)}`,
        'authentication_failed'
      );
    }
  }
  
  /**
   * Check if the client is authenticated
   * 
   * @returns True if authenticated
   */
  public isAuthenticated(): boolean {
    return this.authenticated;
  }
  
  /**
   * Get the API key
   * 
   * @returns The API key
   */
  public getApiKey(): string | null {
    return this.apiKey;
  }
  
  /**
   * Get the auth token
   * 
   * @returns The auth token
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }
  
  /**
   * Get the auth token or API key
   * 
   * @returns The auth token or API key
   */
  public getAuthCredential(): string {
    if (this.authToken) {
      return this.authToken;
    }
    
    if (this.apiKey) {
      return this.apiKey;
    }
    
    throw new LogError('No authentication credential available', 'no_auth_credential');
  }
  
  /**
   * Create an API key
   * 
   * @param name API key name
   * @param permissions API key permissions
   * @param authToken Authentication token
   * @returns Promise that resolves to the API key
   */
  public async createApiKey(
    name: string,
    permissions: string[],
    authToken: string
  ): Promise<string> {
    try {
      return await this.authService.createApiKey(name, permissions, authToken);
    } catch (error) {
      throw new LogError(
        `Failed to create API key: ${error instanceof Error ? error.message : String(error)}`,
        'create_api_key_failed'
      );
    }
  }
  
  /**
   * Get API keys
   * 
   * @param authToken Authentication token
   * @returns Promise that resolves to the API keys
   */
  public async getApiKeys(authToken: string): Promise<any[]> {
    try {
      return await this.authService.getApiKeys(authToken);
    } catch (error) {
      throw new LogError(
        `Failed to get API keys: ${error instanceof Error ? error.message : String(error)}`,
        'get_api_keys_failed'
      );
    }
  }
  
  /**
   * Revoke an API key
   * 
   * @param apiKeyId API key ID
   * @param authToken Authentication token
   * @returns Promise that resolves when the API key is revoked
   */
  public async revokeApiKey(apiKeyId: string, authToken: string): Promise<void> {
    try {
      await this.authService.revokeApiKey(apiKeyId, authToken);
    } catch (error) {
      throw new LogError(
        `Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`,
        'revoke_api_key_failed'
      );
    }
  }
  
  /**
   * Get a resource token
   * 
   * @param resource Resource path
   * @returns Promise that resolves to the resource token
   */
  public async getResourceToken(resource: string): Promise<string> {
    try {
      return await this.authService.getResourceToken(
        this.getAuthCredential(),
        this.tenantId,
        resource
      );
    } catch (error) {
      throw new LogError(
        `Failed to get resource token: ${error instanceof Error ? error.message : String(error)}`,
        'get_resource_token_failed'
      );
    }
  }
}
