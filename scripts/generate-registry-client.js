const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const openApiPath = path.resolve(__dirname, '../../registry/src/openapi.yaml');
const outputDir = path.resolve(__dirname, '../src/registry/openapi');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate OpenAPI client
console.log('Generating OpenAPI client for registry service...');
try {
  execSync(
    `npx openapi-typescript-codegen --input ${openApiPath} --output ${outputDir} --client axios --name RegistryApi`,
    { stdio: 'inherit' }
  );
  console.log('OpenAPI client generated successfully!');
} catch (error) {
  console.error('Failed to generate OpenAPI client:', error);
  process.exit(1);
}
