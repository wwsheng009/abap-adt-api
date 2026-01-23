#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import { getDumps } from '../src/api/runtime';
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

async function testGetDumps() {
  try {
    console.log('🔌 Connecting to SAP system...');
    console.log(`   URL: ${process.env.SAP_URL}`);
    console.log(`   Client: ${process.env.SAP_CLIENT}`);
    console.log(`   User: ${process.env.SAP_USER}`);
    console.log('');

    console.log('🔐 Logging in...');
    await client.login();
    console.log('✅ Login successful\n');

    console.log('📊 Fetching runtime dumps...\n');

    // First, let's make a raw request to see what we get
    console.log('🔍 Making raw HTTP request to debug...');
    const response = await (client.httpClient as any).request('/sap/bc/adt/runtime/dumps', {
      method: 'GET',
      qs: { $top: 5, $inlinecount: 'allpages' },
      headers: {
        'Accept': 'application/atom+xml;type=feed',
        'X-sap-adt-feed': '',
        'X-sap-adt-profiling': 'server-time'
      }
    });

    console.log('📋 HTTP Status:', response.statusCode || 'unknown');
    console.log('📋 Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('📋 Raw Response Body (first 3000 chars):');
    console.log('─'.repeat(80));
    console.log(response.body ? response.body.substring(0, 3000) : '(empty body)');
    console.log('─'.repeat(80));
    console.log('');

    const result = await getDumps(client.httpClient, {
      top: 5,
      inlineCount: true
    });

    console.log('='.repeat(80));
    console.log('RUNTIME DUMPS RESULT');
    console.log('='.repeat(80));
    console.log('');
    console.log(`📋 Feed Title: ${result.title}`);
    console.log(`🔗 Feed Href: ${result.href}`);
    console.log(`📅 Last Updated: ${result.updated.toISOString()}`);
    if (result.count !== undefined) {
      console.log(`📊 Total Count: ${result.count}`);
    }
    console.log('');
    console.log(`📦 Dump Entries: ${result.dumps.length} returned`);
    console.log('');

    if (result.dumps.length > 0) {
      result.dumps.forEach((dump, index) => {
        console.log('─'.repeat(80));
        console.log(`DUMP #${index + 1}`);
        console.log('─'.repeat(80));
        console.log(`🆔 ID:           ${dump.id}`);
        console.log(`👤 Author:       ${dump.author}`);
        console.log(`📝 Title:        ${dump.title}`);
        console.log(`📄 Summary:      ${dump.summary.substring(0, 100)}...`);
        console.log(`📅 Published:    ${dump.published.toISOString()}`);
        console.log(`📅 Updated:      ${dump.updated.toISOString()}`);
        console.log(`🔗 Categories:   ${dump.categories.length}`);

        if (dump.categories.length > 0) {
          console.log(`   Categories:`);
          dump.categories.forEach(cat => {
            console.log(`      - ${cat.label} (${cat.term})`);
          });
        }

        console.log(`🔗 Links:        ${dump.links.length}`);
        if (dump.links.length > 0) {
          console.log(`   Links:`);
          dump.links.forEach(link => {
            console.log(`      - [${link.rel}] ${link.href}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('✅ No dumps found (this is good - no runtime errors!)');
    }

    console.log('='.repeat(80));
    console.log('✅ Test completed successfully!');
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

testGetDumps();
