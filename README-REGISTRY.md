# NeuralLog Registry Integration

This document explains how to use the NeuralLog Registry with the TypeScript Client SDK.

## Overview

The NeuralLog Registry is a service that provides endpoint discovery for NeuralLog services. It allows clients to discover the correct endpoints for auth and server services without hardcoding URLs.

## Local Testing

For local testing, you can use the provided Docker Compose configuration in the `registry` directory:

```bash
# Navigate to the registry directory
cd ../registry

# Start the registry service
docker-compose up -d

# Check the registry status
curl http://localhost:3031/endpoints
```

This will start a registry service at http://localhost:3031 with the following configuration:

- Tenant ID: test-tenant
- Auth URL: http://localhost:3001
- Server URL: http://localhost:3030
- Web URL: http://localhost:3000
- Base Domain: localhost

## Testing the SDK with the Registry

To test the TypeScript Client SDK with the registry, run the provided test script:

```bash
# Navigate to the typescript-client-sdk directory
cd ../typescript-client-sdk

# Run the test
./test-registry.ps1
```

Or manually:

```bash
# Build the SDK
npm run build

# Run the test
npx ts-node examples/registry-test.ts
```

## Using the Registry in Your Code

To use the registry in your code, create a NeuralLogClient with only the tenant ID:

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create a client with only the tenant ID
const client = new NeuralLogClient({
  tenantId: 'your-tenant-id'
});

// Initialize the client (this will fetch endpoints from the registry)
await client.initialize();

// Now the client has the correct endpoints for this tenant
console.log(`Auth URL: ${client.getAuthUrl()}`);
console.log(`Server URL: ${client.getServerUrl()}`);
console.log(`Web URL: ${client.getWebUrl()}`);

// Use the client as usual
await client.authenticateWithApiKey('your-api-key');
```

For local testing, you can override the registry URL:

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create a client with tenant ID and local registry URL
const client = new NeuralLogClient({
  tenantId: 'test-tenant',
  registryUrl: 'http://localhost:3031'
});

// Initialize the client (this will fetch endpoints from the local registry)
await client.initialize();

// Now the client has the correct endpoints for local testing
// (http://localhost:3001 for auth, http://localhost:3030 for server, and http://localhost:3000 for web)
console.log(`Auth URL: ${client.getAuthUrl()}`);
console.log(`Server URL: ${client.getServerUrl()}`);
console.log(`Web URL: ${client.getWebUrl()}`);
```

## Registry URL Format

By default, the registry URL is constructed as:

```
https://registry.{tenantId}.neurallog.app
```

For example, if your tenant ID is `acme`, the registry URL would be:

```
https://registry.acme.neurallog.app
```

You can override this by providing a `registryUrl` in the client configuration.

## Stopping the Registry

To stop the registry service:

```bash
# Navigate to the registry directory
cd ../registry

# Stop the registry service
docker-compose down
```
