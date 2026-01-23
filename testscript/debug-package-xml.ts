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

async function debugPackageXML() {
  try {
    console.log('🔌 Connecting to SAP system...\n');
    await client.login();
    console.log('✅ Login successful\n');

    console.log('📋 Fetching package ZPK1_CREATE1 with raw XML...\n');

    const response = await (client.httpClient as any).request(
      '/sap/bc/adt/packages/ZPK1_CREATE1',
      {
        method: 'GET',
        qs: { 'sap-client': '300' },
        headers: {
          'Accept': 'application/vnd.sap.adt.packages.v2+xml, application/vnd.sap.adt.packages.v1+xml',
          'X-sap-adt-profiling': 'server-time'
        }
      }
    );

    console.log('─'.repeat(80));
    console.log('RAW XML RESPONSE:');
    console.log('─'.repeat(80));
    console.log(response.body);
    console.log('─'.repeat(80));

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

debugPackageXML();
