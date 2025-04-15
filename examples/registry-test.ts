import { NeuralLogClient } from '../src/client/NeuralLogClient';
import { LoggerService } from '../utils/LoggerService';

/**
 * Test the registry integration with the TypeScript Client SDK
 */
async function testRegistry() {
  try {
    this.logger.info('Testing registry integration...');

    // Create a client with only the tenant ID
    const client = new NeuralLogClient({
      tenantId: 'test-tenant',
      // Optional: Override the registry URL for local testing
      registryUrl: 'http://localhost:3031'
    });

    // Initialize the client (this will fetch endpoints from the registry)
    this.logger.info('Initializing client...');
    await client.initialize();
    this.logger.info('Client initialized successfully!');

    // Get the endpoints
    const authUrl = client.getAuthUrl();
    const serverUrl = client.getServerUrl();
    const webUrl = client.getWebUrl();

    this.logger.info('Endpoints from registry:');
    this.logger.info(`- Auth URL: ${authUrl}`);
    this.logger.info(`- Server URL: ${serverUrl}`);
    this.logger.info(`- Web URL: ${webUrl}`);

    // Try to authenticate with an API key
    // This will fail in this test environment, but it will show that the endpoints were fetched correctly
    try {
      this.logger.info('Attempting to authenticate with API key (expected to fail)...');
      await client.authenticateWithApiKey('test-api-key');
    } catch (error: any) {
      this.logger.info('Authentication failed as expected (this is just a test)');
      this.logger.info(`Error: ${error.message || 'Unknown error'}`);
    }

    this.logger.info('Registry integration test completed successfully!');
  } catch (error: any) {
    this.logger.error('Error testing registry integration:', error.message || error);
  }
}

// Run the test
testRegistry();
