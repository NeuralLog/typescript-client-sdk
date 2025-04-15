# Client Architecture Examples

This document provides examples of how to use the NeuralLog TypeScript Client SDK with the new client architecture.

## Using the Full Client

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

## Using Specialized Clients Directly

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

// Create an auth client
const authClient = NeuralLogClientFactory.createAuthClient({
  tenantId: 'my-tenant',
  serverUrl: 'https://api.neurallog.app',
  authUrl: 'https://auth.neurallog.app'
});

// Initialize the client
await authClient.initialize();

// Login
const authResponse = await authClient.login('username', 'password');
```

## Using the Full Client but Accessing Specialized Clients

You can also use the full client but access the specialized clients:

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

// Get the log client
const logClient = client.getLogClient();

// Log data using the log client
const logId = await logClient.log('app-logs', { message: 'Hello, world!' });

// Get the user client
const userClient = client.getUserClient();

// Get users using the user client
const users = await userClient.getUsers();
```

## Specialized Client Examples

### LogClient

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

// Get logs
const logs = await logClient.getLogs('app-logs', { limit: 10 });

// Search logs
const searchResults = await logClient.searchLogs('app-logs', { query: 'error', limit: 10 });


```

### AuthClient

```typescript
import { NeuralLogClientFactory } from '@neurallog/client-sdk';

// Create an auth client
const authClient = NeuralLogClientFactory.createAuthClient({
  tenantId: 'my-tenant',
  serverUrl: 'https://api.neurallog.app',
  authUrl: 'https://auth.neurallog.app'
});

// Initialize the client
await authClient.initialize();

// Login with username and password
const authResponse = await authClient.login('username', 'password');

// Login with API key
const apiKeyAuthResponse = await authClient.loginWithApiKey('my-api-key');

// Logout
await authClient.logout();

// Check if authenticated
const isAuthenticated = authClient.isAuthenticated();

// Get auth token
const authToken = authClient.getAuthToken();

// Check permission
const hasPermission = await authClient.checkPermission('read', 'logs/app-logs');
```

### UserClient

```typescript
import { NeuralLogClientFactory } from '@neurallog/client-sdk';

// Create a user client
const userClient = NeuralLogClientFactory.createUserClient({
  tenantId: 'my-tenant',
  serverUrl: 'https://api.neurallog.app',
  authUrl: 'https://auth.neurallog.app',
  apiKey: 'my-api-key'
});

// Initialize the client
await userClient.initialize();

// Get users
const users = await userClient.getUsers();

// Get pending admin promotions
const pendingPromotions = await userClient.getPendingAdminPromotions();

// Approve admin promotion
await userClient.approveAdminPromotion('promotion-id', 'user-password');

// Reject admin promotion
await userClient.rejectAdminPromotion('promotion-id');

// Upload user public key
await userClient.uploadUserPublicKey('user-password');
```

### KeyManagementClient

```typescript
import { NeuralLogClientFactory } from '@neurallog/client-sdk';

// Create a key management client
const keyManagementClient = NeuralLogClientFactory.createKeyManagementClient({
  tenantId: 'my-tenant',
  serverUrl: 'https://api.neurallog.app',
  authUrl: 'https://auth.neurallog.app',
  apiKey: 'my-api-key'
});

// Initialize the client
await keyManagementClient.initialize();

// Get KEK versions
const kekVersions = await keyManagementClient.getKEKVersions();

// Create a new KEK version
const newKekVersion = await keyManagementClient.createKEKVersion('Quarterly rotation');

// Rotate KEK
const rotatedKekVersion = await keyManagementClient.rotateKEK('Security incident', ['user-to-remove']);

// Provision KEK for a user
await keyManagementClient.provisionKEKForUser('user-id', 'kek-version-id');
```

### ApiKeyClient

```typescript
import { NeuralLogClientFactory } from '@neurallog/client-sdk';

// Create an API key client
const apiKeyClient = NeuralLogClientFactory.createApiKeyClient({
  tenantId: 'my-tenant',
  serverUrl: 'https://api.neurallog.app',
  authUrl: 'https://auth.neurallog.app',
  apiKey: 'my-api-key'
});

// Initialize the client
await apiKeyClient.initialize();

// Create a new API key
const apiKeyId = await apiKeyClient.createApiKey('API Key Name', 3600); // Expires in 1 hour

// Get API keys
const apiKeys = await apiKeyClient.getApiKeys();

// Revoke API key
await apiKeyClient.revokeApiKey('api-key-id');
```

## Combining Specialized Clients

You can use multiple specialized clients together:

```typescript
import { NeuralLogClientFactory } from '@neurallog/client-sdk';

// Create clients
const authClient = NeuralLogClientFactory.createAuthClient({
  tenantId: 'my-tenant',
  serverUrl: 'https://api.neurallog.app',
  authUrl: 'https://auth.neurallog.app'
});

const logClient = NeuralLogClientFactory.createLogClient({
  tenantId: 'my-tenant',
  serverUrl: 'https://api.neurallog.app',
  authUrl: 'https://auth.neurallog.app'
});

// Initialize clients
await Promise.all([
  authClient.initialize(),
  logClient.initialize()
]);

// Login
await authClient.login('username', 'password');

// Log data
const logId = await logClient.log('app-logs', { message: 'Hello, world!' });
```

## Benefits of the New Architecture

The new client architecture provides several benefits:

1. **Improved Maintainability**: Each client class has a clear, focused responsibility
2. **Better Testability**: Smaller classes are easier to test in isolation
3. **Enhanced Flexibility**: Users can use just the clients they need
4. **Backward Compatibility**: The facade pattern ensures existing code continues to work
5. **Reduced Bundle Size**: Users can import only the clients they need
6. **Better Code Organization**: Code is organized by domain
7. **Easier to Extend**: New client classes can be added without modifying existing ones
