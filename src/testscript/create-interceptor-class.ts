#!/usr/bin/env tsx

import { ADTClient, session_types } from '../index';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const client = new ADTClient(
  process.env.SAP_URL!,
  process.env.SAP_USER!,
  process.env.SAP_PASSWORD!,
  process.env.SAP_CLIENT || '100',
  process.env.SAP_LANGUAGE || 'E'
);

client.stateful = session_types.stateful;

async function main() {
  try {
    await client.login();
    console.log('✅ Login successful\n');

    // Read class source
    const classSource = readFileSync(
      resolve('../abap-ai/docs/http-interception/ZJG_ADT_REQUEST_INTERCEPTOR.clas.abap'),
      'utf-8'
    );

    console.log('📝 Creating class ZJG_ADT_REQUEST_INTERCEPTOR...\n');

    // Create class object
    await client.createObject({
      objtype: 'CLAS/OC',
      name: 'ZJG_ADT_REQUEST_INTERCEPTOR',
      parentName: '$TMP',
      description: 'ADT HTTP Request Interceptor',
      parentPath: '/sap/bc/adt/packages/$TMP',
      responsible: 'SAP',
      transport: ''
    });

    console.log('✅ Class object created\n');

    console.log('📤 Setting source code...\n');

    // Set main source code
    await client.setObjectSource(
      '/sap/bc/adt/oo/classes/zjg_adt_request_interceptor/source/main',
      classSource,
      ''
    );

    console.log('✅ Source code set successfully!\n');
    console.log('✅ Class ZJG_ADT_REQUEST_INTERCEPTOR created successfully!');
    console.log('\nNext steps:');
    console.log('1. Activate the class in SE80');
    console.log('2. Create BAdI implementation in SE19');

    await client.logout();
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
