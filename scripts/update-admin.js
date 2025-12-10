require('dotenv').config({ path: '.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const readline = require('readline');

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
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateAdmin() {
  try {
    console.log('🔐 Admin Credentials Update Tool\n');
    console.log('This will update the admin user email and/or password.\n');

    // Get current admin email
    const currentEmail = await question('Enter current admin email (or press Enter for admin@fleet.com): ') || 'admin@fleet.com';
    
    // Find admin user
    const { data: admin, error: findError } = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('email', currentEmail)
      .eq('role', 'admin')
      .maybeSingle();

    if (findError || !admin) {
      console.error(`❌ Admin user not found with email: ${currentEmail}`);
      console.error('Error:', findError?.message || 'User not found');
      rl.close();
      return;
    }

    console.log(`\n✅ Found admin user:`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}\n`);

    // Ask what to update
    const updateEmail = await question('Do you want to update email? (y/n): ').toLowerCase() === 'y';
    const updatePassword = await question('Do you want to update password? (y/n): ').toLowerCase() === 'y';

    if (!updateEmail && !updatePassword) {
      console.log('\n⚠️  No changes requested. Exiting.');
      rl.close();
      return;
    }

    const updateData = {};

    if (updateEmail) {
      const newEmail = await question('Enter new email: ');
      if (!newEmail || !newEmail.includes('@')) {
        console.error('❌ Invalid email format');
        rl.close();
        return;
      }
      updateData.email = newEmail.toLowerCase();
    }

    if (updatePassword) {
      const newPassword = await question('Enter new password (min 6 characters): ');
      if (!newPassword || newPassword.length < 6) {
        console.error('❌ Password must be at least 6 characters');
        rl.close();
        return;
      }
      const confirmPassword = await question('Confirm new password: ');
      if (newPassword !== confirmPassword) {
        console.error('❌ Passwords do not match');
        rl.close();
        return;
      }
      updateData.password_hash = await bcrypt.hash(newPassword, 10);
    }

    // Update admin user
    const { data: updatedAdmin, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', admin.id)
      .select('id, email, name, role')
      .single();

    if (updateError) {
      console.error('❌ Error updating admin:', updateError);
      rl.close();
      return;
    }

    console.log('\n✅ Admin credentials updated successfully!');
    console.log(`   ID: ${updatedAdmin.id}`);
    if (updateEmail) {
      console.log(`   New Email: ${updatedAdmin.email}`);
    } else {
      console.log(`   Email: ${updatedAdmin.email} (unchanged)`);
    }
    if (updatePassword) {
      console.log(`   Password: Updated (hidden for security)`);
    } else {
      console.log(`   Password: Unchanged`);
    }
    console.log(`\n📝 You can now login with:`);
    if (updateEmail) {
      console.log(`   Email: ${updatedAdmin.email}`);
    } else {
      console.log(`   Email: ${currentEmail}`);
    }
    if (updatePassword) {
      console.log(`   Password: [The password you just set]`);
    } else {
      console.log(`   Password: [Your existing password]`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    rl.close();
  }
}

updateAdmin();

