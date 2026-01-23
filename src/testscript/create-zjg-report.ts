#!/usr/bin/env tsx

/**
 * Create ZJG HTTP Request Log Report
 */

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

    // Read the report source code
    const reportSource = readFileSync(
      resolve('../abap-ai/docs/http-interception/ZJG_DISPLAY_HTTP_LOG.prog.abap'),
      'utf-8'
    );

    console.log('📝 Creating report ZJG_DISPLAY_HTTP_LOG...');

    await client.createObject(
      'PROG/P',           // objtype for program
      'ZJG_DISPLAY_HTTP_LOG',  // name
      '$TMP',             // parentName
      'Display HTTP ADT Request Log',  // description
      '/sap/bc/adt/programs',  // parentPath
      'SAP',              // responsible
      ''                  // transport
    );

    console.log('✅ Report created!\n');

    console.log('📤 Setting source code...');
    await client.setObjectSource(
      '/sap/bc/adt/programs/zjg_display_http_log/source/main',
      reportSource,
      ''
    );

    console.log('✅ Source code set!\n');

    console.log('✅ Report ZJG_DISPLAY_HTTP_LOG created successfully!');
    console.log('You can now run it with transaction SA38 or SE38');

    await client.logout();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
