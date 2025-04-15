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
- **Modular Architecture**: Specialized client classes for different domains

## Installation

```bash
npm install @neurallog/client-sdk
```

## Architecture

The SDK is designed using a facade pattern, where the main `NeuralLogClient` class delegates to specialized client classes:

- `LogClient`: For log operations (logging, retrieving, searching)
- `AuthClient`: For authentication operations (login, logout, permissions)
- `UserClient`: For user operations (managing users, admin promotions)
- `KeyManagementClient`: For key management operations (KEK versions, rotation)
- `ApiKeyClient`: For API key operations (creating, revoking)

This architecture provides several benefits:

1. **Improved Maintainability**: Each client class has a clear, focused responsibility
2. **Better Testability**: Smaller classes are easier to test in isolation
3. **Enhanced Flexibility**: Users can use just the clients they need
4. **Backward Compatibility**: The facade pattern ensures existing code continues to work

## Usage

### Using the Full Client

The main `NeuralLogClient` class provides a facade for all functionality:

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create a new client
const client = new NeuralLogClient({
  tenantId: 'my-tenant',
  serverUrl: 'https://api.neurallog.app',
  authUrl: 'https://auth.neurallog.app',
  apiKey: 'my-api-key'
});

// Initialize the client
await client.initialize();

// Log data
const logId = await client.log('app-logs', { message: 'Hello, world!' });

// Get logs
const logs = await client.getLogs('app-logs', { limit: 10 });

// Search logs
const searchResults = await client.searchLogs('app-logs', { query: 'error', limit: 10 });
```

### Using Specialized Clients Directly

You can also use the specialized clients directly:

```typescript
import { NeuralLogClientFactory } from '@neurallog/client-sdk';

// Create a log client
const logClient = NeuralLogClientFactory.createLogClient({
  tenantId: 'my-tenant',
  serverUrl: 'https://api.neurallog.app',
  authUrl: 'https://auth.neurallog.app',
  apiKey: 'my-api-key'
});

// Initialize the client
await logClient.initialize();

// Log data
const logId = await logClient.log('app-logs', { message: 'Hello, world!' });
```

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

### KEK Management

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create client
const client = new NeuralLogClient({
  tenantId: 'your-tenant-id',
  authUrl: 'https://auth.neurallog.com'
});

// Authenticate with username and password
await client.authenticateWithPassword('username', 'password');

// Initialize with recovery phrase
await client.initializeWithRecoveryPhrase('your recovery phrase');

// Get KEK versions
const versions = await client.getKEKVersions();
console.log('KEK Versions:', versions);

// Create a new KEK version
const newVersion = await client.createKEKVersion('Quarterly rotation');
console.log('New KEK Version:', newVersion);

// Rotate KEK
const rotatedVersion = await client.rotateKEK('Security incident', ['user-to-remove']);
console.log('Rotated KEK Version:', rotatedVersion);

// Provision KEK for a user
await client.provisionKEKForUser('user-id', 'kek-version-id');
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
Master Secret (derived from tenant ID + recovery phrase or mnemonic)
   |
   └── Master KEK (derived from Master Secret)
       |
       └── Operational KEKs (versioned, derived from Master KEK)
           |
           ├── Log Encryption Key (per log)
           |
           ├── Log Search Key (per log)
           |
           └── Log Name Key
```

### KEK Versioning

The SDK supports KEK versioning for key rotation and access control:

- **Active**: The current version used for encryption and decryption
- **Decrypt-Only**: A previous version that can be used for decryption but not for encryption
- **Deprecated**: A version that is no longer used and should be phased out

When a log is encrypted, the KEK version used is stored with the encrypted data. When decrypting, the SDK uses the appropriate KEK version.

### Password Changes

When a user changes their password, the following happens:

1. The client retrieves the encrypted KEK blobs for all KEK versions accessible to the user
2. The client decrypts the KEK blobs using the old password
3. The client re-encrypts the KEK blobs using the new password
4. The client updates the encrypted KEK blobs on the server

This ensures that all derived keys remain the same, even after a password change.

### Key Rotation

When a KEK is rotated:

1. A new KEK version is created with status "active"
2. All existing active KEK versions are changed to "decrypt-only"
3. The new KEK version is provisioned to all authorized users
4. New logs are encrypted with the new KEK version
5. Old logs can still be decrypted using the appropriate KEK version

### Zero-Knowledge Proofs

When authenticating with an API key, the client generates a zero-knowledge proof that demonstrates knowledge of the API key without revealing it. This proof is used to obtain resource tokens from the auth service.

## Documentation

Detailed documentation is available in the [docs](./docs) directory:

- [API Reference](./docs/api.md)
- [Configuration](./docs/configuration.md)
- [Architecture](./docs/architecture.md)
- [Examples](./docs/examples)

For integration guides and tutorials, visit the [NeuralLog Documentation Site](https://neurallog.github.io/docs/).

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

MIT

## Related NeuralLog Components

- [NeuralLog Auth](https://github.com/NeuralLog/auth) - Authentication and authorization
- [NeuralLog Server](https://github.com/NeuralLog/server) - Core server functionality
- [NeuralLog Web](https://github.com/NeuralLog/web) - Web interface components
