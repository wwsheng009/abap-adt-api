#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import { getTransportLayers } from '../src/api/packages';
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

async function findTransportLayers() {
  try {
    console.log('🔌 Connecting to SAP system...\n');
    await client.login();
    console.log('✅ Login successful\n');

    console.log('─'.repeat(80));
    console.log('🔍 Searching for Available Transport Layers');
    console.log('─'.repeat(80));
    console.log('');

    // Try different patterns
    const patterns = ['*', 'S*', 'Z*', 'Y*'];

    for (const pattern of patterns) {
      console.log(`Searching with pattern: "${pattern}"`);
      const layers = await getTransportLayers(client.httpClient, pattern);

      if (layers.length > 0) {
        console.log(`✅ Found ${layers.length} transport layers:`);
        layers.forEach(layer => {
          console.log(`   • ${layer.name.padEnd(20)} - ${layer.description}`);
        });
        console.log('');
      } else {
        console.log(`   No layers found`);
        console.log('');
      }
    }

    console.log('─'.repeat(80));
    console.log('📋 Recommendation');
    console.log('─'.repeat(80));
    console.log('');
    console.log('Update your .env file with a valid transport layer:');
    console.log('');
    console.log('TRANSPORT_LAYER=<valid_layer_from_above>');
    console.log('');

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

findTransportLayers();
