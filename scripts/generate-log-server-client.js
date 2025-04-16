const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the OpenAPI specification
const openApiSpecPath = path.resolve(__dirname, '../../log-server/src/openapi.yaml');

// Output directory for the generated client
const outputDir = path.resolve(__dirname, '../src/generated/log-server');

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate the client
console.log('Generating OpenAPI client for Log Server...');
try {
  execSync(
    `npx @openapitools/openapi-generator-cli generate \
    -i ${openApiSpecPath} \
    -g typescript-axios \
    -o ${outputDir} \
    --additional-properties=supportsES6=true,npmName=@neurallog/log-server-client,npmVersion=1.0.0,withInterfaces=true,useSingleRequestParameter=true`,
    { stdio: 'inherit' }
  );
  console.log('Log Server OpenAPI client generated successfully!');
} catch (error) {
  console.error('Error generating Log Server OpenAPI client:', error);
  process.exit(1);
}
