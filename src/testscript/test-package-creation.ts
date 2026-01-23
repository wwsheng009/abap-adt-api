#!/usr/bin/env tsx

/**
 * Test script for creating SAP packages using abap-adt-api
 *
 * Usage:
 *   npx tsx test-package-creation.ts
 */

import { ADTClient, session_types } from '../index';

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env file
const envPath = resolve(process.env.ADT_ENV_PATH || '.env');
const envContent = readFileSync(envPath, 'utf-8');

// Parse .env file manually
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    envVars[key.trim()] = value;
  }
});

// Validate required variables
const required = ['SAP_URL', 'SAP_USER', 'SAP_PASSWORD'];
const missing = required.filter(key => !envVars[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

async function main() {
  console.log('🚀 Testing SAP Package Creation\n');
  console.log('📡 Configuration:');
  console.log(`  URL: ${envVars.SAP_URL}`);
  console.log(`  User: ${envVars.SAP_USER}`);
  console.log(`  Client: ${envVars.SAP_CLIENT || '100'}`);
  console.log(`  Language: ${envVars.SAP_LANGUAGE || 'E'}`);
  console.log('');

  // Create ADT client
  const client = new ADTClient(
    envVars.SAP_URL,
    envVars.SAP_USER,
    envVars.SAP_PASSWORD,
    envVars.SAP_CLIENT || '100',
    envVars.SAP_LANGUAGE || 'E'
  );

  // Use stateful session
  client.stateful = session_types.stateful;

  try {
    // Login
    console.log('🔐 Logging in...');
    await client.login();
    console.log('✅ Login successful\n');

    // Create package ZJG_AI
    console.log('📦 Creating package ZJG_AI...');

    await client.createObject(
      "DEVC/K",           // objtype
      "ZJG_AI",           // name
      "$TMP",             // parentName
      "AI Gateway - Main Package",  // description
      "/sap/bc/adt/packages/$TMP",  // parentPath
      "SAP",              // responsible
      "",                 // transport
      "LOCAL",            // swcomp (use LOCAL for $TMP parent)
      "",                 // transportLayer (empty for local)
      "development"       // packageType
    );

    console.log('✅ Package ZJG_AI created successfully!\n');

    // Test creating a sub-package
    console.log('📦 Creating sub-package ZJG_AI_BASE...');

    await client.createObject(
      "DEVC/K",
      "ZJG_AI_BASE",
      "ZJG_AI",
      "Base classes and interfaces",
      "/sap/bc/adt/packages/ZJG_AI",
      "SAP",
      "",
      "LOCAL",            // swcomp (inherit from parent)
      "",
      "development"
    );

    console.log('✅ Package ZJG_AI_BASE created successfully!\n');

    console.log('='.repeat(50));
    console.log('✅ All packages created successfully!');
    console.log('='.repeat(50));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message && error.message.includes('already exists')) {
      console.log('\n💡 Tip: The package already exists. This is not an error.');
    }
    process.exit(1);
  } finally {
    // Logout
    try {
      await client.logout();
      console.log('\n👋 Logged out');
    } catch {
      // Ignore logout errors
    }
  }
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
