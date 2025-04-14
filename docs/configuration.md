# Configuration

This document describes the configuration options for the NeuralLog TypeScript Client SDK.

## Configuration Options

The NeuralLog TypeScript Client SDK can be configured using the `NeuralLogClientConfig` interface:

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

### Required Configuration

| Option | Type | Description |
|--------|------|-------------|
| `tenantId` | `string` | The tenant ID for the NeuralLog instance. This is used for service discovery and key derivation. |

### Optional Configuration

| Option | Type | Description |
|--------|------|-------------|
| `registryUrl` | `string` | The URL of the NeuralLog Registry service. If not provided, it will be constructed from the tenant ID as `https://registry.{tenantId}.neurallog.app`. |
| `apiUrl` | `string` | The base URL for the NeuralLog API. If not provided, it will be fetched from the registry service. |
| `authUrl` | `string` | The URL of the NeuralLog Auth service. If not provided, it will be fetched from the registry service. |
| `logsUrl` | `string` | The URL of the NeuralLog Logs service. If not provided, it will be fetched from the registry service. |
| `apiKey` | `string` | An API key for authentication. If provided, the client will authenticate using this API key. |

## Configuration Examples

### Basic Configuration

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

const client = new NeuralLogClient({
  tenantId: 'your-tenant-id'
});
```

This configuration will:
1. Construct the registry URL as `https://registry.your-tenant-id.neurallog.app`
2. Fetch the API, Auth, and Logs service URLs from the registry
3. Require explicit authentication before use

### Custom Service URLs

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

const client = new NeuralLogClient({
  tenantId: 'your-tenant-id',
  authUrl: 'https://auth.example.com',
  logsUrl: 'https://logs.example.com'
});
```

This configuration will:
1. Use the provided Auth and Logs service URLs
2. Skip registry service discovery
3. Require explicit authentication before use

### API Key Authentication

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

const client = new NeuralLogClient({
  tenantId: 'your-tenant-id',
  apiKey: 'your-api-key'
});
```

This configuration will:
1. Construct the registry URL as `https://registry.your-tenant-id.neurallog.app`
2. Fetch the API, Auth, and Logs service URLs from the registry
3. Authenticate using the provided API key

### Local Development

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

const client = new NeuralLogClient({
  tenantId: 'local',
  registryUrl: 'http://localhost:3050',
  authUrl: 'http://localhost:3040',
  logsUrl: 'http://localhost:3030'
});
```

This configuration will:
1. Use the provided registry, auth, and logs service URLs for local development
2. Require explicit authentication before use

## Advanced Configuration

### Custom HTTP Client

The SDK uses the Fetch API for HTTP requests. You can customize the HTTP client by extending the `NeuralLogClient` class:

```typescript
import { NeuralLogClient, NeuralLogClientConfig } from '@neurallog/client-sdk';

class CustomNeuralLogClient extends NeuralLogClient {
  constructor(config: NeuralLogClientConfig) {
    super(config);
  }

  protected async fetch(url: string, options: RequestInit): Promise<Response> {
    // Add custom headers
    options.headers = {
      ...options.headers,
      'X-Custom-Header': 'custom-value'
    };

    // Add request logging
    console.log(`Fetching ${url} with options:`, options);

    // Call the original fetch method
    const response = await super.fetch(url, options);

    // Add response logging
    console.log(`Response from ${url}:`, response.status);

    return response;
  }
}

const client = new CustomNeuralLogClient({
  tenantId: 'your-tenant-id'
});
```

### Custom Error Handling

You can customize error handling by extending the `NeuralLogClient` class:

```typescript
import { NeuralLogClient, NeuralLogClientConfig, LogError } from '@neurallog/client-sdk';

class CustomNeuralLogClient extends NeuralLogClient {
  constructor(config: NeuralLogClientConfig) {
    super(config);
  }

