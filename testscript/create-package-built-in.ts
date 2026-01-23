#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env file manually
const envPath = join(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && !key.startsWith('#') && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    process.env[key] = value;
  }
});

// Validate required environment variables
const requiredEnvVars = ['SAP_URL', 'SAP_USER', 'SAP_PASSWORD', 'SAP_CLIENT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('');
  console.error('Please set these variables in your .env file:');
  console.error('');
  console.error('SAP_URL=http://your-sap-host:port');
  console.error('SAP_USER=your-username');
  console.error('SAP_PASSWORD=your-password');
  console.error('SAP_CLIENT=your-client-number');
  console.error('SAP_LANGUAGE=E (optional)');
  process.exit(1);
}

const client = new ADTClient(
  process.env.SAP_URL!,
  process.env.SAP_USER!,
  process.env.SAP_PASSWORD!,
  process.env.SAP_CLIENT!,
  process.env.SAP_LANGUAGE || 'E'
);

async function createPackageBuiltIn() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║           CREATE PACKAGE USING BUILT-IN METHOD                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🔌 Connection Details:');
    console.log(`   URL:    ${process.env.SAP_URL}`);
    console.log(`   Client: ${process.env.SAP_CLIENT}`);
    console.log(`   User:   ${process.env.SAP_USER}`);
    console.log('');

    console.log('🔐 Logging in...');
    await client.login();
    console.log('✅ Login successful\n');

    const packageName = 'ZTEST_BUILTIN_' + Date.now().toString().slice(-6);

    console.log('─'.repeat(80));
    console.log('📋 Package Configuration');
    console.log('─'.repeat(80));
    console.log('');
    console.log('Creating package using built-in createObject method:');
    console.log(`   • Package:          ${packageName}`);
    console.log(`   • Description:      Test package via built-in API`);
    console.log(`   • Type:             DEVC/K (package)`);
    console.log(`   • Parent:           $TMP`);
    console.log(`   • Responsible:      ${process.env.RESPONSIBLE || 'username'}`);
    console.log(`   • Software:         HOME`);
    console.log(`   • Transport Layer:  (empty for $TMP)`);
    console.log(`   • Transport Request: (empty for $TMP)`);
    console.log('');

    console.log('─'.repeat(80));
    console.log('📋 Creating Package...');
    console.log('─'.repeat(80));
    console.log('');

    // Use the built-in createObject method
    // For packages, we need NewPackageOptions which includes swcomp, packagetype, transportLayer
    await client.createObject({
      objtype: 'DEVC/K',
      name: packageName,
      parentName: '$TMP',
      description: 'Test package via built-in API',
      responsible: process.env.RESPONSIBLE || 'username',
      transport: '',  // Empty for $TMP
      swcomp: 'HOME',  // Must be truthy for the validation check
      packagetype: 'development',
      transportLayer: ''  // Empty for local objects
    });

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                 PACKAGE CREATION SUCCESSFUL! ✓                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Package ${packageName} has been created successfully!`);
    console.log('');
    console.log('Next steps:');
    console.log('   • View the package in SAP GUI (transaction SE80)');
    console.log('   • Add development objects to the package');
    console.log('   • Since it\'s under $TMP, no transport is needed');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('─'.repeat(80));
    console.error('❌ PACKAGE CREATION FAILED');
    console.error('─'.repeat(80));
    console.error('');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack.substring(0, 500));
    }

    process.exit(1);
  }
}

createPackageBuiltIn();
