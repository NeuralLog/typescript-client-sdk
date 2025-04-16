# OpenAPI Client Integration

This document describes the integration of the OpenAPI generated client in the NeuralLog TypeScript Client SDK.

## Overview

The NeuralLog TypeScript Client SDK now uses an OpenAPI generated client to interact with the log server. This approach provides several benefits:

1. **Consistency**: The client is automatically generated from the OpenAPI specification, ensuring consistency between the API definition and the client implementation.

2. **Type Safety**: The generated client provides strong typing for API requests and responses, making it easier to catch errors at compile time.

3. **Maintainability**: When the API changes, we can simply regenerate the client code instead of manually updating it.

4. **Documentation**: The OpenAPI specification serves as both documentation and the source of truth for the API.

## Architecture

The OpenAPI client integration follows a layered architecture:

1. **Generated Client Layer**: The base layer is the OpenAPI generated client, which provides low-level access to the log server API.

2. **Client Wrapper Layer**: The `OpenApiLogServerClient` and `LogServerClient` classes wrap the generated client and provide a more convenient interface for the rest of the SDK.

3. **Service Layer**: The `LogsService` class uses the client wrapper to provide a high-level interface for log operations.

4. **Manager Layer**: The `LogManager` class uses the service layer to provide a complete solution for log operations, including encryption and authentication.

## Generating the Client

The OpenAPI client is generated using the OpenAPI Generator CLI. The generation process is automated using a script in the `scripts` directory.

To generate the client, run:

```bash
node scripts/generate-api-client.js
```

This script reads the OpenAPI specification from the log server repository and generates the client code in the `src/generated/log-server` directory.

## Authentication

The OpenAPI client handles authentication by injecting the appropriate authentication headers into each request:

1. **API Key Authentication**: For operations that require an API key, the client injects the API key into the `Authorization` header.

2. **JWT Authentication**: For operations that require a JWT token, the client injects the token into the `Authorization` header.

3. **Tenant ID**: The client also injects the tenant ID into the `x-tenant-id` header for all requests.

## Zero-Knowledge Encryption

The OpenAPI client integration maintains the zero-knowledge encryption architecture of NeuralLog:

1. **Log Name Encryption**: Log names are encrypted on the client side before being sent to the server.

2. **Log Data Encryption**: Log data is encrypted on the client side before being sent to the server.

3. **Search Token Generation**: Search tokens are generated on the client side for searchable encryption.

The encryption is handled by the `CryptoService` class, which is used by the `LogManager` class before making requests to the log server.

## Error Handling

The OpenAPI client integration includes comprehensive error handling:

1. **Network Errors**: The client handles network errors and provides meaningful error messages.

2. **API Errors**: The client handles API errors and provides meaningful error messages.

3. **Validation Errors**: The client validates request parameters and provides meaningful error messages.

## Testing

The OpenAPI client integration includes comprehensive tests:

1. **Unit Tests**: The client wrapper classes are tested using unit tests.

2. **Integration Tests**: The integration between the client wrapper and the service layer is tested using integration tests.

3. **End-to-End Tests**: The complete flow from the manager layer to the client wrapper is tested using end-to-end tests.

## Future Improvements

1. **Improved Error Handling**: Add more specific error types for different API errors.

2. **Caching**: Add caching for frequently used API calls.

3. **Retry Logic**: Add retry logic for transient errors.

4. **Offline Support**: Add support for offline operations with synchronization when online.

5. **Performance Monitoring**: Add performance monitoring for API calls.

6. **Extend to Other Services**: Apply the same approach to other services like the auth service.
