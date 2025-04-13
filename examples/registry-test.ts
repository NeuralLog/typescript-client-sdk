import { NeuralLogClient } from '../src/client/NeuralLogClient';

/**
 * Test the registry integration with the TypeScript Client SDK
 */
async function testRegistry() {
  try {
    console.log('Testing registry integration...');

    // Create a client with only the tenant ID
    const client = new NeuralLogClient({
      tenantId: 'test-tenant',
      // Optional: Override the registry URL for local testing
      registryUrl: 'http://localhost:3031'
    });

    // Initialize the client (this will fetch endpoints from the registry)
    console.log('Initializing client...');
    await client.initialize();
    console.log('Client initialized successfully!');

    // Get the endpoints
    const authUrl = client.getAuthUrl();
    const serverUrl = client.getServerUrl();
    const webUrl = client.getWebUrl();

    console.log('Endpoints from registry:');
    console.log(`- Auth URL: ${authUrl}`);
    console.log(`- Server URL: ${serverUrl}`);
    console.log(`- Web URL: ${webUrl}`);

    // Try to authenticate with an API key
    // This will fail in this test environment, but it will show that the endpoints were fetched correctly
    try {
      console.log('Attempting to authenticate with API key (expected to fail)...');
      await client.authenticateWithApiKey('test-api-key');
    } catch (error: any) {
      console.log('Authentication failed as expected (this is just a test)');
      console.log(`Error: ${error.message || 'Unknown error'}`);
    }

    console.log('Registry integration test completed successfully!');
  } catch (error: any) {
    console.error('Error testing registry integration:', error.message || error);
  }
}

// Run the test
testRegistry();
