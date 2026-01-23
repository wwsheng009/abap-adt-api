#!/usr/bin/env tsx

/**
 * Create complete ZJG_AI package structure
 */

import { ADTClient, session_types } from '../index';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Package structure definition
const packages = [
  {
    name: "ZJG_AI_BASE",
    parent: "ZJG_AI",
    description: "Base classes and interfaces"
  },
  {
    name: "ZJG_AI_GATEWAY",
    parent: "ZJG_AI",
    description: "Gateway REST services"
  },
  {
    name: "ZJG_AI_TOOLS",
    parent: "ZJG_AI",
    description: "Tool implementations"
  },
  {
    name: "ZJG_AI_TOOLS_MAT",
    parent: "ZJG_AI_TOOLS",
    description: "Material tools"
  },
  {
    name: "ZJG_AI_TOOLS_SALES",
    parent: "ZJG_AI_TOOLS",
    description: "Sales tools"
  },
  {
    name: "ZJG_AI_TOOLS_FIN",
    parent: "ZJG_AI_TOOLS",
    description: "Finance tools"
  },
  {
    name: "ZJG_AI_SECURITY",
    parent: "ZJG_AI",
    description: "Security components"
  },
  {
    name: "ZJG_AI_TYPES",
    parent: "ZJG_AI",
    description: "DDIC types"
  }
];

// Load .env file
const envPath = resolve(process.env.ADT_ENV_PATH || '.env');
const envContent = readFileSync(envPath, 'utf-8');

// Parse .env file manually
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    envVars[key.trim()] = value;
  }
});

async function main() {
  console.log('🚀 Creating ZJG_AI Package Structure\n');

  const client = new ADTClient(
    envVars.SAP_URL,
    envVars.SAP_USER,
    envVars.SAP_PASSWORD,
    envVars.SAP_CLIENT || '100',
    envVars.SAP_LANGUAGE || 'E'
  );

  client.stateful = session_types.stateful;

  try {
    await client.login();
    console.log('✅ Login successful\n');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const pkg of packages) {
      try {
        console.log(`📦 Creating ${pkg.name}...`);

        await client.createObject(
          "DEVC/K",
          pkg.name,
          pkg.parent,
          pkg.description,
          `/sap/bc/adt/packages/${pkg.parent}`,
          "SAP",
          "",
          "LOCAL",
          "",
          "development"
        );

        console.log(`   ✅ Created\n`);
        created++;

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        if (error.message && error.message.includes('already exists')) {
          console.log(`   ⏭️  Skipped (already exists)\n`);
          skipped++;
        } else if (error.message && error.message.includes('locked')) {
          console.log(`   ⚠️  Locked by another request\n`);
          errors++;
        } else {
          console.log(`   ❌ Error: ${error.message}\n`);
          errors++;
        }
      }
    }

    console.log('='.repeat(50));
    console.log('Summary:');
    console.log(`  ✅ Created: ${created}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors:  ${errors}`);
    console.log(`  📦 Total:   ${packages.length}`);
    console.log('='.repeat(50));

    await client.logout();
    console.log('\n👋 Done!');

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
