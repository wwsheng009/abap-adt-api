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

async function searchPackages() {
  try {
    console.log('🔌 Connecting to SAP system...\n');
    await client.login();
    console.log('✅ Login successful\n');

    console.log('🔍 Searching for packages starting with Z...\n');

    // Use searchObject to find packages
    const results = await client.searchObject('Z*', 'DEVC/K', 20);

    console.log('─'.repeat(80));
    console.log(`✅ Found ${results.length} packages`);
    console.log('─'.repeat(80));

    if (results.length > 0) {
      results.slice(0, 10).forEach((pkg: any, index: number) => {
        console.log(`\n${index + 1}. ${pkg['adtcore:name'] || pkg.name || 'Unknown'}`);
        console.log(`   Description: ${pkg['adtcore:description'] || '(no description)'}`);
        console.log(`   URI: ${pkg['adtcore:uri'] || pkg.href || 'no uri'}`);
      });

      // Try to read the first package
      if (results.length > 0) {
        const firstPkgName = results[0]['adtcore:name'];
        console.log('\n');
        console.log('─'.repeat(80));
        console.log(`📋 Reading first package: ${firstPkgName}`);
        console.log('─'.repeat(80));

        const response = await (client.httpClient as any).request(
          `/sap/bc/adt/packages/${firstPkgName}`,
          {
            method: 'GET',
            qs: { 'sap-client': '300' },
            headers: {
              'Accept': 'application/vnd.sap.adt.packages.v2+xml, application/vnd.sap.adt.packages.v1+xml',
              'X-sap-adt-profiling': 'server-time'
            }
          }
        );

        console.log('\nRAW XML RESPONSE:');
        console.log('─'.repeat(80));
        console.log(response.body || '(empty body)');
        console.log('─'.repeat(80));
        console.log('\nHEADERS:');
        console.log(JSON.stringify(response.headers, null, 2));
      }
    } else {
      console.log('❌ No packages found');
    }

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

searchPackages();
