const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Whether to actually make changes to files (false = dry run)
  applyChanges: true,
  // Root directory to start searching from
  rootDir: path.resolve(__dirname, '..'),
  // Directories to exclude from processing
  excludeDirs: ['node_modules', 'dist', 'coverage', 'scripts'],
  // File extensions to process
  fileExtensions: ['.ts', '.tsx'],
  // Import statement to add if not present
  importStatement: "import { LoggerService } from '../utils/LoggerService';",
  // Logger initialization code to add if not present
  loggerInitCode: "  private logger = LoggerService.getInstance(process.env.NODE_ENV === 'test');",
  // Map of console methods to logger methods
  replacementMap: {
    'console.error': 'this.logger.error',
    'console.warn': 'this.logger.warn',
    'console.info': 'this.logger.info',
    'console.log': 'this.logger.info',
    'console.debug': 'this.logger.debug'
  }
};

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  consoleCallsReplaced: 0
};

/**
 * Process a file to replace console calls with logger calls
 * @param {string} filePath - Path to the file
 * @returns {boolean} - Whether the file was modified
 */
function processFile(filePath) {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Check if this is a class file (simplified check)
  const isClassFile = content.includes('class ') && content.includes('{');

  // Skip files that don't contain console calls
  const hasConsoleCall = Object.keys(CONFIG.replacementMap).some(call => content.includes(call));
  if (!hasConsoleCall) {
    return false;
  }

  console.log(`Processing ${filePath}${CONFIG.applyChanges ? '' : ' (dry run)'}`);

  // Add import statement if needed
  if (!content.includes("LoggerService")) {
    // Find the last import statement
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      // Find the end of the last import statement
      const endOfImport = content.indexOf(';', lastImportIndex) + 1;
      // Insert our import after the last import
      content = content.substring(0, endOfImport) + '\n' + CONFIG.importStatement + content.substring(endOfImport);
      console.log(`  Added import statement for LoggerService`);
    }
  }

  // Add logger initialization if this is a class file and doesn't already have a logger
  if (isClassFile && !content.includes('logger =') && !content.includes('logger:')) {
    // Find the first occurrence of a class
    const classIndex = content.indexOf('class ');
    if (classIndex !== -1) {
      // Find the opening brace of the class
      const openBraceIndex = content.indexOf('{', classIndex);
      if (openBraceIndex !== -1) {
        // Insert logger initialization after the opening brace
        content = content.substring(0, openBraceIndex + 1) + '\n' + CONFIG.loggerInitCode + content.substring(openBraceIndex + 1);
        console.log(`  Added logger initialization`);
      }
    }
  }

  // Replace console calls with logger calls
  let replacementCount = 0;
  for (const [consoleCall, loggerCall] of Object.entries(CONFIG.replacementMap)) {
    // Use regex to find console calls
    const regex = new RegExp(consoleCall + '\\s*\\(', 'g');
    const matches = content.match(regex);
    if (matches) {
      replacementCount += matches.length;
      content = content.replace(regex, loggerCall + '(');
      console.log(`  Replaced ${matches.length} occurrences of ${consoleCall} with ${loggerCall}`);
    }
  }

  // Update statistics
  stats.consoleCallsReplaced += replacementCount;

  // If content was modified and we're not in dry run mode, write the file
  if (content !== originalContent) {
    if (CONFIG.applyChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesModified++;
    } else {
      console.log('  Changes would be applied (dry run)');
    }
    return true;
  }

  return false;
}

/**
 * Recursively process all files in a directory
 * @param {string} dir - Directory to process
 */
function processDirectory(dir) {
  // Get all files in the directory
  const files = fs.readdirSync(dir);

  // Process each file
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip excluded directories
      if (CONFIG.excludeDirs.includes(file)) {
        continue;
      }
      // Recursively process subdirectories
      processDirectory(filePath);
    } else if (stat.isFile()) {
      // Process only files with specified extensions
      const ext = path.extname(file);
      if (CONFIG.fileExtensions.includes(ext)) {
        stats.filesProcessed++;
        processFile(filePath);
      }
    }
  }
}

// Main execution
console.log(`Starting ${CONFIG.applyChanges ? 'replacement' : 'dry run'} of console calls with logger calls`);
console.log(`Root directory: ${CONFIG.rootDir}`);

// Process all files
processDirectory(CONFIG.rootDir);

// Print statistics
console.log('\nStatistics:');
console.log(`  Files processed: ${stats.filesProcessed}`);
console.log(`  Files that would be modified: ${stats.filesModified}`);
console.log(`  Console calls that would be replaced: ${stats.consoleCallsReplaced}`);

if (!CONFIG.applyChanges) {
  console.log('\nThis was a dry run. To apply changes, set CONFIG.applyChanges = true');
}
