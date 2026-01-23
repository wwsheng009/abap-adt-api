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

async function checkEndpoints() {
  try {
    console.log('🔌 Connecting to SAP system...');
    console.log(`   URL: ${process.env.SAP_URL}`);
    console.log(`   Client: ${process.env.SAP_CLIENT}`);
    console.log(`   User: ${process.env.SAP_USER}`);
    console.log('');

    console.log('🔐 Logging in...');
    await client.login();
    console.log('✅ Login successful\n');

    // Check ADT discovery
    console.log('🔍 Checking ADT discovery...');
    const discovery = await client.adtDiscovery();

    console.log(`✅ Found ${discovery.length} ADT features\n`);

    // Look for runtime-related features
    console.log('📊 Runtime-related features:');
    console.log('─'.repeat(80));
    const runtimeFeatures = discovery.filter(d =>
      d.title.toLowerCase().includes('runtime') ||
      d.title.toLowerCase().includes('dump') ||
      d.href.includes('runtime')
    );

    if (runtimeFeatures.length > 0) {
      runtimeFeatures.forEach(f => {
        console.log(`   Title: ${f.title}`);
        console.log(`   Href:  ${f.href}`);
        console.log(`   Type:  ${f.type}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No runtime/dump features found');
    }

    // List all features
    console.log('');
    console.log('📋 All available ADT features:');
    console.log('─'.repeat(80));
    discovery.forEach(f => {
      console.log(`   ${f.title.padEnd(40)} | ${f.href}`);
    });

    console.log('');
    console.log('='.repeat(80));
    console.log('✅ Discovery completed!');
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

checkEndpoints();
