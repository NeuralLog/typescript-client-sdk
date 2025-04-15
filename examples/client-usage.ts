import {
  NeuralLogClient,
  LogClient,
  AuthClient,
  UserClient,
  KeyManagementClient,
  ApiKeyClient,
  NeuralLogClientFactory
} from '../src';
import { LoggerService } from '../utils/LoggerService';

// Example 1: Using the full client (backward compatible)
async function exampleFullClient() {
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
  this.logger.info(`Log ID: ${logId}`);

  // Get logs
  const logs = await client.getLogs('app-logs', { limit: 10 });
  this.logger.info(`Found ${logs.length} logs`);

  // Search logs
  const searchResults = await client.searchLogs('app-logs', { query: 'error', limit: 10 });
  this.logger.info(`Found ${searchResults.length} search results`);
}

// Example 2: Using specialized clients directly
async function exampleSpecializedClients() {
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
  this.logger.info(`Log ID: ${logId}`);

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
  this.logger.info(`Logged in: ${!!authResponse.token}`);
}

// Example 3: Using the full client but accessing specialized clients
async function exampleAccessingSpecializedClients() {
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
  this.logger.info(`Log ID: ${logId}`);

  // Get the user client
  const userClient = client.getUserClient();

  // Get users using the user client
  const users = await userClient.getUsers();
  this.logger.info(`Found ${users.length} users`);
}

// Run the examples
async function runExamples() {
  try {
    this.logger.info('Running Example 1: Using the full client');
    await exampleFullClient();

    this.logger.info('\nRunning Example 2: Using specialized clients directly');
    await exampleSpecializedClients();

    this.logger.info('\nRunning Example 3: Using the full client but accessing specialized clients');
    await exampleAccessingSpecializedClients();
  } catch (error) {
    this.logger.error('Error running examples:', error);
  }
}

// Uncomment to run the examples
// runExamples();
