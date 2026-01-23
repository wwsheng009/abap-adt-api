#!/usr/bin/env tsx

import axios from 'axios';
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

const SAP_URL = process.env.SAP_URL || 'http://HOST:PORT';
const SAP_USER = process.env.SAP_USER || 'username';
const SAP_PASSWORD = process.env.SAP_PASSWORD || 'username';
const SAP_CLIENT = process.env.SAP_CLIENT || '300';

interface DebugLogEntry {
  timestamp?: string;
  id?: string;
  detail_url?: string;
  [key: string]: any;
}

async function analyzeDebugLogs() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║              SAP ADT Debug Log Analysis Tool                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🔌 Connection Details:');
    console.log(`   URL:    ${SAP_URL}`);
    console.log(`   Client: ${SAP_CLIENT}`);
    console.log(`   User:   ${SAP_USER}`);
    console.log('');

    // Create axios instance with auth
    const api = axios.create({
      baseURL: SAP_URL,
      auth: {
        username: SAP_USER,
        password: SAP_PASSWORD
      },
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });

    // Step 1: Get debug log list
    console.log('─'.repeat(80));
    console.log('📋 STEP 1: Fetching Debug Log List');
    console.log('─'.repeat(80));
    console.log('');

    const debugUrl = '/debug/adt';
    console.log(`Fetching: ${debugUrl}?sap-client=${SAP_CLIENT}`);
    console.log('');

    const response = await api.get(debugUrl, {
      params: {
        'sap-client': SAP_CLIENT
      }
    });

    console.log(`Response Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log('');

    // Parse response
    let logList: any = response.data;

    // Step 2: Analyze log list structure
    console.log('─'.repeat(80));
    console.log('📋 STEP 2: Analyzing Log List Structure');
    console.log('─'.repeat(80));
    console.log('');

    if (Array.isArray(logList)) {
      console.log(`✅ Found ${logList.length} log entries`);
      console.log('');

      if (logList.length > 0) {
        console.log('Sample entry structure:');
        console.log(JSON.stringify(logList[0], null, 2));
        console.log('');

        // Step 3: Display log list summary
        console.log('─'.repeat(80));
        console.log('📋 STEP 3: Log List Summary');
        console.log('─'.repeat(80));
        console.log('');

        logList.slice(0, 10).forEach((entry: any, index: number) => {
          console.log(`[${index + 1}] Entry:`);
          console.log(`   Timestamp: ${entry.timestamp || entry.time || entry.created || 'N/A'}`);
          console.log(`   ID: ${entry.id || entry.key || 'N/A'}`);
          console.log(`   Detail URL: ${entry.detail_url || entry.url || entry.detailUrl || 'N/A'}`);
          console.log('');
        });

        if (logList.length > 10) {
          console.log(`... and ${logList.length - 10} more entries`);
          console.log('');
        }

        // Step 4: Fetch detailed logs
        console.log('─'.repeat(80));
        console.log('📋 STEP 4: Fetching Detailed Logs');
        console.log('─'.repeat(80));
        console.log('');

        const entriesWithDetails = logList.filter((e: any) =>
          e.detail_url || e.url || e.detailUrl
        );

        if (entriesWithDetails.length > 0) {
          console.log(`Found ${entriesWithDetails.length} entries with detail URLs`);
          console.log('');

          // Fetch first 3 detailed logs
          for (let i = 0; i < Math.min(3, entriesWithDetails.length); i++) {
            const entry = entriesWithDetails[i];
            const detailUrl = entry.detail_url || entry.url || entry.detailUrl;

            console.log('─'.repeat(80));
            console.log(`📄 Fetching Detail #${i + 1}`);
            console.log('─'.repeat(80));
            console.log('');
            console.log(`URL: ${detailUrl}`);
            console.log('');

            try {
              const detailResponse = await api.get(detailUrl, {
                params: {
                  'sap-client': SAP_CLIENT
                }
              });

              console.log(`Status: ${detailResponse.status}`);

              if (detailResponse.data) {
                let detailText = typeof detailResponse.data === 'string'
                  ? detailResponse.data
                  : JSON.stringify(detailResponse.data, null, 2);

                // Show first 3000 chars of detail
                const preview = detailText.length > 3000
                  ? detailText.substring(0, 3000) + '\n... (truncated)'
                  : detailText;

                console.log('');
                console.log('Detail Content:');
                console.log('─'.repeat(80));
                console.log(preview);
                console.log('─'.repeat(80));
              }
            } catch (error: any) {
              console.error(`Error fetching detail: ${error.message}`);
              if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Data: ${JSON.stringify(error.response.data).substring(0, 500)}`);
              }
            }

            console.log('');
          }
        } else {
          console.log('⚠️  No entries with detail URLs found');
        }
      }
    } else if (typeof logList === 'object' && logList !== null) {
      console.log('📊 Response is an object:');
      console.log(JSON.stringify(logList, null, 2));
      console.log('');

      // Check for common properties
      const keys = Object.keys(logList);
      console.log(`Object keys (${keys.length}):`);
      keys.forEach(key => {
        const value = logList[key];
        const type = Array.isArray(value) ? `Array(${value.length})` : typeof value;
        console.log(`   • ${key}: ${type}`);
      });
      console.log('');

      // Look for array properties
      keys.forEach(key => {
        const value = logList[key];
        if (Array.isArray(value) && value.length > 0) {
          console.log('─'.repeat(80));
          console.log(`📋 Array Property: ${key}`);
          console.log('─'.repeat(80));
          console.log('');
          console.log(`First item structure:`);
          console.log(JSON.stringify(value[0], null, 2));
          console.log('');
        }
      });
    } else {
      console.log('⚠️  Unexpected response format');
      console.log(`Type: ${typeof logList}`);
      console.log(`Value: ${logList}`);
    }

    console.log('─'.repeat(80));
    console.log('📋 Summary');
    console.log('─'.repeat(80));
    console.log('');
    console.log('✅ Debug log analysis completed');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('─'.repeat(80));
    console.error('❌ Debug Log Analysis Failed');
    console.error('─'.repeat(80));
    console.error('');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.response) {
      console.error('Response Details:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText}`);
      console.error(`   Headers: ${JSON.stringify(error.response.headers, null, 2)}`);

      if (error.response.data) {
        const dataText = typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data, null, 2);
        console.error(`   Data (first 1000 chars):`);
        console.error(dataText.substring(0, 1000));
      }
    }

    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack.substring(0, 800));
    }

    process.exit(1);
  }
}

analyzeDebugLogs();
