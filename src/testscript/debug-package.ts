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

async function test() {
  try {
    await client.login();
    console.log('✅ Login successful');
    console.log(`   URL: ${process.env.SAP_URL}`);
    console.log(`   User: ${process.env.SAP_USER}\n`);

    // Try to search for existing packages
    const searchResult = await client.statelessClone.searchObject('TEST_PACKAGE_001', 'DEVC/K', 1);
    console.log('🔍 Search for TEST_PACKAGE_001:');
    console.log(`   Found: ${searchResult.length > 0 ? 'YES' : 'NO'}\n`);

    // Try to create a test package
    console.log('📦 Creating TEST_PACKAGE_001...');

    await client.createObject(
      'DEVC/K',
      'TEST_PACKAGE_001',
      '$TMP',
      'Test package for debugging',
      '/sap/bc/adt/packages/$TMP',
      'SAP',
      '',
      'LOCAL',
      '',
      'development'
    );

    console.log('✅ Package created successfully!\n');

    // Verify it exists
    console.log('🔍 Verifying package exists...');
    const verifyResult = await client.statelessClone.searchObject('TEST_PACKAGE_001', 'DEVC/K', 1);
    console.log(`   Found: ${verifyResult.length > 0 ? 'YES' : 'NO'}`);

    if (verifyResult.length > 0) {
      console.log(`   Details:`);
      console.log(JSON.stringify(verifyResult[0], null, 2));
    }

    await client.logout();
    console.log('\n👋 Test completed successfully');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
