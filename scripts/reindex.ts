/**
 * Reindex Script
 * 
 * Rebuilds RediSearch indexes from scratch.
 * Use this for emergency recovery or after major schema changes.
 * 
 * Usage:
 *   deno run --allow-net --allow-env scripts/reindex.ts [--type=users|campaigns|orgs|all]
 * 
 * @see docs/search/runbook.md
 */

import { Redis } from 'https://esm.sh/@upstash/redis@1.35.4';

const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')!;
const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!;
const redis = new Redis({ url: redisUrl, token: redisToken });

const args = Deno.args;
const typeArg = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';

/**
 * Create RediSearch index schemas
 */
async function createIndexes(type: string) {
  console.log(`🔨 Creating/recreating ${type} index...`);

  try {
    if (type === 'users' || type === 'all') {
      // Drop existing index
      try {
        await redis.sendCommand(['FT.DROPINDEX', 'idx:users']);
      } catch {
        // Index might not exist
      }

      // Create new index
      await redis.sendCommand([
        'FT.CREATE', 'idx:users',
        'ON', 'HASH',
        'PREFIX', '1', 'users:',
        'SCHEMA',
        'display_name', 'TEXT', 'WEIGHT', '5.0', 'SORTABLE',
        'username', 'TEXT', 'WEIGHT', '4.0',
        'bio', 'TEXT', 'WEIGHT', '2.0',
        'location', 'TEXT',
        'role', 'TAG',
        'visibility', 'TAG',
        'account_status', 'TAG',
        'is_verified', 'TAG',
        'follower_count', 'NUMERIC', 'SORTABLE',
        'campaign_count', 'NUMERIC', 'SORTABLE',
      ]);
      console.log('  ✅ idx:users created');
    }

    if (type === 'campaigns' || type === 'all') {
      try {
        await redis.sendCommand(['FT.DROPINDEX', 'idx:campaigns']);
      } catch {
        // Index might not exist
      }

      await redis.sendCommand([
        'FT.CREATE', 'idx:campaigns',
        'ON', 'HASH',
        'PREFIX', '1', 'campaigns:',
        'SCHEMA',
        'title', 'TEXT', 'WEIGHT', '5.0', 'SORTABLE',
        'summary', 'TEXT', 'WEIGHT', '3.0',
        'story_text', 'TEXT', 'WEIGHT', '2.0',
        'beneficiary_name', 'TEXT', 'WEIGHT', '3.0',
        'location', 'TEXT',
        'category', 'TAG',
        'status', 'TAG',
        'visibility', 'TAG',
        'owner_id', 'TAG',
        'tags', 'TAG', 'SEPARATOR', ',',
      ]);
      console.log('  ✅ idx:campaigns created');
    }

    if (type === 'orgs' || type === 'all') {
      try {
        await redis.sendCommand(['FT.DROPINDEX', 'idx:orgs']);
      } catch {
        // Index might not exist
      }

      await redis.sendCommand([
        'FT.CREATE', 'idx:orgs',
        'ON', 'HASH',
        'PREFIX', '1', 'orgs:',
        'SCHEMA',
        'legal_name', 'TEXT', 'WEIGHT', '5.0', 'SORTABLE',
        'dba_name', 'TEXT', 'WEIGHT', '5.0',
        'country', 'TEXT',
        'categories', 'TAG', 'SEPARATOR', ',',
        'verification_status', 'TAG',
      ]);
      console.log('  ✅ idx:orgs created');
    }

    console.log('✅ Index creation complete\n');
  } catch (error) {
    console.error('❌ Index creation failed:', error);
    throw error;
  }
}

/**
 * Main reindex function
 */
async function reindex() {
  console.log('🔄 Starting reindex process...\n');
  
  // Step 1: Create indexes
  await createIndexes(typeArg);
  
  // Step 2: Run backfill (populates the indexes)
  console.log('📥 Running backfill to populate indexes...');
  console.log('💡 Tip: Monitor progress in another terminal with:');
  console.log('   redis-cli FT.INFO idx:users\n');
  
  // Import and run backfill script
  const backfillModule = await import('./search_backfill.ts');
  // Backfill script will handle the actual data population
  
  console.log('\n✅ Reindex complete!');
  console.log('\n📊 Verify with:');
  console.log('   redis-cli FT.SEARCH idx:users "*" LIMIT 0 0');
  console.log('   redis-cli FT.SEARCH idx:campaigns "*" LIMIT 0 0');
  console.log('   redis-cli FT.SEARCH idx:orgs "*" LIMIT 0 0');
}

// Run reindex
if (import.meta.main) {
  reindex().catch(error => {
    console.error('Fatal error:', error);
    Deno.exit(1);
  });
}
