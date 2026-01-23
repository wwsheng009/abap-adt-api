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

async function createTestPackage() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║              CREATE PACKAGE - RETRY WITH PROPER CONFIG           ║');
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

    // Package configuration from .env
    const packageName = process.env.PACKAGE_NAME || 'ZTEST_DEMO_001';
    const transportRequest = process.env.TRANSPORT_REQUEST || '';

    console.log('─'.repeat(80));
    console.log('📋 STEP 1: Validate Package Configuration');
    console.log('─'.repeat(80));
    console.log('');
    console.log('Configuration:');
    console.log(`   • Package:          ${packageName}`);
    console.log(`   • Description:      ${process.env.PACKAGE_DESCRIPTION}`);
    console.log(`   • Type:             ${process.env.PACKAGE_TYPE}`);
    console.log(`   • Software:         ${process.env.SOFTWARE_COMPONENT}`);
    console.log(`   • Transport Layer:  ${process.env.TRANSPORT_LAYER}`);
    console.log(`   • App Component:    ${process.env.APPLICATION_COMPONENT}`);
    console.log(`   • Responsible:      ${process.env.RESPONSIBLE}`);
    console.log(`   • Transport Request: ${transportRequest || 'NOT SET'}`);
    console.log('');

    // Validate first
    const validation = await validatePackage(client.httpClient, {
      objname: packageName,
      description: process.env.PACKAGE_DESCRIPTION || 'Test Package',
      packagetype: (process.env.PACKAGE_TYPE as any) || 'development',
      swcomp: process.env.SOFTWARE_COMPONENT || 'HOME',
      appcomp: process.env.APPLICATION_COMPONENT,
      checkmode: 'full'
    });

    console.log('✅ Validation Result:');
    console.log(`   Status: ${validation.success ? '✓ VALID' : '✗ INVALID'}`);
    if (validation.messages.length > 0) {
      console.log('\n   Messages:');
      validation.messages.forEach(msg => {
        const icon = msg.severity === 'success' ? '✓' : msg.severity === 'error' ? '✗' : 'ℹ';
        console.log(`      ${icon} [${msg.severity.toUpperCase()}] ${msg.text}`);
      });
    }
    console.log('');

    // Check if transport request is configured
    if (!transportRequest) {
      console.log('─'.repeat(80));
      console.log('⚠️  WARNING: No Transport Request Configured');
      console.log('─'.repeat(80));
      console.log('');
      console.log('   A transport request is required to create a package.');
      console.log('   Please set TRANSPORT_REQUEST in your .env file.');
      console.log('');
      console.log('   Example:');
      console.log('   TRANSPORT_REQUEST=S4HK901712');
      console.log('');
      console.log('   To find available transport requests, check transaction SE09');
      console.log('   or SE01 in your SAP GUI.');
      console.log('');
      process.exit(1);
    }

    // Create the package
    console.log('─'.repeat(80));
    console.log('📋 STEP 2: Create Package');
    console.log('─'.repeat(80));
    console.log('');
    console.log(`   Creating package ${packageName}...`);
    console.log(`   Using transport request: ${transportRequest}`);
    console.log('');

    const result = await createPackage(
      client.httpClient,
      {
        name: packageName,
        description: process.env.PACKAGE_DESCRIPTION || 'Test Package',
        packageType: (process.env.PACKAGE_TYPE as any) || 'development',
        softwareComponent: process.env.SOFTWARE_COMPONENT || 'HOME',
        transportLayer: process.env.TRANSPORT_LAYER || 'ZSAP',
        applicationComponent: process.env.APPLICATION_COMPONENT,
        responsible: process.env.RESPONSIBLE
      },
      { corrNr: transportRequest }
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
    console.log(`   Transport:   ${result.package.transportLayer}`);
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

    // Verify by reading the package
    console.log('─'.repeat(80));
    console.log('📋 STEP 3: Verify Package Creation');
    console.log('─'.repeat(80));
    console.log('');
    console.log(`   Reading package ${packageName} to verify...`);

    const verifyPackage = await getPackage(client.httpClient, packageName);

    console.log('✅ Package Verified!');
    console.log('');
    console.log('   Package successfully created and readable.');
    console.log('');

    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                 PACKAGE CREATION SUCCESSFUL                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ Package ${packageName} has been created successfully!`);
    console.log('');
    console.log('Next steps:');
    console.log('   1. Use SAP GUI (SE80) to view the package');
    console.log('   2. Add objects to the package');
    console.log('   3. Release the transport request when ready');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('─'.repeat(80));
    console.error('❌ PACKAGE CREATION FAILED');
    console.error('─'.repeat(80));
    console.error('');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.message.includes('Location')) {
      console.error('Possible causes:');
      console.error('   1. Package already exists');
      console.error('   2. Invalid transport request number');
      console.error('   3. Transport request is not modifiable');
      console.error('   4. Insufficient permissions');
      console.error('');
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      console.error('Possible causes:');
      console.error('   1. Transport layer does not exist');
      console.error('   2. Software component does not exist');
      console.error('   3. Invalid package name');
      console.error('');
    } else if (error.message.includes('403') || error.message.includes('authorization')) {
      console.error('Possible causes:');
      console.error('   1. User lacks create package authorization');
      console.error('   2. User cannot use the specified transport request');
      console.error('');
    }

    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack.substring(0, 500));
    }

    process.exit(1);
  }
}

createTestPackage();
