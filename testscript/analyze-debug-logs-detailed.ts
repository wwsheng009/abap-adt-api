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
  log_id: string;
  detail_url: string;
  request_time: string;
  request_method: string;
  request_uri: string;
  request_headers: string;
  request_body_length: string;
  status_code: string;
  reason_phrase: string;
  response_headers: string;
  response_body_length: string;
  sap_user: string;
  transaction_id: string;
}

interface DebugLogListResponse {
  logs: DebugLogEntry[];
  count: number;
  total_count: number;
}

async function analyzeDebugLogsDetailed() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║          SAP ADT Debug Log Analysis - Detailed Report             ║');
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

    const response = await api.get('/debug/adt', {
      params: {
        'sap-client': SAP_CLIENT
      }
    });

    const data: DebugLogListResponse = response.data;
    console.log(`✅ Found ${data.total_count} log entries`);
    console.log('');

    // Step 2: Analyze by operation type
    console.log('─'.repeat(80));
    console.log('📊 STEP 2: Log Analysis by Operation Type');
    console.log('─'.repeat(80));
    console.log('');

    const operations = new Map<string, DebugLogEntry[]>();

    data.logs.forEach(log => {
      // Extract operation type from URI
      let operation = 'OTHER';
      const uri = log.request_uri;

      if (uri.includes('/runtime/dumps')) {
        operation = 'RUNTIME_DUMPS';
      } else if (uri.includes('/runtime/systemmessages')) {
        operation = 'SYSTEM_MESSAGES';
      } else if (uri.includes('/debugger/listeners')) {
        operation = 'DEBUGGER';
      } else if (uri.includes('/packages/')) {
        if (uri.includes('_action=LOCK')) {
          operation = 'PACKAGE_LOCK';
        } else if (uri.includes('_action=UNLOCK')) {
          operation = 'PACKAGE_UNLOCK';
        } else if (log.request_method === 'DELETE') {
          operation = 'PACKAGE_DELETE';
        } else {
          operation = 'PACKAGE_READ';
        }
      } else if (uri.includes('/programs/')) {
        if (uri.includes('_action=LOCK')) {
          operation = 'PROGRAM_LOCK';
        } else if (uri.includes('_action=UNLOCK')) {
          operation = 'PROGRAM_UNLOCK';
        } else if (log.request_method === 'DELETE') {
          operation = 'PROGRAM_DELETE';
        } else if (uri.includes('/source/main')) {
          operation = 'PROGRAM_SOURCE';
        } else {
          operation = 'PROGRAM_READ';
        }
      } else if (uri.includes('/cts/transportchecks')) {
        operation = 'TRANSPORT_CHECK';
      } else if (uri.includes('/repository/informationsystem')) {
        operation = 'REPOSITORY_QUERY';
      } else if (uri.includes('/ddic/')) {
        operation = 'DDIC_OPERATION';
      }

      if (!operations.has(operation)) {
        operations.set(operation, []);
      }
      operations.get(operation)!.push(log);
    });

    // Display operation summary
    console.log('Operation Type Summary:');
    console.log('');

    const sortedOps = Array.from(operations.entries()).sort((a, b) => b[1].length - a[1].length);

    sortedOps.forEach(([op, logs]) => {
      const successCount = logs.filter(l => l.status_code.trim() === '200').length;
      const errorCount = logs.filter(l => l.status_code.trim() !== '200').length;
      const avgResponseTime = logs.reduce((sum, l) => {
        const match = l.response_headers.match(/server-time=(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0) / logs.length;

      console.log(`• ${op.padEnd(25)} ${logs.length.toString().padStart(3)} requests | Success: ${successCount} | Errors: ${errorCount} | Avg Time: ${Math.round(avgResponseTime)}ms`);
    });

    console.log('');
    console.log(`Total Operations: ${sortedOps.length}`);
    console.log('');

    // Step 3: Show error logs
    console.log('─'.repeat(80));
    console.log('❌ STEP 3: Error Logs Analysis');
    console.log('─'.repeat(80));
    console.log('');

    const errorLogs = data.logs.filter(l => l.status_code.trim() !== '200');

    if (errorLogs.length > 0) {
      console.log(`Found ${errorLogs.length} error(s):`);
      console.log('');

      errorLogs.forEach((log, index) => {
        console.log(`[${index + 1}] Error Details:`);
        console.log(`   Time:       ${log.request_time}`);
        console.log(`   Method:     ${log.request_method}`);
        console.log(`   URI:        ${log.request_uri}`);
        console.log(`   Status:     ${log.status_code} ${log.reason_phrase}`);
        console.log(`   User:       ${log.sap_user}`);
        console.log('');
      });
    } else {
      console.log('✅ No errors found - all requests successful');
      console.log('');
    }

    // Step 4: Analyze recent package operations
    console.log('─'.repeat(80));
    console.log('📦 STEP 4: Recent Package Operations');
    console.log('─'.repeat(80));
    console.log('');

    const packageOps = data.logs.filter(l => l.request_uri.includes('/packages/'));
    console.log(`Found ${packageOps.length} package-related operations:`);
    console.log('');

    packageOps.slice(0, 5).forEach((log, index) => {
      let operation = '';
      if (log.request_uri.includes('_action=LOCK')) operation = '🔒 LOCK';
      else if (log.request_uri.includes('_action=UNLOCK')) operation = '🔓 UNLOCK';
      else if (log.request_method === 'DELETE') operation = '🗑️  DELETE';
      else operation = '📖 READ';

      // Extract package name
      const pkgMatch = log.request_uri.match(/\/packages\/([^?]+)/);
      const pkgName = pkgMatch ? decodeURIComponent(pkgMatch[1]) : 'Unknown';

      console.log(`[${index + 1}] ${operation} ${pkgName}`);
      console.log(`     Time:   ${log.request_time}`);
      console.log(`     Status: ${log.status_code} ${log.reason_phrase}`);
      console.log('');
    });

    // Step 5: Fetch details for a sample log
    console.log('─'.repeat(80));
    console.log('📄 STEP 5: Detailed Log Sample');
    console.log('─'.repeat(80));
    console.log('');

    if (data.logs.length > 0) {
      const sampleLog = data.logs[0];
      console.log('Fetching details for first log entry...');
      console.log('');

      try {
        const detailUrl = `/debug/adt${sampleLog.detail_url}`;
        console.log(`URL: ${detailUrl}?sap-client=${SAP_CLIENT}`);
        console.log('');

        const detailResponse = await api.get(detailUrl, {
          params: {
            'sap-client': SAP_CLIENT
          }
        });

        console.log(`Status: ${detailResponse.status}`);
        console.log('');

        const detailText = typeof detailResponse.data === 'string'
          ? detailResponse.data
          : JSON.stringify(detailResponse.data, null, 2);

        // Show first 4000 chars
        const preview = detailText.length > 4000
          ? detailText.substring(0, 4000) + '\n... (truncated)'
          : detailText;

        console.log('Detail Content:');
        console.log('─'.repeat(80));
        console.log(preview);
        console.log('─'.repeat(80));
      } catch (error: any) {
        console.error(`Error fetching detail: ${error.message}`);
      }

      console.log('');
    }

    // Step 6: Performance analysis
    console.log('─'.repeat(80));
    console.log('⚡ STEP 6: Performance Analysis');
    console.log('─'.repeat(80));
    console.log('');

    // Extract response times
    const responseTimes = data.logs.map(log => {
      const match = log.response_headers.match(/server-time=(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }).filter(t => t > 0);

    if (responseTimes.length > 0) {
      responseTimes.sort((a, b) => a - b);

      const min = responseTimes[0];
      const max = responseTimes[responseTimes.length - 1];
      const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const median = responseTimes[Math.floor(responseTimes.length / 2)];

      console.log('Response Time Statistics:');
      console.log(`   Min:     ${min}ms`);
      console.log(`   Max:     ${max}ms`);
      console.log(`   Average: ${Math.round(avg)}ms`);
      console.log(`   Median:  ${median}ms`);
      console.log('');

      // Slow operations (> 1 second)
      const slowOps = data.logs.filter(log => {
        const match = log.response_headers.match(/server-time=(\d+)/);
        return match && parseInt(match[1]) > 1000;
      });

      if (slowOps.length > 0) {
        console.log(`Found ${slowOps.length} slow operations (> 1s):`);
        console.log('');

        slowOps.slice(0, 5).forEach((log, index) => {
          const match = log.response_headers.match(/server-time=(\d+)/);
          const time = match ? parseInt(match[1]) : 0;

          console.log(`[${index + 1}] ${time}ms - ${log.request_method} ${log.request_uri.substring(0, 80)}`);
        });
        console.log('');
      }
    }

    // Summary
    console.log('─'.repeat(80));
    console.log('📊 Summary');
    console.log('─'.repeat(80));
    console.log('');

    console.log(`Total Logs Analyzed:     ${data.total_count}`);
    console.log(`Time Range:              ${data.logs[data.logs.length - 1].request_time} to ${data.logs[0].request_time}`);
    console.log(`Success Rate:            ${((data.logs.filter(l => l.status_code.trim() === '200').length / data.logs.length) * 100).toFixed(1)}%`);
    console.log(`Unique Operations:       ${sortedOps.length}`);
    console.log(`Errors:                  ${errorLogs.length}`);
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
      console.error(`   Data: ${JSON.stringify(error.response.data).substring(0, 500)}`);
    }

    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack.substring(0, 800));
    }

    process.exit(1);
  }
}

analyzeDebugLogsDetailed();
