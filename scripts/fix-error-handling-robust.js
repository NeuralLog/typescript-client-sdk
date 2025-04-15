const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

// Directory containing client files
const clientDir = path.join(__dirname, '..', 'src', 'client');

// Function to log verbose information
function logVerbose(...args) {
  if (verbose) {
    console.log(...args);
  }
}

// Function to process a file
function processFile(filePath, dryRun) {
  console.log(`Processing ${filePath}...`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let changes = 0;
  
  // Find and replace error handling patterns
  // This regex is more flexible and can handle various formatting styles
  const errorHandlingRegex = /try\s*{([\s\S]*?)}\s*catch\s*\(\s*error\s*\)\s*{([\s\S]*?)}/g;
  
  newContent = content.replace(errorHandlingRegex, (match, tryBlock, catchBlock) => {
    // Check if this is the pattern we want to replace
    if (!catchBlock.includes('throw new LogError') || 
        !catchBlock.includes('error instanceof Error')) {
      logVerbose('  Skipping non-matching catch block:', catchBlock);
      return match; // Not our pattern, return unchanged
    }
    
    // Extract the method call from the try block
    let methodCall = '';
    const returnAwaitMatch = tryBlock.match(/return\s+await\s+this\.([^;]+);/);
    const awaitMatch = tryBlock.match(/await\s+this\.([^;]+);/);
    
    if (returnAwaitMatch) {
      methodCall = returnAwaitMatch[1].trim();
    } else if (awaitMatch) {
      methodCall = awaitMatch[1].trim();
    } else {
      logVerbose('  Could not extract method call from try block:', tryBlock);
      return match; // Can't extract method call, return unchanged
    }
    
    // Extract the operation and error code from the catch block
    const operationMatch = catchBlock.match(/Failed\s+to\s+([^:]+):/);
    const errorCodeMatch = catchBlock.match(/['"]([^'"]+)['"]\s*\)/);
    
    if (!operationMatch || !errorCodeMatch) {
      logVerbose('  Could not extract operation or error code from catch block:', catchBlock);
      return match; // Can't extract operation or error code, return unchanged
    }
    
    const operation = operationMatch[1].trim();
    const errorCode = errorCodeMatch[1].trim();
    
    changes++;
    logVerbose(`  Replacing error handling for operation: ${operation}, error code: ${errorCode}`);
    
    // Determine if we need to include a return statement
    const needsReturn = returnAwaitMatch !== null;
    
    if (needsReturn) {
      return `try {
      return await this.${methodCall};
    } catch (error) {
      this.handleError(error, '${operation}', '${errorCode}');
    }`;
    } else {
      return `try {
      await this.${methodCall};
    } catch (error) {
      this.handleError(error, '${operation}', '${errorCode}');
    }`;
    }
  });
  
  // Check if the file has a private handleError method that should be removed
  // This regex is more flexible and can handle various formatting styles
  const privateHandleErrorPattern = /\/\*\*[\s\S]*?\*\/\s*(?:private|protected)\s+handleError\s*\(\s*error\s*:\s*unknown\s*,\s*operation\s*:\s*string\s*,\s*errorCode\s*:\s*\w+\s*\)\s*:\s*never\s*{[\s\S]*?throw\s+new\s+LogError[\s\S]*?}/g;
  
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
    } else if (file.endsWith('Client.ts') && file !== 'BaseClient.ts' && file !== 'NeuralLogClient.ts') {
      // Skip BaseClient.ts and NeuralLogClient.ts as they already have the handleError method
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
