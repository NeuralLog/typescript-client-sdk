# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2023-07-15

### Added

- New client architecture with specialized client classes:
  - `LogClient`: For log operations (logging, retrieving, searching)
  - `AuthClient`: For authentication operations (login, logout, permissions)
  - `UserClient`: For user operations (managing users, admin promotions)
  - `KeyManagementClient`: For key management operations (KEK versions, rotation)
  - `ApiKeyClient`: For API key operations (creating, revoking)
- Factory pattern for creating clients:
  - `NeuralLogClientFactory.createClient()`
  - `NeuralLogClientFactory.createLogClient()`
  - `NeuralLogClientFactory.createAuthClient()`
  - `NeuralLogClientFactory.createUserClient()`
  - `NeuralLogClientFactory.createKeyManagementClient()`
  - `NeuralLogClientFactory.createApiKeyClient()`
- New methods for accessing specialized clients from the main client:
  - `getLogClient()`
  - `getAuthClient()`
  - `getUserClient()`
  - `getKeyManagementClient()`
  - `getApiKeyClient()`
- New `login()` method as an alias for `authenticateWithPassword()`
- New `logout()` method for logging out
- New `isInitialized()` method for checking if the client is initialized
- New `checkPermission()` method for checking if a user has permission to perform an action on a resource

### Changed

- Refactored `NeuralLogClient` to use the facade pattern
- Improved error handling with more specific error messages
- Updated documentation to reflect the new architecture
- Renamed `authenticateWithPassword()` to `login()` (old method still works for backward compatibility)

### Fixed

- Fixed issue with service initialization
- Fixed issue with authentication token handling
- Fixed issue with error propagation

## [0.1.0] - 2023-01-15

### Added

- Initial release of the NeuralLog TypeScript Client SDK
- Zero-knowledge architecture with client-side encryption
- Support for logging, retrieving, and searching logs
- Support for user authentication and API key management
- Support for KEK management and rotation
- Support for admin promotions using Shamir's Secret Sharing
