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

async function createPackageNoSwcomp() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║           CREATE PACKAGE (NO SOFTWARE COMPONENT)                    ║');
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

    const packageName = 'ZTEST_' + Date.now().toString().slice(-6);
    const transportLayer = 'ZS4H';
    const transportRequest = process.env.TRANSPORT_REQUEST || '';

    console.log('─'.repeat(80));
    console.log('📋 Package Configuration');
    console.log('─'.repeat(80));
    console.log('');
    console.log('Creating package with correct configuration:');
    console.log(`   • Package:          ${packageName}`);
    console.log(`   • Description:      Test package via API`);
    console.log(`   • Type:             development`);
    console.log(`   • Software:         HOME`);
    console.log(`   • Transport Layer:  ${transportLayer}`);
    console.log(`   • Parent:           (not under $TMP)`);
    console.log(`   • Responsible:      username`);
    console.log(`   • Transport Request: ${transportRequest}`);
    console.log('');

    console.log('─'.repeat(80));
    console.log('📋 Creating Package...');
    console.log('─'.repeat(80));
    console.log('');

    // Use the built-in createObject method
    // Don't specify parentName - let SAP determine it based on transport layer
    await client.createObject({
      objtype: 'DEVC/K',
      name: packageName,
      parentName: '',  // Empty - will be determined by transport layer/software component
      description: 'Test package via API',
      responsible: 'username',
      transport: transportRequest,
      swcomp: 'HOME',
      packagetype: 'development',
      transportLayer: transportLayer
    });

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                 PACKAGE CREATION SUCCESSFUL! ✓                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Package ${packageName} has been created successfully!`);
    console.log('');
    console.log('Details:');
    console.log(`   • Package: ${packageName}`);
    console.log(`   • Transport Layer: ${transportLayer}`);
    console.log(`   • Transport Request: ${transportRequest}`);
    console.log('');
    console.log('Next steps:');
    console.log('   • View in SAP GUI (SE80)');
    console.log('   • Add objects to the package');
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

createPackageNoSwcomp();
