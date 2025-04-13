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
- **Cross-Platform**: Works in browsers, Node.js, and React Native
- **TypeScript Support**: Full TypeScript definitions

## Installation

```bash
npm install @neurallog/client-sdk
```

## Usage

### Basic Usage

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

// Authenticate with master secret
await client.authenticateWithApiKey('your-master-secret');

// Create API key
const apiKey = await client.createApiKey('API Key Name', ['logs:read', 'logs:write']);
console.log('API Key:', apiKey);

// List API keys
const apiKeys = await client.listApiKeys();
console.log('API Keys:', apiKeys);

// Revoke API key
await client.revokeApiKey('api-key-id');
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
API Key
   |
   ├── Log Encryption Key (per log)
   |
   ├── Log Search Key (per log)
   |
   └── Log Name Key
```

## License

MIT
