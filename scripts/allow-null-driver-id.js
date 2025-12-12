// Script to run migration: Allow NULL driver_id in expenses table
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅' : '❌');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
  try {
    console.log('📊 Running migration: Allow NULL driver_id in expenses table...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'allow-null-driver-id.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute...\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip verification queries (SELECT statements)
      if (statement.trim().toUpperCase().startsWith('SELECT')) {
        console.log(`⏭️  Skipping verification query ${i + 1}...`);
        continue;
      }
      
      try {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: statement });
        
        // If RPC doesn't work, try direct query (this might not work for DDL)
        if (error) {
          console.log(`⚠️  RPC method failed, trying alternative approach...`);
          // For DDL statements, we need to use the Postgres connection directly
          // Since Supabase JS client doesn't support DDL, we'll provide instructions
          console.log('\n⚠️  Note: Supabase JS client cannot execute DDL statements directly.');
          console.log('   Please run the migration manually in Supabase SQL Editor:\n');
          console.log(`   File: ${sqlPath}\n`);
          console.log('   Or use psql with your DATABASE_URL:\n');
          console.log(`   psql "${process.env.DATABASE_URL}" -f "${sqlPath}"\n`);
          return;
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        console.log('\n⚠️  Please run the migration manually in Supabase SQL Editor:');
        console.log(`   File: ${sqlPath}\n`);
        return;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('   The driver_id column in expenses table now allows NULL values.\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Please run the migration manually:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy and paste the contents of: database/allow-null-driver-id.sql');
    console.log('   3. Click "Run"\n');
    process.exit(1);
  }
}

runMigration();

