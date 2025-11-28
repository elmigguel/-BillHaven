// Test Supabase Connection and Tables
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bldjdctgjhtucyxqhwpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZGpkY3Rnamh0dWN5eHFod3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjQsImV4cCI6MjA3OTkwMjUyNH0.lNCn_6yyK5gQ_06XrP96vp8R7g93UAtiiqIjrYng3hw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('\n=== BillHaven Supabase Connection Test ===\n');

  // Test 1: Basic connection
  console.log('1. Testing connection...');
  try {
    const { data, error } = await supabase.from('platform_settings').select('*').limit(1);
    if (error) {
      if (error.code === '42P01') {
        console.log('   ❌ Tables do NOT exist - Schema needs to be deployed');
        return { tablesExist: false };
      }
      console.log('   ⚠️ Error:', error.message);
      return { tablesExist: false, error };
    }
    console.log('   ✅ Connected successfully!');
    console.log('   ✅ platform_settings table exists');
  } catch (e) {
    console.log('   ❌ Connection failed:', e.message);
    return { tablesExist: false };
  }

  // Test 2: Check profiles table
  console.log('\n2. Checking profiles table...');
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error && error.code === '42P01') {
      console.log('   ❌ profiles table does NOT exist');
      return { tablesExist: false };
    }
    console.log('   ✅ profiles table exists');
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }

  // Test 3: Check bills table
  console.log('\n3. Checking bills table...');
  try {
    const { error } = await supabase.from('bills').select('count').limit(1);
    if (error && error.code === '42P01') {
      console.log('   ❌ bills table does NOT exist');
      return { tablesExist: false };
    }
    console.log('   ✅ bills table exists');
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }

  // Test 4: Check platform settings
  console.log('\n4. Checking platform_settings...');
  try {
    const { data, error } = await supabase.from('platform_settings').select('*');
    if (error) {
      console.log('   ⚠️ Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('   ✅ Platform settings configured');
      console.log('   Fee wallet:', data[0].fee_wallet_address || '(not set)');
      console.log('   Default fee:', data[0].platform_fee_percentage + '%');
    } else {
      console.log('   ⚠️ No platform settings found');
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }

  // Test 5: Check storage bucket
  console.log('\n5. Checking storage bucket...');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('   ⚠️ Cannot check storage:', error.message);
    } else {
      const billBucket = data.find(b => b.name === 'bill-documents');
      if (billBucket) {
        console.log('   ✅ bill-documents bucket exists');
      } else {
        console.log('   ⚠️ bill-documents bucket NOT found');
      }
    }
  } catch (e) {
    console.log('   ❌ Error:', e.message);
  }

  console.log('\n=== Test Complete ===\n');
  return { tablesExist: true };
}

testConnection().then(result => {
  if (!result.tablesExist) {
    console.log('\n🔴 ACTION REQUIRED: Run the database schema in Supabase SQL Editor');
    console.log('   File: /home/elmigguel/BillHaven/supabase-schema.sql\n');
  } else {
    console.log('\n🟢 All tables exist! Ready for testing.\n');
  }
  process.exit(0);
});
