# NeuralLogClient Refactoring

This document provides an overview of the refactoring of the `NeuralLogClient` class to use the facade pattern.

## Motivation

The original `NeuralLogClient` class was a monolithic class that handled all aspects of interacting with the NeuralLog system. This made it difficult to maintain, test, and extend. The refactoring aims to address these issues by breaking the class into smaller, more focused classes.

## Architecture

The new architecture uses the facade pattern, where the main `NeuralLogClient` class delegates to specialized client classes:

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

## Factory Pattern

The refactoring also introduces a factory pattern for creating clients:

```typescript
// Create a full client
const client = NeuralLogClientFactory.createClient(options);

// Create specialized clients
const logClient = NeuralLogClientFactory.createLogClient(options);
const authClient = NeuralLogClientFactory.createAuthClient(options);
const userClient = NeuralLogClientFactory.createUserClient(options);
const keyManagementClient = NeuralLogClientFactory.createKeyManagementClient(options);
const apiKeyClient = NeuralLogClientFactory.createApiKeyClient(options);
```

## Backward Compatibility

The refactoring maintains backward compatibility by:

1. Keeping the same method signatures in the `NeuralLogClient` class
2. Delegating to the specialized clients internally
3. Providing access to the specialized clients through getter methods

## New Features

The refactoring also introduces some new features:

1. `login()` method as an alias for `authenticateWithPassword()`
2. `logout()` method for logging out
3. `isInitialized()` method for checking if the client is initialized
4. `checkPermission()` method for checking if a user has permission to perform an action on a resource

## Documentation

The documentation has been updated to reflect the new architecture:

1. Updated README.md with information about the new client architecture
2. Updated architecture.md with detailed information about the new client architecture
3. Created examples/client-architecture.md with examples of how to use the new client architecture
4. Created CHANGELOG.md to document the changes

## Testing

The refactoring has been tested by:

1. Compiling the TypeScript code to ensure there are no type errors
2. Creating examples to demonstrate how to use the new client architecture
3. Ensuring backward compatibility with existing code

## Future Work

Future work could include:

1. Adding more specialized clients for specific use cases
2. Implementing a plugin architecture for extending client functionality
3. Adding support for reactive programming patterns (RxJS, Observables)
4. Implementing streaming support for real-time log processing
