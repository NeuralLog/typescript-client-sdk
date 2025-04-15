# Architecture

This document describes the architecture of the NeuralLog TypeScript Client SDK.

## Overview

The NeuralLog TypeScript Client SDK is the cornerstone of NeuralLog's zero-knowledge architecture. It implements client-side encryption, key management, and secure communication with the NeuralLog backend services. The SDK ensures that sensitive data never leaves the client unencrypted, providing a secure foundation for logging and telemetry.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     NeuralLog TypeScript Client SDK                      │
│                                                                         │
│  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ Client      │  │ Crypto              │  │ API                     │  │
│  │             │  │                     │  │                         │  │
│  │ • NeuralLog │◄─┤ • CryptoService     │  │ • AuthApi              │  │
│  │   Client    │  │ • KeyDerivation     │  │ • LogsApi              │  │
│  │             │  │ • MnemonicService   │  │ • UsersApi             │  │
│  │             │  │ • KeyPairService    │  │ • ApiKeysApi           │  │
│  │             │  │ • ShamirSecret      │  │ • KekApi               │  │
│  │             │  │   Sharing           │  │                         │  │
│  └─────────────┘  └─────────────────────┘  └─────────────────────────┘  │
│         │                    │                          │                │
│         ▼                    ▼                          ▼                │
│  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ Types       │  │ Utils               │  │ Errors                  │  │
│  │             │  │                     │  │                         │  │
│  │ • Interfaces│  │ • Helpers           │  │ • LogError              │  │
│  │ • Enums     │  │ • Constants         │  │ • AuthError             │  │
│  │ • Types     │  │ • Validators        │  │ • ApiError              │  │
│  └─────────────┘  └─────────────────────┘  └─────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          NeuralLog Backend                              │
│                                                                         │
│  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ Auth Service│  │ Logs Service        │  │ Registry Service        │  │
│  │             │  │                     │  │                         │  │
│  │ • Auth API  │  │ • Logs API          │  │ • Registry API          │  │
│  │ • KEK API   │  │ • Search API        │  │                         │  │
│  │ • User API  │  │                     │  │                         │  │
│  └─────────────┘  └─────────────────────┘  └─────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### Client Architecture

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

#### Class Diagram

```
┌─────────────────────┐
│  NeuralLogClient    │
└─────────────────────┘
          │
          ├─────────────┬─────────────┬─────────────┬─────────────┐
          ▼             ▼             ▼             ▼             ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   LogClient     │ │ AuthClient  │ │ UserClient  │ │KeyManagement│ │ ApiKeyClient│
└─────────────────┘ └─────────────┘ └─────────────┘ │   Client    │ └─────────────┘
          │             │             │             └─────────────┘        │
          ▼             ▼             ▼                   │                ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐      ▼          ┌─────────────┐
│   LogManager    │ │ AuthManager │ │ UserManager │ ┌─────────────┐ │ AuthManager │
└─────────────────┘ └─────────────┘ └─────────────┘ │KeyHierarchy │ └─────────────┘
                                                    │  Manager    │
                                                    └─────────────┘
```

#### Factory Pattern

The SDK also includes a factory pattern for creating clients:

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

### NeuralLogClient

The `NeuralLogClient` class is the main entry point for the SDK. It provides a high-level interface for interacting with the NeuralLog system, including:

- Authentication with username/password or API key
- Key hierarchy initialization and management
- Logging data with client-side encryption
- Retrieving and decrypting logs
- Searching encrypted logs
- User and API key management

The client handles service discovery through the registry service and manages the authentication state.

### CryptoService

The `CryptoService` class is the core of the zero-knowledge architecture. It implements:

- Key hierarchy derivation and management
- Client-side encryption and decryption of log data and log names
- Searchable encryption
- Shamir's Secret Sharing for secure key distribution
- Public/private key operations for secure communication

### Key Hierarchy

The SDK implements a sophisticated key hierarchy:

