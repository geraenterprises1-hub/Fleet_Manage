// Test database connection
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Database Connection...\n');

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
console.log(`   Service Role Key: ${supabaseServiceRoleKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testConnection() {
  try {
    console.log('📊 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('⚠️  Database tables not created yet.');
        console.log('   Please run the SQL schema in Supabase SQL Editor.');
        console.log('   File: database/schema.sql\n');
      } else {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log('✅ Tables exist and are accessible.\n');
    }
    
    // Test storage bucket
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    if (bucketError) {
      console.log('⚠️  Storage error:', bucketError.message);
    } else {
      const receiptsBucket = buckets?.find(b => b.name === 'receipts');
      if (receiptsBucket) {
        console.log('✅ Storage bucket "receipts" exists');
      } else {
        console.log('⚠️  Storage bucket "receipts" not found.');
        console.log('   Please create it in Supabase Dashboard > Storage\n');
      }
    }
    
    console.log('\n✅ All checks completed!');
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();

