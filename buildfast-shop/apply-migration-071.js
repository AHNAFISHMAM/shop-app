/**
 * Apply Migration 071 - Reservation Settings Table
 * This script directly applies the reservation settings migration
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Applying migration 071_create_reservation_settings.sql...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '071_create_reservation_settings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons but keep them for execution
    // We need to execute the SQL in parts because of the DO blocks
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s + ';');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip empty statements and comments
      if (!stmt || stmt.startsWith('--') || stmt.trim() === ';') {
        continue;
      }

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

      // Execute using RPC (we need a service role key for DDL operations)
      // Since we only have anon key, let's try a different approach
      // We'll use the REST API to execute raw SQL

      const { data, error } = await supabase.rpc('exec_sql', { query: stmt });

      if (error) {
        // If exec_sql doesn't exist, we need to create the table manually using data operations
        console.log('ℹ️  RPC method not available, will create table using alternative method');
        break;
      }
    }

    // Alternative: Create the table directly using Supabase client
    console.log('\n📋 Creating reservation_settings table using alternative method...\n');

    // Check if table exists first
    const { data: existingTable, error: checkError } = await supabase
      .from('reservation_settings')
      .select('*')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist - show instructions
      console.log('⚠️  Table does not exist. Please run this SQL in your Supabase SQL Editor:\n');
      console.log('━'.repeat(80));
      console.log(migrationSQL);
      console.log('━'.repeat(80));
      console.log('\n📖 Instructions:');
      console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Select your project: buildfast-shop');
      console.log('3. Go to SQL Editor');
      console.log('4. Create a new query');
      console.log('5. Copy and paste the SQL above');
      console.log('6. Click "Run" to execute');
      console.log('\n✅ After running the SQL, restart your dev server\n');

      // Write SQL to a separate file for easy copying
      const outputPath = path.join(__dirname, 'APPLY_THIS_SQL.sql');
      fs.writeFileSync(outputPath, migrationSQL);
      console.log(`💾 SQL saved to: ${outputPath}`);
      console.log('   You can copy from this file to the SQL Editor\n');

    } else if (!checkError) {
      console.log('✅ Table already exists!');

      // Check if it has data
      if (existingTable && existingTable.length > 0) {
        console.log('✅ Table has settings configured');
      } else {
        console.log('⚠️  Table exists but has no default settings');
        console.log('   The default settings should have been inserted automatically');
      }
    } else {
      console.log('❌ Error checking table:', checkError.message);
    }

  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    process.exit(1);
  }
}

applyMigration();