1. **Master Secret**: Derived from the tenant ID and recovery phrase or mnemonic
2. **Master KEK (Key Encryption Key)**: Derived from the Master Secret
3. **Operational KEKs**: Derived from the Master KEK, versioned for key rotation
4. **Log Keys**: Derived from the Operational KEK for encrypting log data
5. **Log Name Keys**: Derived from the Operational KEK for encrypting log names
6. **Search Keys**: Derived from the Operational KEK for searchable encryption

This hierarchy ensures that:
- The Master Secret is only used for recovery
- The Master KEK is only used to derive Operational KEKs
- Operational KEKs can be rotated without changing the Master Secret
- Different keys are used for different purposes (data, names, search)

### API Layer

The API layer provides typed interfaces for communicating with the NeuralLog backend services:

- **AuthApi**: Authentication, user management, and key management
- **LogsApi**: Log creation, retrieval, and search
- **UsersApi**: User management
- **ApiKeysApi**: API key management
- **KekApi**: KEK version management

### Shamir's Secret Sharing

The SDK implements Shamir's Secret Sharing for secure distribution of KEKs among administrators. This allows:

- Secure admin promotion requiring approval from existing admins
- Threshold-based secret recovery
- No single point of failure for key management

## Data Flow

### Log Creation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│ Application │────▶│ NeuralLog   │────▶│ Crypto     │────▶│ Logs API    │
│             │     │ Client      │     │ Service    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                                        │                   │
      │                                        │                   │
      │ 1. log('name', data)                   │                   │
      │                                        │                   │
      │                                        │                   │
      │                2. encryptLogName()     │                   │
      │                   encryptLogData()     │                   │
      │                                        │                   │
      │                                        │                   │
      │                                        │ 3. POST encrypted │
      │                                        │    data           │
      │                                        │                   │
      │                                        │                   │
      │                                        │                   │
      │                                        │                   │
      │                                        │                   │
      ▼                                        ▼                   ▼
```

1. Application calls `client.log('log-name', data)`
2. Client encrypts the log name and data using the CryptoService
3. Client sends the encrypted data to the Logs API

### Log Retrieval Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│ Application │────▶│ NeuralLog   │────▶│ Logs API    │────▶│ Crypto     │
│             │     │ Client      │     │             │     │ Service    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │                   │                   │                   │
      │ 1. getLogs('name')│                   │                   │
      │                   │                   │                   │
      │                   │ 2. GET logs       │                   │
      │                   │                   │                   │
      │                   │                   │                   │
      │                   │                   │ 3. decryptLogName()
      │                   │                   │    decryptLogData()
      │                   │                   │                   │
      │                   │                   │                   │
      │ 4. Decrypted logs │                   │                   │
      │                   │                   │                   │
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
```

1. Application calls `client.getLogs('log-name')`
2. Client retrieves encrypted logs from the Logs API
3. Client decrypts the log names and data using the CryptoService
4. Client returns the decrypted logs to the application

