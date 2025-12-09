require('dotenv').config({ path: '.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Load from .env.local explicitly
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createAdmin() {
  try {
    const adminEmail = 'admin@fleet.com';
    const adminPassword = 'password123';
    const adminName = 'Admin User';

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', adminEmail)
      .maybeSingle();

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   ID: ${existingAdmin.id}`);
      console.log('\n💡 To reset password, delete the user first or update manually in Supabase.');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const { data: newAdmin, error: createError } = await supabase
      .from('profiles')
      .insert({
        email: adminEmail,
        name: adminName,
        role: 'admin',
        password_hash: passwordHash,
      })
      .select('id, email, name, role')
      .single();

    if (createError) {
      console.error('❌ Error creating admin:', createError);
      
      // Try without phone_number column if it doesn't exist
      if (createError.message.includes('phone_number') || createError.code === '42703') {
        console.log('⚠️  Retrying without phone_number column...');
        const { data: retryAdmin, error: retryError } = await supabase
          .from('profiles')
          .insert({
            email: adminEmail,
            name: adminName,
            role: 'admin',
            password_hash: passwordHash,
          })
          .select('id, email, name, role')
          .single();
        
        if (retryError) {
          console.error('❌ Retry failed:', retryError);
          return;
        }
        
        console.log('✅ Admin user created successfully!');
        console.log(`   Email: ${retryAdmin.email}`);
        console.log(`   Name: ${retryAdmin.name}`);
        console.log(`   Role: ${retryAdmin.role}`);
        console.log(`   ID: ${retryAdmin.id}`);
        console.log(`\n📝 Login credentials:`);
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        return;
      }
      
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Name: ${newAdmin.name}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`\n📝 Login credentials:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createAdmin();

