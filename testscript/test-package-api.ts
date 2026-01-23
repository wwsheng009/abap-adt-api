#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import {
  getPackage,
  validatePackage,
  getTransportLayers,
  getSoftwareComponents,
  getTranslationRelevances
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

async function testPackageAPI() {
  try {
    console.log('🔌 Connecting to SAP system...');
    console.log(`   URL: ${process.env.SAP_URL}`);
    console.log(`   Client: ${process.env.SAP_CLIENT}`);
    console.log(`   User: ${process.env.SAP_USER}`);
    console.log('');

    console.log('🔐 Logging in...');
    await client.login();
    console.log('✅ Login successful\n');

    // Test 1: Get Transport Layers
    console.log('─'.repeat(80));
    console.log('TEST 1: Get Transport Layers');
    console.log('─'.repeat(80));
    const transportLayers = await getTransportLayers(client.httpClient, 'Z*');
    console.log(`✅ Found ${transportLayers.length} transport layers`);
    transportLayers.slice(0, 5).forEach(layer => {
      console.log(`   - ${layer.name}: ${layer.description}`);
    });
    console.log('');

    // Test 2: Get Software Components
    console.log('─'.repeat(80));
    console.log('TEST 2: Get Software Components');
    console.log('─'.repeat(80));
    const softwareComponents = await getSoftwareComponents(client.httpClient, 'HOME*');
    console.log(`✅ Found ${softwareComponents.length} software components`);
    softwareComponents.slice(0, 5).forEach(comp => {
      console.log(`   - ${comp.name}: ${comp.description}`);
    });
    console.log('');

    // Test 3: Get Translation Relevances
    console.log('─'.repeat(80));
    console.log('TEST 3: Get Translation Relevances');
    console.log('─'.repeat(80));
    const translationRelevances = await getTranslationRelevances(client.httpClient, 10);
    console.log(`✅ Found ${translationRelevances.length} translation relevances`);
    translationRelevances.slice(0, 5).forEach(tr => {
      console.log(`   - ${tr.name}: ${tr.description}`);
    });
    console.log('');

    // Test 4: Validate a package
    console.log('─'.repeat(80));
    console.log('TEST 4: Validate Package (ZMY_PACKAGE)');
    console.log('─'.repeat(80));
    const validationResult = await validatePackage(client.httpClient, {
      objname: 'ZMY_PACKAGE',
      description: 'Test Package',
      packagetype: 'development',
      swcomp: 'HOME',
      checkmode: 'basic'
    });
    console.log(`✅ Validation result: ${validationResult.success ? 'SUCCESS' : 'FAILED'}`);
    if (validationResult.messages.length > 0) {
      console.log(`   Messages:`);
      validationResult.messages.forEach(msg => {
        console.log(`      [${msg.severity.toUpperCase()}] ${msg.text}`);
      });
    }
    console.log('');

    // Test 5: Try to read an existing package
    console.log('─'.repeat(80));
    console.log('TEST 5: Read Package (ZPK1_CREATE1)');
    console.log('─'.repeat(80));
    try {
      const pkg = await getPackage(client.httpClient, 'ZPK1_CREATE1');
      console.log(`✅ Package found:`);
      console.log(`   Name:        ${pkg.name}`);
      console.log(`   Description: ${pkg.description}`);
      console.log(`   Type:        ${pkg.packageType}`);
      console.log(`   Software:    ${pkg.softwareComponent}`);
      console.log(`   Transport:   ${pkg.transportLayer}`);
      if (pkg.applicationComponent) {
        console.log(`   App Comp:    ${pkg.applicationComponent}`);
      }
      if (pkg.responsible) {
        console.log(`   Responsible: ${pkg.responsible}`);
      }
      if (pkg.etag) {
        console.log(`   ETag:        ${pkg.etag.substring(0, 50)}...`);
      }
    } catch (error: any) {
      console.log(`❌ Package not found: ${error.message}`);
    }
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ All Package API tests completed!');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('');
    console.error('❌ Error occurred:');
    console.error(`   Message: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

testPackageAPI();
