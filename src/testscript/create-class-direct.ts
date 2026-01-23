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

    // Use HTTP client directly to create class
    const http = client.httpClient;

    // Build XML payload for class creation
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<class:abapClass xmlns:class="http://www.sap.com/adt/oo/classes" xmlns:adtcore="http://www.sap.com/adt/core">
  <adtcore:description>ADT HTTP Request Interceptor</adtcore:description>
  <adtcore:responsible>SAP</adtcore:responsible>
  <adtcore:packageName>$TMP</adtcore:packageName>
  <adtcore:active>inactive</adtcore:active>
  <adtcore:final>true</adtcore:final>
  <adtcore:softwareComponent>LOCAL</adtcore:softwareComponent>
  <class:friends/>
  <class:includes>
    <class:include abapClassInclude="ccdef" type="ccdef"/>
    <class:include abapClassInclude="ccmac" type="ccmac"/>
    <class:include abapClassInclude="ci" type="public"/>
    <class:include abapClassInclude="co" type="protected"/>
    <class:include abapClassInclude="cu" type="private"/>
  </class:includes>
</class:abapClass>`;

    const headers = {
      'Content-Type': 'application/vnd.sap.adt.classes.v1+xml',
      'Accept': 'application/vnd.sap.adt.classes.v1+xml'
    };

    console.log('📤 Sending class creation request...\n');

    const response = await http.request(
      '/sap/bc/adt/oo/classes',
      {
        method: 'POST',
        headers,
        body: xml
      }
    );

    console.log(`Status: ${response.status}\n`);

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Class created successfully!\n');

      // Now set the source code
      console.log('📤 Setting source code...\n');

      await client.setObjectSource(
        '/sap/bc/adt/oo/classes/zjg_adt_request_interceptor/source/main',
        classSource,
        ''
      );

      console.log('✅ Source code set successfully!\n');
      console.log('✅ Class ZJG_ADT_REQUEST_INTERCEPTOR created!');
      console.log('\n⚠️  Remember to activate the class in SE80');
    } else {
      console.log(`❌ Failed to create class`);
      console.log(`Response: ${response.body}`);
    }

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
