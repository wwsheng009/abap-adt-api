#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import {
  createPackage,
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

async function createTmpPackage() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║           CREATE $TMP PACKAGE (NO TRANSPORT NEEDED)              ║');
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

    // Use $TMP which doesn't need transport layer
    const packageName = 'ZTEST_TMP_' + Date.now().toString().slice(-6);
    const parentPackage = '$TMP';

    console.log('─'.repeat(80));
    console.log('📋 Package Configuration');
    console.log('─'.repeat(80));
    console.log('');
    console.log('Creating package under $TMP (local objects, no transport needed):');
    console.log(`   • Package:          ${packageName}`);
    console.log(`   • Parent:           ${parentPackage}`);
    console.log(`   • Description:      Test package created via ADT API`);
    console.log(`   • Type:             development`);
    console.log(`   • Software:         HOME`);
    console.log(`   • App Component:    HOME`);
    console.log(`   • Responsible:      ${process.env.RESPONSIBLE || 'username'}`);
    console.log('');

    // Validate
    console.log('─'.repeat(80));
    console.log('📋 STEP 1: Validate Package');
    console.log('─'.repeat(80));
    console.log('');

    const validation = await validatePackage(client.httpClient, {
      objname: packageName,
      description: 'Test package created via ADT API',
      packagetype: 'development',
      swcomp: 'HOME',
      appcomp: 'HOME',
      checkmode: 'full'
    });

    console.log(`✅ Validation Result: ${validation.success ? '✓ VALID' : '✗ INVALID'}`);
    if (validation.messages.length > 0) {
      console.log('\n   Messages:');
      validation.messages.forEach(msg => {
        const icon = msg.severity === 'success' ? '✓' : msg.severity === 'error' ? '✗' : 'ℹ';
        console.log(`      ${icon} [${msg.severity.toUpperCase()}] ${msg.text}`);
      });
    }
    console.log('');

    if (!validation.success) {
      throw new Error('Package validation failed');
    }

    // Create package (no transport needed for $TMP)
    console.log('─'.repeat(80));
    console.log('📋 STEP 2: Create Package (under $TMP)');
    console.log('─'.repeat(80));
    console.log('');
    console.log(`   Creating package ${packageName} under ${parentPackage}...`);
    console.log('   Note: No transport request needed for $TMP packages');
    console.log('');

    const result = await createPackage(
      client.httpClient,
      {
        name: packageName,
        description: 'Test package created via ADT API',
        packageType: 'development',
        softwareComponent: 'HOME',
        transportLayer: '',  // Empty for $TMP
        applicationComponent: 'HOME',
        responsible: process.env.RESPONSIBLE || 'username'
      }
      // No corrNr needed for $TMP packages
    );

    console.log('✅ Package Created Successfully!');
    console.log('');
    console.log('─'.repeat(80));
    console.log('Created Package Details:');
    console.log('─'.repeat(80));
    console.log(`   Name:        ${result.package.name}`);
    console.log(`   Description: ${result.package.description}`);
    console.log(`   Type:        ${result.package.packageType}`);
    console.log(`   Software:    ${result.package.softwareComponent}`);
    console.log(`   Transport:   ${result.package.transportLayer || '(none - $TMP package)'}`);
    if (result.package.applicationComponent) {
      console.log(`   App Comp:    ${result.package.applicationComponent}`);
    }
    if (result.package.responsible) {
      console.log(`   Responsible: ${result.package.responsible}`);
    }
    if (result.package.etag) {
      console.log(`   ETag:        ${result.package.etag.substring(0, 50)}...`);
    }
    console.log(`   Location:    ${result.location}`);
    console.log('');

    // Verify by reading
    console.log('─'.repeat(80));
    console.log('📋 STEP 3: Verify Package');
    console.log('─'.repeat(80));
    console.log('');
    console.log(`   Reading package ${packageName} to verify...`);

    const verifyPackage = await getPackage(client.httpClient, packageName);

    console.log('✅ Package Verified!');
    console.log('');
    console.log(`   Name:        ${verifyPackage.name}`);
    console.log(`   Description: ${verifyPackage.description}`);
    console.log(`   Type:        ${verifyPackage.packageType}`);
    console.log('');

    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                 PACKAGE CREATION SUCCESSFUL! ✓                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Package ${packageName} has been created successfully under $TMP!`);
    console.log('');
    console.log('Notes:');
    console.log('   • $TMP packages are local objects and don\'t need transports');
    console.log('   • You can view the package in SAP GUI (SE80)');
    console.log('   • Objects in $TMP cannot be transported to other systems');
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

createTmpPackage();
