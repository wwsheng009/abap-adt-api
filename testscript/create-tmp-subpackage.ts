#!/usr/bin/env tsx

import { ADTClient } from '../src/AdtClient';
import {
  validatePackage,
  getPackage
} from '../src/api/packages';
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

async function createTmpSubPackage() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║            CREATE SUB-PACKAGE UNDER $TMP                         ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🔌 Connection Details:');
    console.log(`   URL:    ${process.env.SAP_URL}`);
    console.log(`   Client: ${process.env.SAP_CLIENT}`);
    console.log(`   User:   ${process.env.SAP_USER}`);
    console.log('');

    console.log('🔐 Logging in...');
    await client.login();
    console.log('✅ Login successful\n');

    const parentPackage = '$TMP';
    const subPackageName = 'ZTMP_SUB_' + Date.now().toString().slice(-6);

    console.log('─'.repeat(80));
    console.log('📋 $TMP Sub-Package Configuration');
    console.log('─'.repeat(80));
    console.log('');
    console.log('创建 $TMP 下的子包:');
    console.log(`   • Package:          ${subPackageName}`);
    console.log(`   • Parent:           ${parentPackage}`);
    console.log(`   • Description:      $TMP 下的子包`);
    console.log(`   • Type:             development`);
    console.log(`   • Software:         LOCAL ($TMP包的软件组件)`);
    console.log(`   • Transport Layer:  (不需要 - 本地对象)`);
    console.log(`   • Responsible:      username`);
    console.log(`   • Transport Request: (不需要 - $TMP包)`);
    console.log('');
    console.log('💡 $TMP 包的特点:');
    console.log('   • 本地对象，不需要传输请求');
    console.log('   • 不包含在传输层中');
    console.log('   • 仅用于开发测试');
    console.log('');

    // Validate first
    console.log('─'.repeat(80));
    console.log('📋 STEP 1: Validate Sub-Package Configuration');
    console.log('─'.repeat(80));
    console.log('');

    const validation = await validatePackage(client.httpClient, {
      objname: subPackageName,
      description: '$TMP 下的子包',
      packagetype: 'development',
      swcomp: 'LOCAL',  // LOCAL for $TMP packages
      appcomp: '',
      checkmode: 'basic'  // Use basic mode for $TMP
    });

    console.log(`✅ Validation Result: ${validation.success ? '✓ VALID' : '✗ INVALID'}`);
    if (validation.messages.length > 0) {
      console.log('\n   Validation Messages:');
      validation.messages.forEach(msg => {
        const icon = msg.severity === 'success' ? '✓' : msg.severity === 'error' ? '✗' : 'ℹ';
        console.log(`      ${icon} [${msg.severity.toUpperCase()}] ${msg.text}`);
      });
    }
    console.log('');

    if (!validation.success) {
      throw new Error('Sub-package validation failed');
    }

    // Create the sub-package
    console.log('─'.repeat(80));
    console.log('📋 STEP 2: Create Sub-Package under $TMP');
    console.log('─'.repeat(80));
    console.log('');
    console.log(`   创建子包 ${subPackageName} 在 ${parentPackage} 下...`);
    console.log('');

    // Use the built-in createObject method
    // For $TMP packages, use LOCAL as software component
    await client.createObject({
      objtype: 'DEVC/K',
      name: subPackageName,
      parentName: parentPackage,  // Create under $TMP
      description: '$TMP 下的子包',
      responsible: 'username',
      transport: '',  // Empty for $TMP (no transport needed)
      swcomp: 'LOCAL',  // LOCAL for $TMP packages
      packagetype: 'development',
      transportLayer: ''  // Empty for $TMP (local objects)
    });

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║              $TMP 子包创建成功! ✓                             ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`✅ 子包 ${subPackageName} 在 $TMP 下创建成功!`);
    console.log('');
    console.log('Package Structure:');
    console.log(`   $TMP`);
    console.log(`   └── ${subPackageName}`);
    console.log('');
    console.log('💡 $TMP 子包特点:');
    console.log('   • 本地对象，不需要传输');
    console.log('   • 不能移动到其他系统');
    console.log('   • 适合开发和测试');
    console.log('   • 在 SE80 中查看');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('─'.repeat(80));
    console.error('❌ 子包创建失败');
    console.error('─'.repeat(80));
    console.error('');
    console.error(`错误: ${error.message}`);
    console.error('');

    if (error.message.includes('LOCAL') || error.message.includes('软件组件')) {
      console.error('💡 提示:');
      console.error('   $TMP 包使用 LOCAL 软件组件');
      console.error('   子包会自动继承父包的软件组件');
      console.error('   不要为 $TMP 子包指定软件组件');
      console.error('');
    }

    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack.substring(0, 500));
    }

    process.exit(1);
  }
}

createTmpSubPackage();
