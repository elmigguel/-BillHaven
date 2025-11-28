// Check current BillHaven status
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bldjdctgjhtucyxqhwpc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsZGpkY3Rnamh0dWN5eHFod3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjY1MjQsImV4cCI6MjA3OTkwMjUyNH0.lNCn_6yyK5gQ_06XrP96vp8R7g93UAtiiqIjrYng3hw'
);

async function checkStatus() {
  console.log('\n=== BillHaven Status Check ===\n');

  // Check platform settings
  const { data: settings } = await supabase.from('platform_settings').select('*').single();

  console.log('Platform Settings:');
  console.log('  Fee Wallet:', settings?.fee_wallet_address || '❌ NOT SET');
  console.log('  Fee %:', settings?.platform_fee_percentage || '2.5');

  // Check bills
  const { data: bills, count } = await supabase.from('bills').select('*');
  console.log('\nBills:', bills?.length || 0, 'total');
  if (bills?.length > 0) {
    bills.forEach(b => {
      console.log(`  - ${b.title}: $${b.amount} (${b.status})`);
    });
  }

  // Check storage
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasBucket = buckets?.some(b => b.name === 'bill-documents');
  console.log('\nStorage Bucket:', hasBucket ? '✅ EXISTS' : '❌ NOT FOUND');

  console.log('\n=== What You Need To Do ===\n');

  if (!settings?.fee_wallet_address) {
    console.log('1. Set fee wallet in Settings page');
  }

  console.log('\n');
}

checkStatus();
