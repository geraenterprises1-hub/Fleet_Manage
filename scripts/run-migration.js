const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Try to get DATABASE_URL, or construct it from Supabase URL
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    // Extract project ref from Supabase URL
    // URL format: https://[project-ref].supabase.co
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (match) {
      const projectRef = match[1];
      // Try to construct connection string
      // Note: This requires DB password which might not be in env
      console.log('⚠️  DATABASE_URL not found. Please provide database connection details.');
      console.log('   You can either:');
      console.log('   1. Add DATABASE_URL to .env.local');
      console.log('   2. Run the migration manually in Supabase SQL Editor\n');
      console.log('   Migration file: database/allow-null-driver-id.sql\n');
      process.exit(1);
    }
  }
  
  console.error('❌ Missing DATABASE_URL in .env.local');
  console.error('   Please add: DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
});

async function runMigration() {
  try {
    console.log('📝 Running migration: allow-null-driver-id.sql\n');
    
    await client.connect();
    console.log('✅ Connected to database\n');
    
    const migrationFile = path.join(__dirname, '..', 'database', 'allow-null-driver-id.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Execute the entire SQL file
    await client.query(sql);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify the change
    const result = await client.query(`
      SELECT 
        column_name, 
        is_nullable, 
        data_type
      FROM information_schema.columns
      WHERE table_name = 'expenses' 
        AND column_name = 'driver_id';
    `);
    
    if (result.rows.length > 0) {
      const column = result.rows[0];
      console.log('📊 Verification:');
      console.log(`   Column: ${column.column_name}`);
      console.log(`   Nullable: ${column.is_nullable}`);
      console.log(`   Type: ${column.data_type}\n`);
      
      if (column.is_nullable === 'YES') {
        console.log('✅ driver_id column is now nullable - migration successful!\n');
      } else {
        console.log('⚠️  driver_id column is still NOT NULL - migration may have failed\n');
      }
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📋 Please run the migration manually:');
    console.error('   1. Go to Supabase Dashboard: https://supabase.com/dashboard');
    console.error('   2. Select your project');
    console.error('   3. Go to SQL Editor');
    console.error('   4. Copy and paste the contents of: database/allow-null-driver-id.sql');
    console.error('   5. Click "Run" to execute\n');
    await client.end();
    process.exit(1);
  }
}

runMigration();
