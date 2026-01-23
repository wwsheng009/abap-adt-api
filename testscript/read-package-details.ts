#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import { getPackage } from '../src/api/packages';
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

async function readPackageDetails() {
  try {
    console.log('🔌 Connecting to SAP system...\n');
    await client.login();
    console.log('✅ Login successful\n');

    // Try to read a few Z packages to see their configuration
    const testPackages = ['Z001', 'Z01', 'ZABAP-PROMETHEUS'];

    for (const pkgName of testPackages) {
      console.log('─'.repeat(80));
      console.log(`Reading package: ${pkgName}`);
      console.log('─'.repeat(80));

      try {
        const pkg = await getPackage(client.httpClient, pkgName);
        console.log(`✅ Package found:`);
        console.log(`   Name:              ${pkg.name}`);
        console.log(`   Description:       ${pkg.description}`);
        console.log(`   Type:              ${pkg.packageType}`);
        console.log(`   Software:          ${pkg.softwareComponent || '(not set)'}`);
        console.log(`   Transport Layer:   ${pkg.transportLayer || '(not set)'}`);
        console.log(`   App Component:     ${pkg.applicationComponent || '(not set)'}`);
        console.log(`   Responsible:       ${pkg.responsible || '(not set)'}`);
        console.log(`   Translation:        ${pkg.translationRelevance || '(not set)'}`);
        if (pkg.etag) {
          console.log(`   ETag:              ${pkg.etag.substring(0, 50)}...`);
        }
      } catch (error: any) {
        console.log(`❌ Error reading package: ${error.message}`);
      }
      console.log('');
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

readPackageDetails();
