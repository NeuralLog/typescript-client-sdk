# NeuralLog TypeScript Client SDK

A zero-knowledge TypeScript client SDK for the NeuralLog system, designed to provide secure, end-to-end encrypted logging capabilities for TypeScript/JavaScript applications.

## Features

- **Zero-Knowledge Architecture**: All encryption/decryption happens client-side
- **Secure Logging**: End-to-end encrypted logs
- **Encrypted Log Names**: Log names are encrypted before being sent to the server
- **API Key Management**: Create and manage API keys
- **Searchable Encryption**: Search encrypted logs without compromising security
- **Auth Service Integration**: Seamless integration with the NeuralLog auth service
- **Resource Token Management**: Secure access to logs using short-lived resource tokens
- **Key Encryption Key (KEK)**: Secure key management with KEKs
- **Password Change Support**: Seamless password changes with KEK re-encryption
- **Hierarchical Key Derivation**: Secure key hierarchy for all cryptographic operations
- **Zero-Knowledge Proofs**: Prove knowledge of API keys without revealing them
- **Cross-Platform**: Works in browsers, Node.js, and React Native
- **TypeScript Support**: Full TypeScript definitions

## Installation

```bash
npm install @neurallog/client-sdk
```

## Usage

### User Authentication

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create client
const client = new NeuralLogClient({
  tenantId: 'your-tenant-id',
  authUrl: 'https://auth.neurallog.com',
  logsUrl: 'https://logs.neurallog.com'
});

// Authenticate with username and password
await client.authenticateWithPassword('username', 'password');

// Change password
await client.changePassword('old-password', 'new-password');

// Logout
await client.logout();
```

### API Key Authentication

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create client
const client = new NeuralLogClient({
  tenantId: 'your-tenant-id',
  authUrl: 'https://auth.neurallog.com',
  logsUrl: 'https://logs.neurallog.com'
});

// Authenticate with API key
await client.authenticateWithApiKey('your-api-key');
```

### Logging

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create client
const client = new NeuralLogClient({
  tenantId: 'your-tenant-id',
  authUrl: 'https://auth.neurallog.com',
  logsUrl: 'https://logs.neurallog.com'
});

// Authenticate with API key
await client.authenticateWithApiKey('your-api-key');

// Log data
await client.log('application-logs', {
  level: 'info',
  message: 'Hello, NeuralLog!',
  timestamp: new Date().toISOString(),
  user: 'john.doe',
  action: 'login'
});

// Get logs
const logs = await client.getLogs('application-logs', { limit: 10 });
console.log('Recent logs:', logs);

// Search logs
const searchResults = await client.searchLogs('application-logs', {
  query: 'login',
  limit: 10
});
console.log('Search results:', searchResults);
```

### API Key Management

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create client
const client = new NeuralLogClient({
  tenantId: 'your-tenant-id',
  authUrl: 'https://auth.neurallog.com'
});

// Authenticate with username and password
await client.authenticateWithPassword('username', 'password');

// Create API key
const apiKey = await client.createApiKey('API Key Name', [
  'logs:read',
  'logs:write'
]);
console.log('API Key:', apiKey);

// List API keys
const apiKeys = await client.listApiKeys();
console.log('API Keys:', apiKeys);

// Revoke API key
await client.revokeApiKey('api-key-id');
```

### Resource Tokens

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create client
const client = new NeuralLogClient({
  tenantId: 'your-tenant-id',
  authUrl: 'https://auth.neurallog.com'
});

// Authenticate with API key
await client.authenticateWithApiKey('your-api-key');

// Get a resource token
const resourceToken = await client.getResourceToken('logs/application-logs');

// Use the resource token to access the resource
// This is handled automatically by the client, but you can also use it directly
console.log('Resource Token:', resourceToken);
```

## Security

The NeuralLog Client SDK is designed with security in mind:

- All encryption/decryption happens client-side
- The server never sees plaintext data or log names
- API keys are used to derive encryption keys
- Searchable encryption allows searching without compromising security

### Key Hierarchy

The SDK uses a hierarchical key derivation system:

```
Master Secret (derived from username:password)
   |
   └── Key Encryption Key (KEK) (encrypted with Master Secret)
       |
       └── API Key (derived from KEK + Tenant ID + Key ID)
           |
           ├── Log Encryption Key (per log)
           |
           ├── Log Search Key (per log)
           |
           └── Log Name Key
```

### Password Changes

When a user changes their password, the following happens:

1. The client retrieves the encrypted KEK
2. The client decrypts the KEK using the old password
3. The client re-encrypts the KEK using the new password
4. The client updates the encrypted KEK on the server

This ensures that all derived keys remain the same, even after a password change.

### Zero-Knowledge Proofs

When authenticating with an API key, the client generates a zero-knowledge proof that demonstrates knowledge of the API key without revealing it. This proof is used to obtain resource tokens from the auth service.

## License

MIT
