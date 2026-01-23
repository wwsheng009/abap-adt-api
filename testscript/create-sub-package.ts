#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import {
  validatePackage,
  getPackage
} from '../src/api/packages';
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

async function createSubPackage() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║              CREATE SUB-PACKAGE UNDER ZTEST_049263                ║');
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

    const parentPackage = 'ZTEST_049263';
    const subPackageName = 'ZTEST_SUB_' + Date.now().toString().slice(-6);
    const transportLayer = 'ZS4H';
    const transportRequest = process.env.TRANSPORT_REQUEST || '';
    const softwareComponent = 'HOME';

    console.log('─'.repeat(80));
    console.log('📋 Sub-Package Configuration');
    console.log('─'.repeat(80));
    console.log('');
    console.log('Creating sub-package under ZTEST_049263:');
    console.log(`   • Package:          ${subPackageName}`);
    console.log(`   • Parent:           ${parentPackage}`);
    console.log(`   • Description:      Sub-package for testing`);
    console.log(`   • Type:             development`);
    console.log(`   • Software:         ${softwareComponent}`);
    console.log(`   • Transport Layer:  ${transportLayer}`);
    console.log(`   • Responsible:      username`);
    console.log(`   • Transport Request: ${transportRequest}`);
    console.log('');

    // Validate first
    console.log('─'.repeat(80));
    console.log('📋 STEP 1: Validate Sub-Package Configuration');
    console.log('─'.repeat(80));
    console.log('');

    const validation = await validatePackage(client.httpClient, {
      objname: subPackageName,
      description: 'Sub-package for testing',
      packagetype: 'development',
      swcomp: softwareComponent,
      appcomp: '',
      checkmode: 'full'
    });

    console.log(`✅ Validation Result: ${validation.success ? '✓ VALID' : '✗ INVALID'}`);
    if (validation.messages.length > 0) {
      console.log('\n   Validation Messages:');
      validation.messages.forEach(msg => {
        const icon = msg.severity === 'success' ? '✓' : msg.severity === 'error' ? '✗' : 'ℹ';
        console.log(`      ${icon} [${msg.severity.toUpperCase()}] ${msg.text}`);
      });
    }
    console.log('');

    if (!validation.success) {
      throw new Error('Sub-package validation failed');
    }

    // Create the sub-package
    console.log('─'.repeat(80));
    console.log('📋 STEP 2: Create Sub-Package');
    console.log('─'.repeat(80));
    console.log('');
    console.log(`   Creating sub-package ${subPackageName} under ${parentPackage}...`);
    console.log('');

    // Use the built-in createObject method with parentName set to ZTEST_049263
    await client.createObject({
      objtype: 'DEVC/K',
      name: subPackageName,
      parentName: parentPackage,  // Create under ZTEST_049263
      description: 'Sub-package for testing',
      responsible: 'username',
      transport: transportRequest,
      swcomp: softwareComponent,
      packagetype: 'development',
      transportLayer: transportLayer
    });

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║              SUB-PACKAGE CREATION SUCCESSFUL! ✓                ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Sub-package ${subPackageName} has been created successfully!`);
    console.log('');
    console.log('Package Structure:');
    console.log(`   ZTEST_049263`);
    console.log(`   └── ${subPackageName}`);
    console.log('');
    console.log('Next steps:');
    console.log('   • View in SAP GUI (SE80)');
    console.log('   • Add objects to the sub-package');
    console.log('   • Transport request: ' + transportRequest);
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('─'.repeat(80));
    console.error('❌ SUB-PACKAGE CREATION FAILED');
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

createSubPackage();
