/**
 * API Types
 *
 * This file exports types from both the log-server and auth service
 */

// Export client types
export * from './client';

// Export KEK types (these take precedence over generated types)
export * from './kek';

// Export log-server types, excluding those that conflict with kek.ts
import * as LogTypes from './log';

export type {
  Log,
  LogUpdate,
  LogEntry,
  LogSearchOptions,
  Error,
  PaginatedResult,
  BatchAppendResult,
  GetLogsData,
  CreateLogData,
  GetLogData,
  UpdateLogData,
  DeleteLogData,
  GetLogEntriesData,
  SearchLogEntriesData,
  PaginatedLogEntries,
  GetLogEntriesParams,
  AppendLogEntryData,
  BatchAppendLogEntriesPayload,
  BatchAppendLogEntriesData,
  EncryptedLogEntry
} from './log';

// Export auth service types with type conflicts resolved
import * as AuthTypes from './auth';

// Re-export auth types, excluding those that conflict with kek.ts
export type {
  AdminShare,
  AdminShares,
  AdminShareRequest,
  AdminPromotionRequest,
  PublicKey,
  SerializedSecretShare,
  ApiKey,
  ApiKeyChallenge,
  ApiKeyChallengeVerification,
  ApiKeyInfo,
  ApiKeyPermission,
  CreateApiKeyRequest,
  KeysList,
  Login,
  PermissionCheck,
  TokenValidationResult,
  TokenExchangeResult,
  ResourceTokenVerificationResult,
  KEKBlob,
  KEKBlobs,
  KEKVersions,
  Tenant,
  Role,
  User,
  UserProfile,
  KekRecoverySession,
  KekRecoveryResult,
  VerifyPublicKeyResponse
} from './auth';
