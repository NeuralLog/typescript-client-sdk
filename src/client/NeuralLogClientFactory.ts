import axios, { AxiosInstance } from 'axios';
import { NeuralLogClient } from './NeuralLogClient';
import { LogClient } from './LogClient';
import { AuthClient } from './AuthClient';
import { UserClient } from './UserClient';
import { KeyManagementClient } from './KeyManagementClient';
import { ApiKeyClient } from './ApiKeyClient';
import { NeuralLogClientOptions } from './types';
import { ConfigurationService } from './services/ConfigurationService';
import { AuthProvider } from './services/AuthProvider';
import { AuthManager } from '../auth/AuthManager';
import { AuthService } from '../auth/AuthService';
import { LogsService } from '../logs/LogsService';
import { CryptoService } from '../crypto/CryptoService';
import { KekService } from '../auth/KekService';
import { TokenService } from '../auth/TokenService';
import { KeyHierarchyManager } from '../managers/KeyHierarchyManager';
import { LogManager } from '../managers/LogManager';
import { UserManager } from '../managers/UserManager';
import { LoggerService } from '../utils/LoggerService';

/**
 * Factory for creating NeuralLog clients
 */
export class NeuralLogClientFactory {
  private static logger = LoggerService.getInstance(process.env.NODE_ENV === 'test');
  /**
   * Create a new NeuralLogClient
   *
   * @param options Client options
   * @returns NeuralLogClient
   */
  public static createClient(options: NeuralLogClientOptions): NeuralLogClient {
    return new NeuralLogClient(options);
  }

  /**
   * Create a new LogClient
   *
   * @param options Client options
   * @returns LogClient
   */
  public static createLogClient(options: NeuralLogClientOptions): LogClient {
    const configService = new ConfigurationService(options);
    const tenantId = configService.getTenantId();

    // Create API client
    const apiClient = axios.create({
      baseURL: configService.getServerUrl() || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Create services
    const cryptoService = new CryptoService();
    const logsService = new LogsService(
      configService.getServerUrl() || 'http://localhost:3030',
      apiClient
    );
    const authService = new AuthService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );
    const kekService = new KekService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );

    // Create managers
    const keyHierarchyManager = new KeyHierarchyManager(cryptoService, kekService);
    const authManager = new AuthManager(authService, cryptoService, keyHierarchyManager);
    const logManager = new LogManager(cryptoService, logsService, authService, authManager, tenantId);

    // Create auth provider
    const authProvider = new AuthProvider(authManager);

    // Create log client
    const logClient = new LogClient(logManager, configService, authProvider);

    // Initialize with API key if provided
    const apiKey = configService.getApiKey();
    if (apiKey) {
      authManager.loginWithApiKey(apiKey).catch(error => {
        this.logger.error('Failed to authenticate with API key:', error);
      });
    }

    return logClient;
  }

  /**
   * Create a new AuthClient
   *
   * @param options Client options
   * @returns AuthClient
   */
  public static createAuthClient(options: NeuralLogClientOptions): AuthClient {
    const configService = new ConfigurationService(options);

    // Create API client
    const apiClient = axios.create({
      baseURL: configService.getServerUrl() || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Create services
    const cryptoService = new CryptoService();
    const authService = new AuthService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );
    const tokenService = new TokenService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );
    const kekService = new KekService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );

    // Create managers
    const keyHierarchyManager = new KeyHierarchyManager(cryptoService, kekService);
    const authManager = new AuthManager(authService, cryptoService, keyHierarchyManager);

    // Create auth provider
    const authProvider = new AuthProvider(authManager);

    // Create auth client
    const authClient = new AuthClient(authManager, tokenService, configService, authProvider);

    // Initialize with API key if provided
    const apiKey = configService.getApiKey();
    if (apiKey) {
      authManager.loginWithApiKey(apiKey).catch(error => {
        this.logger.error('Failed to authenticate with API key:', error);
      });
    }

    return authClient;
  }

  /**
   * Create a new UserClient
   *
   * @param options Client options
   * @returns UserClient
   */
  public static createUserClient(options: NeuralLogClientOptions): UserClient {
    const configService = new ConfigurationService(options);

    // Create API client
    const apiClient = axios.create({
      baseURL: configService.getServerUrl() || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Create services
    const cryptoService = new CryptoService();
    const authService = new AuthService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );
    const kekService = new KekService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );

    // Create managers
    const keyHierarchyManager = new KeyHierarchyManager(cryptoService, kekService);
    const authManager = new AuthManager(authService, cryptoService, keyHierarchyManager);
    const userManager = new UserManager(cryptoService, authService, authManager);

    // Create auth provider
    const authProvider = new AuthProvider(authManager);

    // Create user client
    const userClient = new UserClient(userManager, configService, authProvider);

    // Initialize with API key if provided
    const apiKey = configService.getApiKey();
    if (apiKey) {
      authManager.loginWithApiKey(apiKey).catch(error => {
        this.logger.error('Failed to authenticate with API key:', error);
      });
    }

    return userClient;
  }

  /**
   * Create a new KeyManagementClient
   *
   * @param options Client options
   * @returns KeyManagementClient
   */
  public static createKeyManagementClient(options: NeuralLogClientOptions): KeyManagementClient {
    const configService = new ConfigurationService(options);

    // Create API client
    const apiClient = axios.create({
      baseURL: configService.getServerUrl() || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Create services
    const cryptoService = new CryptoService();
    const authService = new AuthService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );
    const kekService = new KekService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );

    // Create managers
    const keyHierarchyManager = new KeyHierarchyManager(cryptoService, kekService);
    const authManager = new AuthManager(authService, cryptoService, keyHierarchyManager);

    // Create auth provider
    const authProvider = new AuthProvider(authManager);

    // Create key management client
    const keyManagementClient = new KeyManagementClient(keyHierarchyManager, configService, authProvider);

    // Initialize with API key if provided
    const apiKey = configService.getApiKey();
    if (apiKey) {
      authManager.loginWithApiKey(apiKey).catch(error => {
        this.logger.error('Failed to authenticate with API key:', error);
      });
    }

    return keyManagementClient;
  }

  /**
   * Create a new ApiKeyClient
   *
   * @param options Client options
   * @returns ApiKeyClient
   */
  public static createApiKeyClient(options: NeuralLogClientOptions): ApiKeyClient {
    const configService = new ConfigurationService(options);

    // Create API client
    const apiClient = axios.create({
      baseURL: configService.getServerUrl() || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Create services
    const cryptoService = new CryptoService();
    const authService = new AuthService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );
    const kekService = new KekService(
      configService.getAuthUrl() || 'http://localhost:3000',
      apiClient
    );

    // Create managers
    const keyHierarchyManager = new KeyHierarchyManager(cryptoService, kekService);
    const authManager = new AuthManager(authService, cryptoService, keyHierarchyManager);

    // Create auth provider
    const authProvider = new AuthProvider(authManager);

    // Create API key client
    const apiKeyClient = new ApiKeyClient(authManager, configService, authProvider);

    // Initialize with API key if provided
    const apiKey = configService.getApiKey();
    if (apiKey) {
      authManager.loginWithApiKey(apiKey).catch(error => {
        this.logger.error('Failed to authenticate with API key:', error);
      });
    }

    return apiKeyClient;
  }
}
