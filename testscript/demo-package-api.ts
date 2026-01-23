#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import {
  getPackage,
  validatePackage,
  getTransportLayers,
  getSoftwareComponents,
  createPackage
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

async function demoPackageAPI() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║           SAP ADT PACKAGE API DEMONSTRATION                        ║');
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

    // =====================================================================
    // TEST 1: Value Help - Get Transport Layers
    // =====================================================================
    console.log('─'.repeat(80));
    console.log('📋 TEST 1: Get Transport Layers (Value Help)');
    console.log('─'.repeat(80));

    const allTransportLayers = await getTransportLayers(client.httpClient, '*');
    console.log(`✅ API Call Successful`);
    console.log(`📊 Results: ${allTransportLayers.length} transport layers found`);

    if (allTransportLayers.length > 0) {
      console.log('\n   First 5 transport layers:');
      allTransportLayers.slice(0, 5).forEach(layer => {
        console.log(`      • ${layer.name.padEnd(15)} - ${layer.description}`);
      });
    } else {
      console.log('   ℹ️  No transport layers found (might need different permissions)');
    }
    console.log('');

    // =====================================================================
    // TEST 2: Value Help - Get Software Components
    // =====================================================================
    console.log('─'.repeat(80));
    console.log('📋 TEST 2: Get Software Components (Value Help)');
    console.log('─'.repeat(80));

    const allSoftwareComponents = await getSoftwareComponents(client.httpClient, '*');
    console.log(`✅ API Call Successful`);
    console.log(`📊 Results: ${allSoftwareComponents.length} software components found`);

    if (allSoftwareComponents.length > 0) {
      console.log('\n   First 5 software components:');
      allSoftwareComponents.slice(0, 5).forEach(comp => {
        console.log(`      • ${comp.name.padEnd(15)} - ${comp.description}`);
      });
    } else {
      console.log('   ℹ️  No software components found');
    }
    console.log('');

    // =====================================================================
    // TEST 3: Validate Package Configuration (Basic Mode)
    // =====================================================================
    console.log('─'.repeat(80));
    console.log('📋 TEST 3: Validate Package Configuration (Basic Mode)');
    console.log('─'.repeat(80));

    console.log('\n   Validating package ZTEST_DEMO_001...');
    console.log('   Configuration:');
    console.log('      • Package:     ZTEST_DEMO_001');
    console.log('      • Description: Test Package for API Demo');
    console.log('      • Type:        development');
    console.log('      • Software:    HOME');
    console.log('      • Check mode:  basic');

    const basicValidation = await validatePackage(client.httpClient, {
      objname: 'ZTEST_DEMO_001',
      description: 'Test Package for API Demo',
      packagetype: 'development',
      swcomp: 'HOME',
      checkmode: 'basic'
    });

    console.log(`\n✅ Validation Result: ${basicValidation.success ? '✓ VALID' : '✗ INVALID'}`);

    if (basicValidation.messages.length > 0) {
      console.log('\n   Validation Messages:');
      basicValidation.messages.forEach(msg => {
        const icon = msg.severity === 'success' ? '✓' : msg.severity === 'error' ? '✗' : 'ℹ';
        console.log(`      ${icon} [${msg.severity.toUpperCase()}] ${msg.text}`);
      });
    }
    console.log('');

    // =====================================================================
    // TEST 4: Validate Package Configuration (Full Mode)
    // =====================================================================
    console.log('─'.repeat(80));
    console.log('📋 TEST 4: Validate Package Configuration (Full Mode)');
    console.log('─'.repeat(80));

    console.log('\n   Validating package ZTEST_DEMO_001 (full validation)...');

    const fullValidation = await validatePackage(client.httpClient, {
      objname: 'ZTEST_DEMO_001',
      description: 'Test Package for API Demo',
      packagetype: 'development',
      swcomp: 'HOME',
      appcomp: 'HOME',
      checkmode: 'full'
    });

    console.log(`\n✅ Validation Result: ${fullValidation.success ? '✓ VALID' : '✗ INVALID'}`);

    if (fullValidation.messages.length > 0) {
      console.log('\n   Validation Messages:');
      fullValidation.messages.forEach(msg => {
        const icon = msg.severity === 'success' ? '✓' : msg.severity === 'error' ? '✗' : 'ℹ';
        console.log(`      ${icon} [${msg.severity.toUpperCase()}] ${msg.text}`);
      });
    }
    console.log('');

    // =====================================================================
    // TEST 5: Try to Create a Package
    // =====================================================================
    console.log('─'.repeat(80));
    console.log('📋 TEST 5: Create Package (Attempt)');
    console.log('─'.repeat(80));

    console.log('\n   Attempting to create package ZTEST_DEMO_001...');
    console.log('   Configuration:');
    console.log('      • Package:     ZTEST_DEMO_001');
    console.log('      • Description: Test Package for API Demo');
    console.log('      • Type:        development');
    console.log('      • Software:    HOME');
    console.log('      • Transport:   ZSAP');
    console.log('      • Request:     ' + (process.env.TRANSPORT_REQUEST || 'N/A'));

    try {
      const createResult = await createPackage(
        client.httpClient,
        {
          name: 'ZTEST_DEMO_001',
          description: 'Test Package for API Demo',
          packageType: 'development',
          softwareComponent: 'HOME',
          transportLayer: 'ZSAP',
          applicationComponent: 'HOME',
          responsible: 'username'
        },
        { corrNr: process.env.TRANSPORT_REQUEST || '' }
      );

      console.log(`\n✅ Package Created Successfully!`);
      console.log(`   Location: ${createResult.location}`);
      console.log(`\n   Package Details:`);
      console.log(`      • Name:        ${createResult.package.name}`);
      console.log(`      • Description: ${createResult.package.description}`);
      console.log(`      • Type:        ${createResult.package.packageType}`);
      if (createResult.package.etag) {
        console.log(`      • ETag:        ${createResult.package.etag.substring(0, 40)}...`);
      }
    } catch (createError: any) {
      console.log(`\n⚠️  Package Creation Failed`);
      console.log(`   Reason: ${createError.message}`);
      console.log(`   ℹ️  This is expected if:`);
      console.log(`      - Package already exists`);
      console.log(`      - No valid transport request configured`);
      console.log(`      - Insufficient permissions`);
    }
    console.log('');

    // =====================================================================
    // SUMMARY
    // =====================================================================
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                      SUMMARY                                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('✅ All Package API functions demonstrated:');
    console.log('');
    console.log('   1. ✓ getTransportLayers()    - Get available transport layers');
    console.log('   2. ✓ getSoftwareComponents()  - Get available software components');
    console.log('   3. ✓ validatePackage()        - Basic validation mode');
    console.log('   4. ✓ validatePackage()        - Full validation mode');
    console.log('   5. ✓ createPackage()          - Create new package');
    console.log('');
    console.log('📚 API Features Available:');
    console.log('');
    console.log('   • Value help for transport layers');
    console.log('   • Value help for software components');
    console.log('   • Value help for translation relevances');
    console.log('   • Package validation (basic and full modes)');
    console.log('   • Package creation with XML body');
    console.log('   • Package reading with ETag caching support');
    console.log('   • Object properties retrieval');
    console.log('');
    console.log('🔗 All functions are properly typed and exported from:');
    console.log('   src/api/packages.ts');
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║              DEMONSTRATION COMPLETE                             ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');

  } catch (error: any) {
    console.error('');
    console.error('❌ Error occurred:');
    console.error(`   Message: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.substring(0, 500)}`);
    }
    process.exit(1);
  }
}

demoPackageAPI();
