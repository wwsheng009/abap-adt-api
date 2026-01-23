#!/usr/bin/env tsx

import { ADTClient, session_types } from '../index';

const client = new ADTClient(
  process.env.SAP_URL!,
  process.env.SAP_USER!,
  process.env.SAP_PASSWORD!,
  process.env.SAP_CLIENT || '100',
  process.env.SAP_LANGUAGE || 'E'
);

client.stateful = session_types.stateful;

const packages = [
  'ZJG_AI',
  'ZJG_AI_BASE',
  'ZJG_AI_GATEWAY',
  'ZJG_AI_MODELS',
  'ZJG_AI_SERVICES',
  'ZJG_AI_INTERCEPTOR'
];

async function verify() {
  try {
    await client.login();
    console.log('✅ Login successful\n');

    const clone = client.statelessClone;

    console.log('🔍 Checking ZJG_AI packages:\n');
    console.log('='.repeat(60));

    for (const pkg of packages) {
      const result = await clone.searchObject(pkg, 'DEVC/K', 1);

      if (result.length > 0) {
        const p = result[0];
        console.log(`✅ ${pkg}`);
        console.log(`   Description: ${p['adtcore:description'] || '(empty)'}`);
        console.log(`   URI: ${p['adtcore:uri']}`);
      } else {
        console.log(`❌ ${pkg} - NOT FOUND`);
      }
      console.log('');
    }

    console.log('='.repeat(60));

    // Also check using wildcard search
    console.log('\n🔍 Wildcard search for "ZJG_AI*":\n');
    const allResults = await clone.searchObject('ZJG_AI*', 'DEVC/K', 20);

    console.log(`Found ${allResults.length} packages:\n`);
    allResults.forEach((p: any) => {
      console.log(`  - ${p['adtcore:name']}`);
    });

    await client.logout();
    console.log('\n👋 Verification complete');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

verify();
