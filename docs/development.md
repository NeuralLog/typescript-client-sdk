# Development Guide

This document provides information for developers working on the NeuralLog TypeScript Client SDK.

## Development Environment Setup

### Prerequisites

- Node.js 22 or later
- npm 10 or later
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/NeuralLog/typescript-client-sdk.git
   cd typescript-client-sdk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the SDK:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
typescript-client-sdk/
├── src/                  # Source code
│   ├── index.ts          # Main entry point
│   ├── client/           # Client implementation
│   │   ├── NeuralLogClient.ts # Main client class
│   │   └── ...           # Other client-related files
│   ├── api/              # API clients
│   │   ├── AuthApi.ts    # Auth API client
│   │   ├── LogsApi.ts    # Logs API client
│   │   └── ...           # Other API clients
│   ├── crypto/           # Cryptographic operations
│   │   ├── CryptoService.ts # Main crypto service
│   │   ├── KeyDerivation.ts # Key derivation functions
│   │   ├── MnemonicService.ts # Mnemonic handling
│   │   ├── KeyPairService.ts # Key pair operations
│   │   ├── ShamirSecretSharing.ts # Shamir's Secret Sharing
│   │   └── ...           # Other crypto-related files
│   ├── types/            # TypeScript type definitions
│   │   ├── index.ts      # Type exports
│   │   └── ...           # Type definitions
│   ├── errors/           # Error classes
│   │   ├── LogError.ts   # Log error class
│   │   └── ...           # Other error classes
│   └── utils/            # Utility functions
│       ├── helpers.ts    # Helper functions
│       └── ...           # Other utility files
├── tests/                # Test files
│   ├── unit/             # Unit tests
│   │   ├── client/       # Client tests
│   │   ├── crypto/       # Crypto tests
│   │   └── ...           # Other unit tests
│   └── integration/      # Integration tests
├── docs/                 # Documentation
├── examples/             # Example code
├── dist/                 # Compiled output (generated)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project README
```

## Build Process

The build process uses TypeScript and follows these steps:

1. Clean the output directory:
   ```bash
   npm run clean
   ```

2. Compile TypeScript:
   ```bash
   npm run build
   ```

3. Generate type declarations:
   ```bash
   npm run build:types
   ```

4. Bundle the SDK:
   ```bash
   npm run build:bundle
   ```

## Development Workflow

### Running Tests

To run all tests:

```bash
npm test
```

To run unit tests only:

```bash
npm run test:unit
```

To run integration tests only:

```bash
npm run test:integration
```

To run tests with coverage:

```bash
npm run test:coverage
```

### Linting

To lint the code:

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

### Formatting

To format the code:

```bash
npm run format
```

### Building Documentation

To build the documentation:

```bash
npm run docs
```

### Watching for Changes

To watch for changes and rebuild automatically:

```bash
npm run watch
```

## Key Components

### NeuralLogClient

The `NeuralLogClient` class is the main entry point for the SDK. It provides a high-level interface for interacting with the NeuralLog system.

Key responsibilities:
- Service discovery
- Authentication
- Key hierarchy initialization
- Logging
- Log retrieval and search
- User and API key management

### CryptoService

The `CryptoService` class provides cryptographic operations for the SDK.

Key responsibilities:
- Key hierarchy derivation
- Encryption and decryption
- Searchable encryption
- Shamir's Secret Sharing

### API Clients

The API clients provide low-level interfaces for communicating with the NeuralLog backend services.

Key clients:
- `AuthApi`: Authentication and user management
- `LogsApi`: Log creation, retrieval, and search
- `UsersApi`: User management
- `ApiKeysApi`: API key management
- `KekApi`: KEK version management

## Testing

### Unit Tests

Unit tests are located in the `tests/unit` directory and use Jest as the test framework.

Key test areas:
- Client functionality
- Cryptographic operations
- API client behavior
- Error handling

### Integration Tests

Integration tests are located in the `tests/integration` directory and test the SDK's interaction with the NeuralLog backend services.

Key test areas:
- Authentication
- Logging
- Log retrieval and search
- User and API key management

### Mocking

The tests use Jest's mocking capabilities to mock external dependencies:

```typescript
// Example of mocking the fetch API
global.fetch = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  });
});
```

### Test Coverage

The project aims for high test coverage. Coverage reports are generated using Jest's coverage reporter:

```bash
npm run test:coverage
```

## Debugging

### Browser Debugging

When debugging in a browser environment:

1. Build the SDK with source maps:
   ```bash
   npm run build:dev
   ```

2. Use the browser's developer tools to set breakpoints and inspect variables.

### Node.js Debugging

When debugging in a Node.js environment:

1. Use the `--inspect` flag:
   ```bash
   node --inspect node_modules/.bin/jest --runInBand
   ```

2. Connect to the debugger using Chrome DevTools or your IDE.

## Common Development Tasks

### Adding a New Feature

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Implement the feature.

3. Add tests for the feature.

4. Update documentation.

5. Submit a pull request.

### Fixing a Bug

1. Create a new branch:
   ```bash
   git checkout -b fix/your-bug-fix
   ```

2. Fix the bug.

3. Add tests to verify the fix.

4. Update documentation if necessary.

5. Submit a pull request.

### Updating Dependencies

1. Check for outdated dependencies:
   ```bash
   npm outdated
   ```

2. Update dependencies:
   ```bash
   npm update
   ```

3. For major version updates, update them individually and test thoroughly.

### Publishing a New Version

1. Update the version in `package.json`:
   ```bash
   npm version patch # or minor, or major
   ```

2. Build the SDK:
   ```bash
   npm run build
   ```

3. Publish to npm:
   ```bash
   npm publish
   ```

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code.
- Follow the [TypeScript Style Guide](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md).
- Use strict mode (`"strict": true` in tsconfig.json).
- Use explicit types for function parameters and return values.
- Use interfaces for object types.
- Use enums for fixed sets of values.
- Use type guards for type narrowing.

### Documentation Guidelines

- Document all public APIs with JSDoc comments.
- Include examples in documentation.
- Keep documentation up-to-date with code changes.
- Use markdown for documentation files.

### Testing Guidelines

- Write tests for all new features and bug fixes.
- Aim for high test coverage.
- Use descriptive test names.
- Follow the AAA pattern (Arrange, Act, Assert).
- Mock external dependencies.

### Git Guidelines

- Use descriptive commit messages.
- Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- Keep commits focused on a single change.
- Rebase feature branches on main before submitting pull requests.
- Squash commits before merging.

## Performance Considerations

### Cryptographic Operations

Cryptographic operations can be computationally expensive. Consider the following:

- Cache derived keys to avoid repeated derivation.
- Use Web Workers for CPU-intensive operations in browser environments.
- Consider using WebAssembly for performance-critical cryptographic operations.

### Network Requests

Network requests can be slow and unreliable. Consider the following:

- Implement retry logic for transient errors.
- Use request batching for multiple operations.
- Implement request caching where appropriate.
- Use connection pooling in Node.js environments.

### Memory Usage

The SDK may handle large amounts of data. Consider the following:

- Avoid keeping large amounts of data in memory.
- Use streaming for large data transfers.
- Implement pagination for large result sets.
- Clean up resources when they are no longer needed.

## Security Considerations

### Key Management

- Never store sensitive keys in plaintext.
- Use secure key derivation functions.
- Implement key rotation.
- Use different keys for different purposes.

### Authentication

- Use secure authentication methods.
- Implement token expiration and renewal.
- Protect against CSRF and XSS attacks.
- Implement rate limiting for authentication attempts.

### Data Protection

- Encrypt sensitive data before transmission.
- Validate input data.
- Sanitize output data.
- Implement proper error handling to avoid leaking sensitive information.

## Troubleshooting

### Common Issues

#### Web Crypto API Not Available

**Problem**: The Web Crypto API is not available in the environment.

**Solution**:
- In Node.js, use the `crypto` module as a polyfill.
- In older browsers, use a polyfill library.

#### CORS Issues

**Problem**: CORS errors when making requests from a browser.

**Solution**:
- Ensure the server has proper CORS headers.
- Use a proxy server for development.
- Consider using a CORS proxy for testing.

#### TypeScript Compilation Errors

**Problem**: TypeScript compilation fails.

**Solution**:
- Check the error message for details.
- Ensure types are correct.
- Update type definitions if necessary.
- Check for missing dependencies.

### Debugging Techniques

#### Console Logging

Add console logs to debug issues:

```typescript
console.log('Variable value:', variable);
```

#### Debugger Statement

Use the `debugger` statement to pause execution:

```typescript
function problematicFunction() {
  debugger;
  // Code to debug
}
```

#### Error Handling

Catch and log errors:

```typescript
try {
  // Code that might throw an error
} catch (error) {
  console.error('Error details:', error);
  throw error;
}
```

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NeuralLog Documentation](https://neurallog.github.io/docs/)
- [BIP-39 Specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing)
