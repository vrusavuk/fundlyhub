/**
 * Search Backfill Script
 * 
 * Populates Redis (RediSearch) indexes from existing PostgreSQL data.
 * This is a one-time bootstrap script or for full reindexing.
 * 
 * Usage:
 *   deno run --allow-net --allow-env scripts/search_backfill.ts
 * 
 * Environment Variables Required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 * 
 * @see docs/search/architecture.md
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Redis } from 'https://esm.sh/@upstash/redis@1.35.4';

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')!;
const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!;
const redis = new Redis({ url: redisUrl, token: redisToken });

interface BackfillStats {
  totalProcessed: number;
  errors: number;
  startTime: number;
  endTime?: number;
}

const stats: Record<string, BackfillStats> = {
  users: { totalProcessed: 0, errors: 0, startTime: 0 },
  campaigns: { totalProcessed: 0, errors: 0, startTime: 0 },
  organizations: { totalProcessed: 0, errors: 0, startTime: 0 },
};

/**
 * Main backfill function
 */
async function backfill() {
  console.log('🚀 Starting search index backfill...\n');

  try {
    // Backfill users
    await backfillUsers();
    
    // Backfill campaigns
    await backfillCampaigns();
    
    // Backfill organizations
    await backfillOrganizations();
    
    // Print summary
    printSummary();
    
    console.log('\n✅ Backfill completed successfully!');
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    Deno.exit(1);
  }
}

/**
 * Backfill user documents to idx:users
 */
async function backfillUsers() {
  console.log('📊 Backfilling users...');
  stats.users.startTime = Date.now();
  
  const BATCH_SIZE = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      // Fetch batch from user_search_projection
      const { data: users, error } = await supabase
        .from('user_search_projection')
        .select('*')
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) throw error;
      if (!users || users.length === 0) {
        hasMore = false;
        break;
      }

      // Index batch to Redis
      const pipeline = redis.pipeline();
      for (const user of users) {
        const docKey = `users:${user.user_id}`;
        pipeline.hset(docKey, {
          display_name: user.name || '',
          username: user.name?.toLowerCase().replace(/\s+/g, '_') || '',
          bio: user.bio || '',
          location: user.location || '',
          role: user.role || 'visitor',
          visibility: user.profile_visibility || 'public',
          account_status: user.account_status || 'active',
          is_verified: user.is_verified ? 'true' : 'false',
          follower_count: user.follower_count || 0,
          campaign_count: user.campaign_count || 0,
        });
      }
      await pipeline.exec();

      stats.users.totalProcessed += users.length;
      offset += BATCH_SIZE;
      
      process.stdout.write(`\r  Users: ${stats.users.totalProcessed} indexed`);
    } catch (error) {
      console.error(`\n  Error at offset ${offset}:`, error);
      stats.users.errors++;
      offset += BATCH_SIZE; // Skip this batch and continue
    }
  }

  stats.users.endTime = Date.now();
  console.log(`\n✅ Users backfill complete`);
}

/**
 * Backfill campaign documents to idx:campaigns
 */
async function backfillCampaigns() {
  console.log('\n📊 Backfilling campaigns...');
  stats.campaigns.startTime = Date.now();
  
  const BATCH_SIZE = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      // Fetch batch from campaign_search_projection
      const { data: campaigns, error } = await supabase
        .from('campaign_search_projection')
        .select('*')
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) throw error;
      if (!campaigns || campaigns.length === 0) {
        hasMore = false;
        break;
      }

      // Index batch to Redis
      const pipeline = redis.pipeline();
      for (const campaign of campaigns) {
        const docKey = `campaigns:${campaign.campaign_id}`;
        pipeline.hset(docKey, {
          title: campaign.title || '',
          summary: campaign.summary || '',
          story_text: campaign.story_text || '',
          beneficiary_name: campaign.beneficiary_name || '',
          location: campaign.location || '',
          category: campaign.category_name || '',
          status: campaign.status || 'draft',
          visibility: campaign.visibility || 'private',
          owner_id: campaign.owner_user_id || '',
          tags: (campaign.tags || []).join(','),
        });
      }
      await pipeline.exec();

      stats.campaigns.totalProcessed += campaigns.length;
      offset += BATCH_SIZE;
      
      process.stdout.write(`\r  Campaigns: ${stats.campaigns.totalProcessed} indexed`);
    } catch (error) {
      console.error(`\n  Error at offset ${offset}:`, error);
      stats.campaigns.errors++;
      offset += BATCH_SIZE;
    }
  }

  stats.campaigns.endTime = Date.now();
  console.log(`\n✅ Campaigns backfill complete`);
}

/**
 * Backfill organization documents to idx:orgs
 */
async function backfillOrganizations() {
  console.log('\n📊 Backfilling organizations...');
  stats.organizations.startTime = Date.now();
  
  const BATCH_SIZE = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      // Fetch batch from organization_search_projection
      const { data: orgs, error } = await supabase
        .from('organization_search_projection')
        .select('*')
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) throw error;
      if (!orgs || orgs.length === 0) {
        hasMore = false;
        break;
      }

      // Index batch to Redis
      const pipeline = redis.pipeline();
      for (const org of orgs) {
        const docKey = `orgs:${org.org_id}`;
        pipeline.hset(docKey, {
          legal_name: org.legal_name || '',
          dba_name: org.dba_name || '',
          country: org.country || '',
          categories: (org.categories || []).join(','),
          verification_status: org.verification_status || 'pending',
        });
      }
      await pipeline.exec();

      stats.organizations.totalProcessed += orgs.length;
      offset += BATCH_SIZE;
      
      process.stdout.write(`\r  Organizations: ${stats.organizations.totalProcessed} indexed`);
    } catch (error) {
      console.error(`\n  Error at offset ${offset}:`, error);
      stats.organizations.errors++;
      offset += BATCH_SIZE;
    }
  }

  stats.organizations.endTime = Date.now();
  console.log(`\n✅ Organizations backfill complete`);
}

/**
 * Print summary statistics
 */
function printSummary() {
  console.log('\n\n' + '='.repeat(60));
  console.log('📈 BACKFILL SUMMARY');
  console.log('='.repeat(60));
  
  Object.entries(stats).forEach(([type, stat]) => {
    const duration = ((stat.endTime || Date.now()) - stat.startTime) / 1000;
    console.log(`\n${type.toUpperCase()}:`);
    console.log(`  ✅ Processed: ${stat.totalProcessed}`);
    console.log(`  ❌ Errors: ${stat.errors}`);
    console.log(`  ⏱️  Duration: ${duration.toFixed(2)}s`);
    console.log(`  📊 Throughput: ${Math.round(stat.totalProcessed / duration)} docs/sec`);
  });
  
  const totalDocs = Object.values(stats).reduce((sum, s) => sum + s.totalProcessed, 0);
  const totalErrors = Object.values(stats).reduce((sum, s) => sum + s.errors, 0);
  const totalDuration = Math.max(
    ...Object.values(stats).map(s => ((s.endTime || Date.now()) - s.startTime) / 1000)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${totalDocs} documents indexed in ${totalDuration.toFixed(2)}s`);
  console.log(`Errors: ${totalErrors}`);
  console.log('='.repeat(60));
}

// Run backfill
if (import.meta.main) {
  backfill();
}
