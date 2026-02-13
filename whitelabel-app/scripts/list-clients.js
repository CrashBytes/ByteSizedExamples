#!/usr/bin/env node

/**
 * List All Clients
 * 
 * Shows all available client configurations
 * 
 * Usage:
 *   node scripts/list-clients.js
 */

const fs = require('fs');
const path = require('path');

const configsDir = path.join(__dirname, '..', 'configs');

console.log('\n📋 Available Clients:\n');
console.log('='.repeat(60) + '\n');

try {
  const files = fs.readdirSync(configsDir);
  const configFiles = files.filter(f => f.endsWith('.config.js'));
  
  if (configFiles.length === 0) {
    console.log('No client configurations found.\n');
    console.log('Create a new client with:');
    console.log('  node scripts/new-client.js <slug> <name>\n');
    process.exit(0);
  }
  
  configFiles.forEach(file => {
    const clientName = file.replace('.config.js', '');
    const configPath = path.join(configsDir, file);
    
    try {
      const config = require(configPath);
      const assetsPath = path.join(__dirname, '..', 'assets', clientName);
      const hasAssets = fs.existsSync(assetsPath);
      
      console.log(`📦 ${clientName}`);
      console.log(`   Name: ${config.appName || 'N/A'}`);
      console.log(`   Slug: ${config.slug || 'N/A'}`);
      console.log(`   Scheme: ${config.scheme || 'N/A'}`);
      console.log(`   iOS Bundle: ${config.ios?.bundleIdentifier || 'N/A'}`);
      console.log(`   Android Package: ${config.android?.package || 'N/A'}`);
      console.log(`   Assets: ${hasAssets ? '✅ Found' : '❌ Missing'}`);
      console.log(`   Run: CLIENT=${clientName} npm start`);
      console.log('');
    } catch (error) {
      console.log(`📦 ${clientName}`);
      console.log(`   ❌ Error loading config: ${error.message}`);
      console.log('');
    }
  });
  
  console.log('='.repeat(60));
  console.log(`\nTotal clients: ${configFiles.length}\n`);
  console.log('Commands:');
  console.log('  Create new: node scripts/new-client.js <slug> <name>');
  console.log('  Validate:   node scripts/validate-config.js <slug>');
  console.log('  Run:        CLIENT=<slug> npm start\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
