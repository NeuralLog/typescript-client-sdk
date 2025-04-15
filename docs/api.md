# API Reference

This document provides detailed information about the API for the NeuralLog TypeScript Client SDK.

## Table of Contents

- [NeuralLogClient](#neurallogclient)
  - [Constructor](#constructor)
  - [Authentication Methods](#authentication-methods)
  - [Key Management Methods](#key-management-methods)
  - [Logging Methods](#logging-methods)
  - [User Management Methods](#user-management-methods)
  - [API Key Management Methods](#api-key-management-methods)
- [CryptoService](#cryptoservice)
  - [Key Hierarchy Methods](#key-hierarchy-methods)
  - [Encryption Methods](#encryption-methods)
  - [Search Methods](#search-methods)
  - [Shamir's Secret Sharing Methods](#shamirs-secret-sharing-methods)
- [Types](#types)
  - [NeuralLogClientConfig](#neurallogclientconfig)
  - [KEKVersion](#kekversion)
  - [EncryptedKEK](#encryptedkek)
  - [SecretShare](#secretshare)

## NeuralLogClient

The `NeuralLogClient` class is the main entry point for interacting with the NeuralLog system. It provides methods for logging, searching, and retrieving logs with zero-knowledge encryption.

### Constructor

```typescript
constructor(config: NeuralLogClientConfig)
```

**Parameters:**

- `config` (NeuralLogClientConfig): Configuration options for the client
  - `tenantId` (string): The tenant ID
  - `registryUrl` (string, optional): The registry URL
  - `apiUrl` (string, optional): The API URL
  - `authUrl` (string, optional): The auth service URL
  - `logsUrl` (string, optional): The logs service URL
  - `apiKey` (string, optional): An API key for authentication

**Example:**

```typescript
const client = new NeuralLogClient({
  tenantId: 'your-tenant-id',
  authUrl: 'https://auth.neurallog.com',
  logsUrl: 'https://logs.neurallog.com'
});
```

### Authentication Methods

#### authenticateWithPassword

```typescript
async authenticateWithPassword(username: string, password: string): Promise<boolean>
```

Authenticates with username and password.

**Parameters:**

- `username` (string): The username
- `password` (string): The password

**Returns:**

- `Promise<boolean>`: True if authentication was successful

**Example:**

```typescript
const authenticated = await client.authenticateWithPassword('username', 'password');
if (authenticated) {
  console.log('Authentication successful');
}
```

#### authenticateWithApiKey

```typescript
async authenticateWithApiKey(apiKey: string): Promise<boolean>
```

Authenticates with an API key.

**Parameters:**

- `apiKey` (string): The API key

**Returns:**

- `Promise<boolean>`: True if authentication was successful

**Example:**

```typescript
const authenticated = await client.authenticateWithApiKey('your-api-key');
if (authenticated) {
  console.log('Authentication successful');
}
```

#### isAuthenticated

```typescript
isAuthenticated(): boolean
```

Checks if the client is authenticated.

**Returns:**

- `boolean`: True if the client is authenticated

**Example:**

```typescript
if (client.isAuthenticated()) {
  console.log('Client is authenticated');
}
```

### Key Management Methods

#### initializeWithRecoveryPhrase

```typescript
async initializeWithRecoveryPhrase(recoveryPhrase: string, versions?: string[]): Promise<boolean>
```

Initializes the key hierarchy with a recovery phrase.

**Parameters:**

- `recoveryPhrase` (string): The recovery phrase
- `versions` (string[], optional): KEK versions to recover

**Returns:**

- `Promise<boolean>`: True if initialization was successful

**Example:**

```typescript
const initialized = await client.initializeWithRecoveryPhrase('your recovery phrase');
if (initialized) {
  console.log('Key hierarchy initialized');
}
```

#### initializeWithMnemonic

```typescript
async initializeWithMnemonic(mnemonicPhrase: string, versions?: string[]): Promise<boolean>
```

Initializes the key hierarchy with a BIP-39 mnemonic phrase.

**Parameters:**

- `mnemonicPhrase` (string): The BIP-39 mnemonic phrase
- `versions` (string[], optional): KEK versions to recover

**Returns:**

- `Promise<boolean>`: True if initialization was successful

**Example:**

```typescript
const initialized = await client.initializeWithMnemonic('abandon ability able about above absent absorb abstract absurd abuse access accident');
if (initialized) {
  console.log('Key hierarchy initialized');
}
```

#### generateMnemonic

```typescript
generateMnemonic(strength: number = 128): string
```

Generates a BIP-39 mnemonic phrase.

**Parameters:**

- `strength` (number, optional): The strength in bits (128 = 12 words, 256 = 24 words)

**Returns:**

- `string`: The generated mnemonic phrase

**Example:**

```typescript
const mnemonic = client.generateMnemonic();
console.log('Generated mnemonic:', mnemonic);
```

#### generateMnemonicQuiz

```typescript
generateMnemonicQuiz(mnemonic: string, numQuestions: number = 3): Array<{ index: number; word: string }>
```

Generates quiz questions from a mnemonic phrase.

**Parameters:**

- `mnemonic` (string): The mnemonic phrase
- `numQuestions` (number, optional): Number of questions to generate

**Returns:**

- `Array<{ index: number; word: string }>`: Array of quiz questions with word index and word

**Example:**

```typescript
const quiz = client.generateMnemonicQuiz(mnemonic);
console.log('Quiz questions:', quiz);
```

#### verifyMnemonicQuiz

```typescript
verifyMnemonicQuiz(mnemonic: string, answers: Array<{ index: number; word: string }>): boolean
```

Verifies mnemonic quiz answers.

**Parameters:**

- `mnemonic` (string): The original mnemonic phrase
- `answers` (Array<{ index: number; word: string }>): Array of answers with index and word

**Returns:**

- `boolean`: True if all answers are correct

**Example:**

```typescript
const answers = [
  { index: 2, word: 'able' },
  { index: 5, word: 'absent' },
  { index: 8, word: 'absurd' }
];
const correct = client.verifyMnemonicQuiz(mnemonic, answers);
console.log('Quiz answers correct:', correct);
```

#### getKEKVersions

```typescript
async getKEKVersions(): Promise<any[]>
```

Gets all KEK versions.

**Returns:**

- `Promise<any[]>`: Array of KEK versions

**Example:**

```typescript
const versions = await client.getKEKVersions();
console.log('KEK versions:', versions);
```

#### createKEKVersion

```typescript
async createKEKVersion(reason: string): Promise<any>
```

Creates a new KEK version.

**Parameters:**

- `reason` (string): Reason for creating the new version

**Returns:**

- `Promise<any>`: The new KEK version

**Example:**

```typescript
const newVersion = await client.createKEKVersion('Quarterly rotation');
console.log('New KEK version:', newVersion);
```

#### rotateKEK

```typescript
async rotateKEK(reason: string, removedUsers: string[] = []): Promise<any>
```

Rotates the KEK, creating a new version and optionally removing users.

**Parameters:**

- `reason` (string): Reason for rotation
- `removedUsers` (string[], optional): Array of user IDs to remove

**Returns:**

- `Promise<any>`: The new KEK version

**Example:**

```typescript
const rotatedVersion = await client.rotateKEK('Security incident', ['user-to-remove']);
console.log('Rotated KEK version:', rotatedVersion);
```

#### provisionKEKForUser

```typescript
async provisionKEKForUser(userId: string, kekVersionId: string): Promise<void>
```

Provisions a KEK for a user.

**Parameters:**

- `userId` (string): User ID
- `kekVersionId` (string): KEK version ID

**Returns:**

- `Promise<void>`

**Example:**

```typescript
await client.provisionKEKForUser('user-id', 'kek-version-id');
console.log('KEK provisioned for user');
```

### Logging Methods

#### log

```typescript
async log(logName: string, data: Record<string, any>, options: { kekVersion?: string } = {}): Promise<string>
```

Logs data to the specified log.

**Parameters:**

- `logName` (string): Log name
- `data` (Record<string, any>): Log data
- `options` (object, optional): Options for logging
  - `kekVersion` (string, optional): KEK version to use for encryption

**Returns:**

- `Promise<string>`: The log ID

**Example:**

```typescript
const logId = await client.log('application-logs', {
  level: 'info',
  message: 'Hello, world!',
  timestamp: new Date().toISOString(),
  metadata: { user: 'user123' }
});
console.log('Log ID:', logId);
```

#### getLogs

```typescript
async getLogs(logName: string, options: { limit?: number } = {}): Promise<Record<string, any>[]>
```

Gets logs for the specified log name.

**Parameters:**

- `logName` (string): Log name
- `options` (object, optional): Options for getting logs
  - `limit` (number, optional): Maximum number of logs to return

**Returns:**

- `Promise<Record<string, any>[]>`: Array of logs

**Example:**

```typescript
const logs = await client.getLogs('application-logs', { limit: 10 });
console.log('Logs:', logs);
```

#### searchLogs

```typescript
async searchLogs(logName: string, options: { query: string; limit?: number }): Promise<Record<string, any>[]>
```

Searches logs for the specified log name.

**Parameters:**

- `logName` (string): Log name
- `options` (object): Options for searching logs
  - `query` (string): Search query
  - `limit` (number, optional): Maximum number of logs to return

**Returns:**

- `Promise<Record<string, any>[]>`: Array of matching logs

**Example:**

```typescript
const logs = await client.searchLogs('application-logs', { query: 'error', limit: 10 });
console.log('Search results:', logs);
```

#### getAllLogs

```typescript
async getAllLogs(options: { limit?: number } = {}): Promise<Record<string, any>[]>
```

Gets all logs.

**Parameters:**

- `options` (object, optional): Options for getting all logs
  - `limit` (number, optional): Maximum number of logs to return

**Returns:**

- `Promise<Record<string, any>[]>`: Array of logs

**Example:**

```typescript
const logs = await client.getAllLogs({ limit: 100 });
console.log('All logs:', logs);
```

### User Management Methods

#### getUsers

```typescript
async getUsers(): Promise<any[]>
```

Gets all users.

**Returns:**

- `Promise<any[]>`: Array of users

**Example:**

```typescript
const users = await client.getUsers();
console.log('Users:', users);
```

#### getPendingAdminPromotions

```typescript
async getPendingAdminPromotions(): Promise<any[]>
```

Gets pending admin promotions.

**Returns:**

- `Promise<any[]>`: Array of pending admin promotions

**Example:**

```typescript
const promotions = await client.getPendingAdminPromotions();
console.log('Pending admin promotions:', promotions);
```

#### approveAdminPromotion

```typescript
async approveAdminPromotion(promotionId: string, userPassword: string): Promise<void>
```

Approves an admin promotion.

**Parameters:**

- `promotionId` (string): Promotion ID
- `userPassword` (string): User password

**Returns:**

- `Promise<void>`

**Example:**

```typescript
await client.approveAdminPromotion('promotion-id', 'user-password');
console.log('Admin promotion approved');
```

#### rejectAdminPromotion

```typescript
async rejectAdminPromotion(promotionId: string): Promise<void>
```

Rejects an admin promotion.

**Parameters:**

- `promotionId` (string): Promotion ID

**Returns:**

- `Promise<void>`

**Example:**

```typescript
await client.rejectAdminPromotion('promotion-id');
console.log('Admin promotion rejected');
```

### API Key Management Methods

#### createApiKey

```typescript
async createApiKey(name: string, permissions: string[]): Promise<string>
```

Creates an API key.

**Parameters:**

- `name` (string): API key name
- `permissions` (string[]): API key permissions

**Returns:**

- `Promise<string>`: The API key

**Example:**

```typescript
const apiKey = await client.createApiKey('My API Key', ['logs:read', 'logs:write']);
console.log('API key:', apiKey);
```

#### getApiKeys

```typescript
async getApiKeys(): Promise<any[]>
```

Gets all API keys.

**Returns:**

- `Promise<any[]>`: Array of API keys

**Example:**

```typescript
const apiKeys = await client.getApiKeys();
console.log('API keys:', apiKeys);
```

#### revokeApiKey

```typescript
async revokeApiKey(apiKeyId: string): Promise<void>
```

Revokes an API key.

**Parameters:**

- `apiKeyId` (string): API key ID

**Returns:**

- `Promise<void>`

**Example:**

```typescript
await client.revokeApiKey('api-key-id');
console.log('API key revoked');
```

## CryptoService

The `CryptoService` class provides cryptographic operations for the NeuralLog client.

### Key Hierarchy Methods

#### deriveMasterSecret

```typescript
async deriveMasterSecret(tenantId: string, recoveryPhrase: string): Promise<Uint8Array>
```

Derives a master secret from tenant ID and recovery phrase.

**Parameters:**

- `tenantId` (string): Tenant ID
- `recoveryPhrase` (string): Recovery phrase

**Returns:**

- `Promise<Uint8Array>`: The master secret

#### deriveMasterSecretFromMnemonic

```typescript
async deriveMasterSecretFromMnemonic(tenantId: string, mnemonicPhrase: string): Promise<Uint8Array>
```

Derives a master secret from tenant ID and mnemonic phrase.

**Parameters:**

- `tenantId` (string): Tenant ID
- `mnemonicPhrase` (string): BIP-39 mnemonic phrase

**Returns:**

- `Promise<Uint8Array>`: The master secret

#### deriveMasterKEK

```typescript
async deriveMasterKEK(masterSecret: Uint8Array): Promise<Uint8Array>
```

Derives the Master KEK from the master secret.

**Parameters:**

- `masterSecret` (Uint8Array): Master secret

**Returns:**

- `Promise<Uint8Array>`: The master KEK

#### deriveOperationalKEK

```typescript
async deriveOperationalKEK(version: string): Promise<Uint8Array>
```

Derives an Operational KEK from the master KEK.

**Parameters:**

- `version` (string): KEK version identifier

**Returns:**

- `Promise<Uint8Array>`: The operational KEK

#### initializeKeyHierarchy

```typescript
async initializeKeyHierarchy(tenantId: string, recoveryPhrase: string, versions?: string[]): Promise<void>
```

Initializes the key hierarchy from a recovery phrase.

**Parameters:**

- `tenantId` (string): Tenant ID
- `recoveryPhrase` (string): Recovery phrase
- `versions` (string[], optional): KEK versions to recover

**Returns:**

- `Promise<void>`

### Encryption Methods

#### encryptLogData

```typescript
async encryptLogData(data: any): Promise<Record<string, any>>
```

Encrypts log data with the current operational KEK.

**Parameters:**

- `data` (any): Log data

**Returns:**

- `Promise<Record<string, any>>`: The encrypted log data with version information

#### decryptLogData

```typescript
async decryptLogData(encryptedData: Record<string, any>): Promise<any>
```

Decrypts log data using the appropriate KEK version.

**Parameters:**

- `encryptedData` (Record<string, any>): Encrypted log data with version information

**Returns:**

- `Promise<any>`: The decrypted log data

#### encryptLogName

```typescript
async encryptLogName(logName: string): Promise<string>
```

Encrypts log name with the current operational KEK.

**Parameters:**

- `logName` (string): Log name

**Returns:**

- `Promise<string>`: The encrypted log name with version information

#### decryptLogName

```typescript
async decryptLogName(encryptedLogName: string): Promise<string>
```

Decrypts log name using the appropriate KEK version.

**Parameters:**

- `encryptedLogName` (string): Encrypted log name with version information

**Returns:**

- `Promise<string>`: The decrypted log name

### Search Methods

#### deriveSearchKey

```typescript
async deriveSearchKey(): Promise<Uint8Array>
```

Derives a search key from the operational KEK.

**Returns:**

- `Promise<Uint8Array>`: The search key

#### generateSearchTokens

```typescript
async generateSearchTokens(query: string, searchKey: Uint8Array): Promise<string[]>
```

Generates search tokens.

**Parameters:**

- `query` (string): Search query
- `searchKey` (Uint8Array): Search key

**Returns:**

- `Promise<string[]>`: The search tokens

### Shamir's Secret Sharing Methods

#### splitKEK

```typescript
async splitKEK(kek: Uint8Array, numShares: number, threshold: number): Promise<SecretShare[]>
```

Splits a KEK into shares using Shamir's Secret Sharing.

**Parameters:**

- `kek` (Uint8Array): The KEK to split
- `numShares` (number): The number of shares to create
- `threshold` (number): The minimum number of shares required to reconstruct the KEK

**Returns:**

- `Promise<SecretShare[]>`: The shares

#### reconstructKEK

```typescript
async reconstructKEK(shares: SecretShare[]): Promise<Uint8Array>
```

Reconstructs a KEK from shares.

**Parameters:**

- `shares` (SecretShare[]): The shares to use for reconstruction

**Returns:**

- `Promise<Uint8Array>`: The reconstructed KEK

## Types

### API Types

The TypeScript Client SDK uses a set of shared types that are automatically generated from the OpenAPI schemas of the log-server and auth service. These types ensure consistency between the server and client implementations.

The generated types are located in `src/types/api.ts` and include:

- **Log**: Represents a log in the system
- **LogEntry**: Represents a single log entry
- **LogSearchOptions**: Options for searching logs
- **PaginatedResult**: Generic paginated result type
- **BatchAppendResult**: Result of a batch append operation
- **User**: User information
- **ApiKey**: API key information
- **KEKVersion**: Key Encryption Key version information
- **KEKBlob**: Encrypted KEK blob
- **EncryptedKEK**: Encrypted KEK data
- **EncryptedLogEntry**: Encrypted log entry data
- **SerializedSecretShare**: Serialized Shamir's Secret Share

These types are automatically generated during the build process of the log-server and auth service, ensuring that they always match the server-side API definitions.

### NeuralLogClientConfig

```typescript
interface NeuralLogClientConfig {
  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * Registry URL (optional - will be constructed from tenantId if not provided)
   */
  registryUrl?: string;

  /**
   * API URL (optional - will be fetched from registry if not provided)
   */
  apiUrl?: string;

  /**
   * Auth service URL (optional - will be fetched from registry if not provided)
   */
  authUrl?: string;

  /**
   * Logs service URL (optional - will be fetched from registry if not provided)
   */
  logsUrl?: string;

  /**
   * API key (optional - for authentication)
   */
  apiKey?: string;
}
```

### KEKVersion

```typescript
interface KEKVersion {
  /**
   * KEK version ID
   */
  id: string;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * User ID of the creator
   */
  createdBy: string;

  /**
   * KEK version status (active, decrypt-only, deprecated)
   */
  status: 'active' | 'decrypt-only' | 'deprecated';

  /**
   * Reason for creating this version
   */
  reason: string;

  /**
   * Tenant ID
   */
  tenantId: string;
}
```

### EncryptedKEK

```typescript
interface EncryptedKEK {
  /**
   * Whether the KEK is encrypted
   */
  encrypted: boolean;

  /**
   * Encryption algorithm
   */
  algorithm: string;

  /**
   * Initialization vector
   */
  iv: string;

  /**
   * Encrypted data
   */
  data: string;

  /**
   * KEK version
   */
  version: string;
}
```

### SecretShare

```typescript
interface SecretShare {
  /**
   * Share index
   */
  index: number;

  /**
   * Share value
   */
  value: Uint8Array;

  /**
   * Share threshold
   */
  threshold: number;

  /**
   * Total number of shares
   */
  totalShares: number;
}
```
