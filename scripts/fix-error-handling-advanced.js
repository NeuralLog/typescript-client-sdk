const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Directory containing client files
const clientDir = path.join(__dirname, '..', 'src', 'client');

// Function to process a file
function processFile(filePath, dryRun) {
  console.log(`Processing ${filePath}...`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let changes = 0;
  
  // Find and replace error handling patterns
  const errorHandlingRegex = /try\s*{([^}]*?)}\s*catch\s*\(error\)\s*{([^}]*?)}/gs;
  
  newContent = content.replace(errorHandlingRegex, (match, tryBlock, catchBlock) => {
    // Check if this is the pattern we want to replace
    if (!catchBlock.includes('throw new LogError') || 
        !catchBlock.includes('error instanceof Error ? error.message : String(error)')) {
      return match; // Not our pattern, return unchanged
    }
    
    // Extract the method call from the try block
    const methodCallMatch = tryBlock.match(/return\s+await\s+this\.([^;]+);/);
    if (!methodCallMatch) {
      return match; // Can't extract method call, return unchanged
    }
    
    // Extract the operation and error code from the catch block
    const operationMatch = catchBlock.match(/Failed\s+to\s+([^:]+):/);
    const errorCodeMatch = catchBlock.match(/'([^']+)'/);
    
    if (!operationMatch || !errorCodeMatch) {
      return match; // Can't extract operation or error code, return unchanged
    }
    
    const methodCall = methodCallMatch[1].trim();
    const operation = operationMatch[1].trim();
    const errorCode = errorCodeMatch[1].trim();
    
    changes++;
    
    return `try {
      return await this.${methodCall};
    } catch (error) {
      this.handleError(error, '${operation}', '${errorCode}');
    }`;
  });
  
  // Check if the file has a private handleError method that should be removed
  const privateHandleErrorPattern = /\/\*\*[\s\S]*?\*\/\s*private\s+handleError\s*\(\s*error\s*:\s*unknown\s*,\s*operation\s*:\s*string\s*,\s*errorCode\s*:\s*\w+\s*\)\s*:\s*never\s*{\s*throw\s+new\s+LogError\(\s*`Failed\s+to\s+\${operation}:\s+\${error\s+instanceof\s+Error\s+\?\s+error\.message\s+:\s+String\(error\)}`\s*,\s*errorCode\s*\);\s*}/g;
  
  if (privateHandleErrorPattern.test(newContent)) {
    console.log(`  Found private handleError method in ${filePath}`);
    newContent = newContent.replace(privateHandleErrorPattern, '  // Using handleError from BaseClient');
    changes++;
  }
  
  // Write the updated content back to the file if there were changes
  if (content !== newContent) {
    if (dryRun) {
      console.log(`  Would update ${changes} patterns in ${filePath}`);
    } else {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  Updated ${changes} patterns in ${filePath}`);
    }
  } else {
    console.log(`  No changes needed in ${filePath}`);
  }
}

// Function to find all client files
function findClientFiles(dir) {
  const files = fs.readdirSync(dir);
  
  const clientFiles = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip the interfaces directory and services directory
      if (file !== 'interfaces' && file !== 'services') {
        clientFiles.push(...findClientFiles(filePath));
      }
    } else if (file.endsWith('Client.ts') && file !== 'BaseClient.ts') {
      clientFiles.push(filePath);
    }
  }
  
  return clientFiles;
}

// Main function
function main() {
  console.log(`Running in ${dryRun ? 'dry run' : 'normal'} mode`);
  console.log('Finding client files...');
  const clientFiles = findClientFiles(clientDir);
  console.log(`Found ${clientFiles.length} client files`);
  
  // Process each file
  for (const file of clientFiles) {
    processFile(file, dryRun);
  }
  
  console.log('Done!');
}

// Run the script
main();
