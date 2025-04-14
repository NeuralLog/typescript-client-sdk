# Basic Usage Example

This example demonstrates the basic usage of the NeuralLog TypeScript Client SDK.

## Prerequisites

- Node.js 22 or later
- npm or yarn

## Installation

```bash
npm install @neurallog/client-sdk
# or
yarn add @neurallog/client-sdk
```

## Example Code

### Initializing the Client

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

// Create a client instance
const client = new NeuralLogClient({
  tenantId: 'your-tenant-id'
});

// Initialize the client with a recovery phrase
async function initializeClient() {
  try {
    // For a new tenant, generate a mnemonic
    const mnemonic = client.generateMnemonic();
    console.log('Generated mnemonic:', mnemonic);
    
    // Create a quiz to verify the user has saved the mnemonic
    const quiz = client.generateMnemonicQuiz(mnemonic);
    console.log('Verify these words from your mnemonic:');
    quiz.forEach(q => console.log(`Word #${q.index + 1}: ${q.word}`));
    
    // Initialize with the mnemonic
    const initialized = await client.initializeWithMnemonic(mnemonic);
    
    if (initialized) {
      console.log('Client initialized successfully');
      return true;
    } else {
      console.error('Failed to initialize client');
      return false;
    }
  } catch (error) {
    console.error('Error initializing client:', error);
    return false;
  }
}
```

### Authentication

```typescript
// Authenticate with username and password
async function authenticateWithPassword(username: string, password: string) {
  try {
    const authenticated = await client.authenticateWithPassword(username, password);
    
    if (authenticated) {
      console.log('Authentication successful');
      return true;
    } else {
      console.error('Authentication failed');
      return false;
    }
  } catch (error) {
    console.error('Error authenticating:', error);
    return false;
  }
}

// Authenticate with API key
async function authenticateWithApiKey(apiKey: string) {
  try {
    const authenticated = await client.authenticateWithApiKey(apiKey);
    
    if (authenticated) {
      console.log('Authentication successful');
      return true;
    } else {
      console.error('Authentication failed');
      return false;
    }
  } catch (error) {
    console.error('Error authenticating:', error);
    return false;
  }
}
```

### Logging Data

```typescript
// Log data to a specific log
async function logData(logName: string, data: Record<string, any>) {
  try {
    // Ensure the client is authenticated
    if (!client.isAuthenticated()) {
      console.error('Client is not authenticated');
      return false;
    }
    
    // Log the data
    const logId = await client.log(logName, data);
    console.log(`Log created with ID: ${logId}`);
    return true;
  } catch (error) {
    console.error('Error logging data:', error);
    return false;
  }
}

// Example usage
async function logApplicationEvent() {
  const eventData = {
    level: 'info',
    message: 'User logged in',
    timestamp: new Date().toISOString(),
    user: {
      id: 'user123',
      name: 'John Doe',
      email: 'john@example.com'
    },
    metadata: {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  };
  
  return await logData('application-events', eventData);
}
```

### Retrieving Logs

```typescript
// Get logs for a specific log name
async function getLogs(logName: string, limit: number = 10) {
  try {
    // Ensure the client is authenticated
    if (!client.isAuthenticated()) {
      console.error('Client is not authenticated');
      return null;
    }
    
    // Get the logs
    const logs = await client.getLogs(logName, { limit });
    console.log(`Retrieved ${logs.length} logs from ${logName}`);
    return logs;
  } catch (error) {
    console.error('Error retrieving logs:', error);
    return null;
  }
}

// Example usage
async function displayRecentEvents() {
  const logs = await getLogs('application-events', 5);
  
  if (logs) {
    console.log('Recent events:');
    logs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.timestamp}] ${log.level}: ${log.message}`);
    });
  }
}
```

### Searching Logs

```typescript
// Search logs for a specific log name
async function searchLogs(logName: string, query: string, limit: number = 10) {
  try {
    // Ensure the client is authenticated
    if (!client.isAuthenticated()) {
      console.error('Client is not authenticated');
      return null;
    }
    
    // Search the logs
    const logs = await client.searchLogs(logName, { query, limit });
    console.log(`Found ${logs.length} logs matching "${query}" in ${logName}`);
    return logs;
  } catch (error) {
    console.error('Error searching logs:', error);
    return null;
  }
}

// Example usage
async function findErrorLogs() {
  const logs = await searchLogs('application-events', 'error');
  
  if (logs) {
    console.log('Error logs:');
    logs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.timestamp}] ${log.message}`);
    });
  }
}
```

### Managing API Keys

```typescript
// Create a new API key
async function createApiKey(name: string, permissions: string[] = ['logs:read', 'logs:write']) {
  try {
    // Ensure the client is authenticated
    if (!client.isAuthenticated()) {
      console.error('Client is not authenticated');
      return null;
    }
    
    // Create the API key
    const apiKey = await client.createApiKey(name, permissions);
    console.log(`API key created: ${apiKey}`);
    return apiKey;
  } catch (error) {
    console.error('Error creating API key:', error);
    return null;
  }
}

// List API keys
async function listApiKeys() {
  try {
    // Ensure the client is authenticated
    if (!client.isAuthenticated()) {
      console.error('Client is not authenticated');
      return null;
    }
    
    // Get the API keys
    const apiKeys = await client.getApiKeys();
    console.log(`Retrieved ${apiKeys.length} API keys`);
    return apiKeys;
  } catch (error) {
    console.error('Error listing API keys:', error);
    return null;
  }
}