### Search Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│ Application │────▶│ NeuralLog   │────▶│ Crypto     │────▶│ Logs API    │
│             │     │ Client      │     │ Service    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │                   │                   │                   │
      │ 1. searchLogs     │                   │                   │
      │    ('name', query)│                   │                   │
      │                   │                   │                   │
      │                   │ 2. deriveSearchKey()                  │
      │                   │    generateSearchTokens()             │
      │                   │                   │                   │
      │                   │                   │                   │
      │                   │                   │ 3. POST search    │
      │                   │                   │    tokens         │
      │                   │                   │                   │
      │                   │                   │                   │
      │                   │ 4. decryptLogData()                   │
      │                   │                   │                   │
      │                   │                   │                   │
      │ 5. Decrypted logs │                   │                   │
      │                   │                   │                   │
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
```

1. Application calls `client.searchLogs('log-name', { query: 'search terms' })`
2. Client derives a search key and generates search tokens using the CryptoService
3. Client sends the search tokens to the Logs API
4. Client decrypts the returned log data using the CryptoService
5. Client returns the decrypted logs to the application

### Key Initialization Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│ Application │────▶│ NeuralLog   │────▶│ Crypto     │────▶│ Auth API    │
│             │     │ Client      │     │ Service    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      │                   │                   │                   │
      │ 1. initialize     │                   │                   │
      │    WithMnemonic() │                   │                   │
      │                   │                   │                   │
      │                   │ 2. deriveMasterSecret()               │
      │                   │    deriveMasterKEK()                  │
      │                   │    deriveOperationalKEK()             │
      │                   │                   │                   │
      │                   │                   │                   │
      │                   │                   │ 3. GET KEK        │
      │                   │                   │    versions       │
      │                   │                   │                   │
      │                   │                   │                   │
      │                   │ 4. recoverKEKVersions()               │
      │                   │                   │                   │
      │                   │                   │                   │
      │ 5. Initialization │                   │                   │
      │    complete       │                   │                   │
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
```

1. Application calls `client.initializeWithMnemonic(mnemonic)`
2. Client derives the key hierarchy using the CryptoService
3. Client retrieves KEK versions from the Auth API
4. Client recovers all KEK versions
5. Client returns success to the application

## Security Considerations

### Zero-Knowledge Architecture

The SDK implements a zero-knowledge architecture where:

- All sensitive data is encrypted client-side before transmission
- Encryption keys are derived client-side and never transmitted
- The server only stores encrypted data and cannot decrypt it
- Search is performed using secure tokens that don't reveal the original query

### Key Management

The SDK implements secure key management:

- Keys are derived using industry-standard algorithms (PBKDF2, HKDF)
- Different keys are used for different purposes
- Keys can be rotated without losing access to historical data
- Recovery is possible using a mnemonic phrase or recovery key

### Cryptographic Algorithms

The SDK uses modern, secure cryptographic algorithms:

- AES-256-GCM for symmetric encryption
- HMAC-SHA256 for search token generation
- PBKDF2 for password-based key derivation
- HKDF for key derivation
- RSA for asymmetric encryption (admin promotion)
- Shamir's Secret Sharing for threshold cryptography

## Integration Points

### NeuralLog Auth Service

The SDK integrates with the NeuralLog Auth Service for:

- User authentication
- API key management
- KEK version management
- User management

### NeuralLog Logs Service

The SDK integrates with the NeuralLog Logs Service for:

- Storing encrypted logs
- Retrieving encrypted logs
- Searching encrypted logs

### NeuralLog Registry Service

The SDK integrates with the NeuralLog Registry Service for:

- Service discovery
- Endpoint resolution

## Performance Considerations

- **Caching**: The SDK caches derived keys to avoid repeated cryptographic operations
- **Batch Processing**: The SDK supports batch operations for efficient log processing
- **Lazy Loading**: The SDK uses lazy loading for service discovery and key derivation
- **Asynchronous Operations**: All cryptographic operations are asynchronous to avoid blocking the main thread

## Future Improvements

- **WebAssembly**: Move cryptographic operations to WebAssembly for improved performance
- **Key Rotation Automation**: Implement automatic key rotation based on time or usage
- **Enhanced Search**: Implement more sophisticated searchable encryption techniques
- **Offline Support**: Add support for offline operation with local storage
- **End-to-End Encryption**: Extend the zero-knowledge architecture to cover all aspects of the system
- **Hardware Security Module (HSM) Support**: Add support for hardware-based key storage
- **Multi-Factor Authentication**: Enhance authentication with MFA support
- **Additional Specialized Clients**: Create more specialized clients for specific use cases
- **Plugin Architecture**: Implement a plugin architecture for extending client functionality
- **Reactive Programming**: Add support for reactive programming patterns (RxJS, Observables)
- **Streaming Support**: Implement streaming support for real-time log processing
