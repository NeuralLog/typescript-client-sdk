# Test the registry integration with the TypeScript Client SDK
Write-Host "Testing registry integration with the TypeScript Client SDK..."

# Navigate to the typescript-client-sdk directory
Set-Location $PSScriptRoot

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Build the SDK
Write-Host "Building the SDK..."
npm run build

# Run the test
Write-Host "Running the test..."
npx ts-node examples/registry-test.ts

Write-Host "Test completed"