// Revoke an API key
async function revokeApiKey(apiKeyId: string) {
  try {
    // Ensure the client is authenticated
    if (!client.isAuthenticated()) {
      console.error('Client is not authenticated');
      return false;
    }
    
    // Revoke the API key
    await client.revokeApiKey(apiKeyId);
    console.log(`API key ${apiKeyId} revoked`);
    return true;
  } catch (error) {
    console.error('Error revoking API key:', error);
    return false;
  }
}
```

### Key Rotation

```typescript
// Rotate the KEK
async function rotateKEK(reason: string, removedUsers: string[] = []) {
  try {
    // Ensure the client is authenticated
    if (!client.isAuthenticated()) {
      console.error('Client is not authenticated');
      return false;
    }
    
    // Rotate the KEK
    const newVersion = await client.rotateKEK(reason, removedUsers);
    console.log(`KEK rotated to version: ${newVersion.id}`);
    return true;
  } catch (error) {
    console.error('Error rotating KEK:', error);
    return false;
  }
}

// Example usage
async function quarterlyKeyRotation() {
  return await rotateKEK('Quarterly key rotation');
}
```

## Complete Example

Here's a complete example that demonstrates the basic usage of the NeuralLog TypeScript Client SDK:

```typescript
import { NeuralLogClient } from '@neurallog/client-sdk';

async function main() {
  try {
    // Create a client instance
    const client = new NeuralLogClient({
      tenantId: 'your-tenant-id'
    });
    
    // Initialize the client (for a new tenant)
    const mnemonic = client.generateMnemonic();
    console.log('Generated mnemonic:', mnemonic);
    
    const initialized = await client.initializeWithMnemonic(mnemonic);
    if (!initialized) {
      console.error('Failed to initialize client');
      return;
    }
    
    // Authenticate
    const authenticated = await client.authenticateWithPassword('admin@example.com', 'password123');
    if (!authenticated) {
      console.error('Authentication failed');
      return;
    }
    
    // Create an API key for programmatic access
    const apiKey = await client.createApiKey('Example API Key', ['logs:read', 'logs:write']);
    console.log('API key created:', apiKey);
    
    // Log some data
    const logData = {
      level: 'info',
      message: 'System initialized',
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0.0',
        environment: 'production'
      }
    };
    
    const logId = await client.log('system-logs', logData);
    console.log('Log created with ID:', logId);
    
    // Retrieve logs
    const logs = await client.getLogs('system-logs', { limit: 10 });
    console.log('Recent logs:', logs);
    
    // Search logs
    const searchResults = await client.searchLogs('system-logs', { query: 'initialized', limit: 10 });
    console.log('Search results:', searchResults);
    
    // Rotate the KEK
    const rotated = await client.rotateKEK('Example rotation');
    console.log('KEK rotated:', rotated);
    
    console.log('Example completed successfully');
  } catch (error) {
    console.error('Error in example:', error);
  }
}

main();
```

## Step-by-Step Explanation

1. **Create a Client Instance**:
   ```typescript
   const client = new NeuralLogClient({
     tenantId: 'your-tenant-id'
   });
   ```
   This creates a new NeuralLog client instance with the specified tenant ID.

2. **Initialize the Client**:
   ```typescript
   const mnemonic = client.generateMnemonic();
   const initialized = await client.initializeWithMnemonic(mnemonic);
   ```
   This generates a new mnemonic phrase and initializes the client with it. The mnemonic is used to derive the master secret, which is then used to derive the key hierarchy.

3. **Authenticate**:
   ```typescript
   const authenticated = await client.authenticateWithPassword('admin@example.com', 'password123');
   ```
   This authenticates the client with the NeuralLog Auth service using the specified username and password.

4. **Create an API Key**:
   ```typescript
   const apiKey = await client.createApiKey('Example API Key', ['logs:read', 'logs:write']);
   ```
   This creates a new API key with the specified name and permissions.

5. **Log Data**:
   ```typescript
   const logId = await client.log('system-logs', logData);
   ```
   This logs the specified data to the 'system-logs' log. The data is encrypted client-side before being sent to the server.

6. **Retrieve Logs**:
   ```typescript
   const logs = await client.getLogs('system-logs', { limit: 10 });
   ```
   This retrieves the most recent logs from the 'system-logs' log. The logs are decrypted client-side after being retrieved from the server.

7. **Search Logs**:
   ```typescript
   const searchResults = await client.searchLogs('system-logs', { query: 'initialized', limit: 10 });
   ```
   This searches the 'system-logs' log for entries containing the word 'initialized'. The search is performed using secure search tokens that don't reveal the original query.

8. **Rotate the KEK**:
   ```typescript
   const rotated = await client.rotateKEK('Example rotation');
   ```
   This rotates the Key Encryption Key (KEK), creating a new version. This is useful for security purposes or when removing users from the system.

## Common Issues and Solutions

### Issue 1: Client Initialization Fails

**Problem**: The client fails to initialize with a mnemonic or recovery phrase.

**Solution**:
- Ensure the mnemonic is valid (12 or 24 words from the BIP-39 wordlist)
- Ensure the tenant ID is correct
- Check for network connectivity issues

### Issue 2: Authentication Fails

**Problem**: The client fails to authenticate with username/password or API key.

**Solution**:
- Ensure the credentials are correct
- Ensure the auth service URL is accessible
- Check for CORS issues in browser environments

### Issue 3: Logging Fails

**Problem**: The client fails to log data.

**Solution**:
- Ensure the client is authenticated
- Ensure the key hierarchy is initialized
- Ensure the logs service URL is accessible

### Issue 4: Retrieving Logs Fails

**Problem**: The client fails to retrieve logs.

**Solution**:
- Ensure the client is authenticated
- Ensure the key hierarchy is initialized
- Ensure the logs service URL is accessible
- Check if the log name exists

## Next Steps

- Try the [Advanced Usage Example](./advanced-usage.md)
- Learn about [Configuration Options](../configuration.md)
- Explore the [API Reference](../api.md)
- Read about the [Architecture](../architecture.md)