  protected handleError(error: any): never {
    // Log the error
    console.error('NeuralLog client error:', error);

    // Send the error to a monitoring service
    if (error instanceof LogError) {
      sendToMonitoring({
        code: error.code,
        message: error.message,
        stack: error.stack
      });
    }

    // Rethrow the error
    throw error;
  }
}

const client = new CustomNeuralLogClient({
  tenantId: 'your-tenant-id'
});
```

### Custom Key Derivation

You can customize key derivation by extending the `CryptoService` class:

```typescript
import { NeuralLogClient, NeuralLogClientConfig, CryptoService } from '@neurallog/client-sdk';

class CustomCryptoService extends CryptoService {
  // Override key derivation methods
  async deriveMasterSecret(tenantId: string, recoveryPhrase: string): Promise<Uint8Array> {
    // Custom implementation
    const customSecret = await super.deriveMasterSecret(tenantId, recoveryPhrase);
    // Apply additional transformations
    return customSecret;
  }
}

class CustomNeuralLogClient extends NeuralLogClient {
  constructor(config: NeuralLogClientConfig) {
    super(config);
    // Replace the default crypto service with the custom one
    this.cryptoService = new CustomCryptoService();
  }
}

const client = new CustomNeuralLogClient({
  tenantId: 'your-tenant-id'
});
```

## Environment-Specific Configuration

### Browser

The SDK works in browser environments without additional configuration. It uses the browser's native `fetch` API and Web Crypto API.

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

const client = new NeuralLogClient({
  tenantId: 'your-tenant-id'
});
```

### Node.js

When using the SDK in Node.js, you need to provide polyfills for the Fetch API and Web Crypto API:

```typescript
// Polyfill fetch
import 'isomorphic-fetch';

// Polyfill crypto
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

import { NeuralLogClient } from '@neurallog/client-sdk';

const client = new NeuralLogClient({
  tenantId: 'your-tenant-id'
});
```

### React Native

When using the SDK in React Native, you need to provide polyfills for the Web Crypto API:

```typescript
// Polyfill crypto
import { polyfillWebCrypto } from 'react-native-get-random-values';
polyfillWebCrypto();

import { NeuralLogClient } from '@neurallog/client-sdk';

const client = new NeuralLogClient({
  tenantId: 'your-tenant-id'
});
```

## Configuration Best Practices

### Security

- **API Keys**: Store API keys securely and never expose them in client-side code
- **Service URLs**: Use HTTPS for all service URLs in production
- **Recovery Phrases**: Store recovery phrases securely and never expose them in client-side code

### Performance

- **Caching**: Cache the client instance to avoid repeated initialization
- **Service Discovery**: Provide service URLs directly in production to avoid registry lookups
- **Authentication**: Authenticate once and reuse the client instance

### Error Handling

- **Retry Logic**: Implement retry logic for transient errors
- **Fallback**: Implement fallback mechanisms for service unavailability
- **Logging**: Log errors for debugging and monitoring

## Troubleshooting

### Common Issues

#### Service Discovery Fails

**Problem**: The client fails to discover services from the registry.

**Solution**:
- Ensure the tenant ID is correct
- Ensure the registry URL is accessible
- Provide service URLs directly to bypass service discovery

#### Authentication Fails

**Problem**: The client fails to authenticate.

**Solution**:
- Ensure the API key or credentials are correct
- Ensure the auth service URL is accessible
- Check for CORS issues in browser environments

#### Encryption/Decryption Fails

**Problem**: The client fails to encrypt or decrypt data.

**Solution**:
- Ensure the key hierarchy is initialized
- Ensure the correct KEK versions are available
- Check for Web Crypto API compatibility issues

### Debugging

The SDK provides detailed error messages with error codes. You can use these to diagnose issues:

```typescript
try {
  await client.log('log-name', { message: 'Hello, world!' });
} catch (error) {
  if (error instanceof LogError) {
    console.error(`Error code: ${error.code}`);
    console.error(`Error message: ${error.message}`);
  }
}
```

## Configuration Reference

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
