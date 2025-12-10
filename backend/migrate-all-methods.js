/**
 * This script helps identify all methods that need Supabase migration
 * Run: node migrate-all-methods.js
 */

const fs = require('fs');
const path = require('path');

const serviceFile = path.join(__dirname, 'src/platform/platform.service.ts');
const content = fs.readFileSync(serviceFile, 'utf8');

// Find all method definitions
const methodRegex = /^\s+(async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm;
const methods = [];
let match;

while ((match = methodRegex.exec(content)) !== null) {
  const isAsync = match[1] !== undefined;
  const methodName = match[2];
  const lineNumber = content.substring(0, match.index).split('\n').length;
  
  // Skip private methods and helper methods
  if (!methodName.startsWith('_') && 
      methodName !== 'constructor' && 
      methodName !== 'generateId' &&
      methodName !== 'getMarketPrice' &&
      methodName !== 'updatePositionOnBuy' &&
      methodName !== 'updatePositionOnSell' &&
      methodName !== 'createWalletTxn' &&
      methodName !== 'updateKycStatus') {
    methods.push({ name: methodName, isAsync, line: lineNumber });
  }
}

console.log('Methods found:', methods.length);
methods.forEach(m => console.log(`${m.isAsync ? 'async ' : ''}${m.name}()`));












