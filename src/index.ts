// Client
export { NeuralLogClient } from './client/NeuralLogClient';
export { LogClient } from './client/LogClient';
export { AuthClient } from './client/AuthClient';
export { UserClient } from './client/UserClient';
export { KeyManagementClient } from './client/KeyManagementClient';
export { ApiKeyClient } from './client/ApiKeyClient';
export { NeuralLogClientFactory } from './client/NeuralLogClientFactory';
export { NeuralLogClientOptions, LogOptions, GetLogsOptions, SearchOptions } from './client/types';

// Services
export { LogsService } from './logs/LogsService';
export { AuthService } from './auth/AuthService';
export { KekService } from './auth/KekService';
export { TokenService } from './auth/TokenService';

// Crypto
export { CryptoService } from './crypto/CryptoService';
export { KeyHierarchy } from './crypto/KeyHierarchy';

// Types
export * from './types';

// Explicitly export API types
export type {
  ApiKeyChallenge,
  ApiKeyChallengeVerification,
  UserProfile,
  Login,
  PermissionCheck,
  TokenValidationResult,
  TokenExchangeResult,
  ResourceTokenVerificationResult,
  OperationResult
} from './types/api';

// Errors
export * from './errors';

// Version
export const VERSION = '0.1.7';
