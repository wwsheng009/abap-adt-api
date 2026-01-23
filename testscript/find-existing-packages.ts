#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import { searchObject } from '../src/index';
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

async function findExistingPackages() {
  try {
    console.log('🔌 Connecting to SAP system...\n');
    await client.login();
    console.log('✅ Login successful\n');

    console.log('🔍 Searching for existing packages...\n');

    // Search for packages starting with Z
    const results = await client.searchObject('Z*', 'DEVC/K', 50);

    console.log(`✅ Found ${results.length} packages starting with Z\n`);

    if (results.length > 0) {
      console.log('─'.repeat(80));
      console.log('First 10 packages:');
      console.log('─'.repeat(80));

      results.slice(0, 10).forEach((pkg: any, index: number) => {
        console.log(`\n${index + 1}. ${pkg['adtcore:name']}`);
        console.log(`   Description: ${pkg['adtcore:description'] || '(no description)'}`);
        console.log(`   Type: ${pkg['adtcore:type']}`);
        console.log(`   URI: ${pkg['adtcore:uri']}`);

        // Try to get more details
        if (pkg['adtcore:uri']) {
          console.log(`   Full URI available: Yes`);
        }
      });

      // Find a package under $TMP if possible
      const tmpPackages = results.filter((p: any) =>
        p['adtcore:uri'] && p['adtcore:uri'].includes('/$TMP/')
      );

      if (tmpPackages.length > 0) {
        console.log('\n');
        console.log('─'.repeat(80));
        console.log('Packages under $TMP:');
        console.log('─'.repeat(80));
        tmpPackages.slice(0, 5).forEach((pkg: any) => {
          console.log(`   • ${pkg['adtcore:name']}`);
        });
      }
    } else {
      console.log('❌ No Z packages found');
      console.log('\nTrying search with pattern *...\n');

      // Try with wildcard
      const allResults = await client.searchObject('*', 'DEVC/K', 20);
      console.log(`✅ Found ${allResults.length} total packages`);

      if (allResults.length > 0) {
        console.log('\nFirst 10 packages:');
        allResults.slice(0, 10).forEach((pkg: any, index: number) => {
          console.log(`   ${index + 1}. ${pkg['adtcore:name']}`);
        });
      }
    }

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

findExistingPackages();
