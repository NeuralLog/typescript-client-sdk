const fs = require('fs');
const path = require('path');

// Directory containing client files
const clientDir = path.join(__dirname, '..', 'src', 'client');

// Regex pattern to match the error handling pattern
const errorHandlingPattern = /try\s*{\s*(?:return\s+)?await\s+this\.[\w.]+\(.*?\);\s*}\s*catch\s*\(error\)\s*{\s*throw\s+new\s+LogError\(\s*`Failed\s+to\s+([^:]+):\s+\${error\s+instanceof\s+Error\s+\?\s+error\.message\s+:\s+String\(error\)}`\s*,\s*['"]([^'"]+)['"]\s*\);\s*}/gs;

// Replacement pattern
const replacementPattern = (operation, errorCode) => 
  `try {
      return await this.$1;
    } catch (error) {
      this.handleError(error, '${operation}', '${errorCode}');
    }`;

// Function to process a file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Count matches before replacement
  const matches = content.match(errorHandlingPattern);
  const matchCount = matches ? matches.length : 0;
  
  if (matchCount === 0) {
    console.log(`  No error handling patterns found in ${filePath}`);
    return;
  }
  
  // Replace the error handling pattern
  let newContent = content.replace(errorHandlingPattern, (match, operation, errorCode) => {
    // Extract the method call from the try block
    const methodCallMatch = match.match(/await\s+this\.([\w.]+\(.*?\))/);
    const methodCall = methodCallMatch ? methodCallMatch[1] : 'methodCall';
    
    return `try {
      return await this.${methodCall};
    } catch (error) {
      this.handleError(error, '${operation.trim()}', '${errorCode}');
    }`;
  });
  
  // Check if the file has a private handleError method that should be removed
  const privateHandleErrorPattern = /private\s+handleError\s*\(\s*error\s*:\s*unknown\s*,\s*operation\s*:\s*string\s*,\s*errorCode\s*:\s*\w+\s*\)\s*:\s*never\s*{\s*throw\s+new\s+LogError\(\s*`Failed\s+to\s+\${operation}:\s+\${error\s+instanceof\s+Error\s+\?\s+error\.message\s+:\s+String\(error\)}`\s*,\s*errorCode\s*\);\s*}/g;
  
  if (privateHandleErrorPattern.test(newContent)) {
    console.log(`  Removing private handleError method from ${filePath}`);
    newContent = newContent.replace(privateHandleErrorPattern, '// Using handleError from BaseClient');
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  console.log(`  Updated ${matchCount} error handling patterns in ${filePath}`);
}

// Function to find all client files
function findClientFiles(dir) {
  const files = fs.readdirSync(dir);
  
  const clientFiles = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip the interfaces directory
      if (file !== 'interfaces' && file !== 'services') {
        clientFiles.push(...findClientFiles(filePath));
      }
    } else if (file.endsWith('Client.ts')) {
      clientFiles.push(filePath);
    }
  }
  
  return clientFiles;
}

// Main function
function main() {
  console.log('Finding client files...');
  const clientFiles = findClientFiles(clientDir);
  console.log(`Found ${clientFiles.length} client files`);
  
  // Process each file
  for (const file of clientFiles) {
    processFile(file);
  }
  
  console.log('Done!');
}

// Run the script
main();
