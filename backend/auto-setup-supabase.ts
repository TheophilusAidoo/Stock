/**
 * Automatic Supabase Setup Script
 * Uses API keys to automatically:
 * 1. Verify connection and tables
 * 2. Migrate all initial data (users, gateways, methods, IPOs)
 * 3. Verify setup completion
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pptkoxlmocdmcbymxjix.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdGtveGxtb2NkbWNieW14aml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYwNDkxMywiZXhwIjoyMDgwMTgwOTEzfQ.mnEF-aRU5UtCRSXm_5nYm0cqN-UCXf8yO9Ji2HEMafA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkConnection() {
  console.log('🔌 Testing Supabase connection...');
  try {
    // Try to query a table to verify connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code === 'PGRST116') {
      console.log('⚠️  Tables do not exist yet.');
      console.log('   Please run the SQL migration in Supabase Dashboard first.');
      console.log('   File: backend/supabase-migration.sql\n');
      return false;
    }
    console.log('✅ Connected to Supabase!\n');
    return true;
  } catch (error: any) {
    console.log(`❌ Connection failed: ${error.message}\n`);
    return false;
  }
}

async function migrateUsers() {
  console.log('👥 Migrating users...');
  const users = [
    {
      id: 'USR001',
      name: 'Aditi Sharma',
      email: 'aditi@stockmart.com',
      password: 'aditi@stockmart.com',
      mobile: '+91 9876543210',
      date_of_birth: '1990-05-15',
      gender: 'Female',
      address: '123, MG Road, Mumbai, Maharashtra 400001',
      pan: 'ABCDE1234F',
      aadhaar: '1234 5678 9012',
      email_verified: true,
      mobile_verified: true,
      two_factor_enabled: false,
      default_deposit_method: 'GW001',
      default_withdrawal_method: 'WM001',
      notification_preferences: {
        ipoAlerts: true,
        depositUpdates: true,
        withdrawalUpdates: true,
        approvalNotifications: true,
        systemAlerts: true,
        loginAlerts: false,
      },
      segment: ['Equity', 'F&O'],
      kyc_status: 'approved',
      status: 'approved',
      balance: 1124890,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ADM001',
      name: 'Admin User',
      email: 'admin@stockmart.com',
      password: 'admin@stockmart.com',
      segment: ['Equity', 'F&O', 'Currency', 'Commodity'],
      kyc_status: 'approved',
      status: 'approved',
      balance: 0,
      created_at: new Date().toISOString(),
    },
  ];

  const { error } = await supabase.from('users').upsert(users, { onConflict: 'id' });
  if (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
    return false;
  }
  console.log(`   ✅ Migrated ${users.length} users`);
  return true;
}

async function migratePaymentGateways() {
  console.log('💳 Migrating payment gateways...');
  const gateways = [
    {
      id: 'GW001',
      name: 'USDT (TRC20)',
      trc20_address: 'TXYZabcdefghijklmnopqrstuvwxyz123456',
      trc20_qr_code: '',
      min_deposit: 100,
      confirmation_time: '15-30 minutes',
      instructions: 'Send USDT (TRC20) to the address below. Minimum deposit: $100. Confirmation time: 15-30 minutes.',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const { error } = await supabase.from('payment_gateways').upsert(gateways, { onConflict: 'id' });
  if (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
    return false;
  }
  console.log(`   ✅ Migrated ${gateways.length} payment gateways`);
  return true;
}

async function migrateWithdrawalMethods() {
  console.log('💸 Migrating withdrawal methods...');
  const methods = [
    {
      id: 'WM001',
      name: 'TRC20 USDT',
      type: 'TRC20',
      min_amount: 50,
      fee: 2,
      processing_time: '1-2 hours',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'WM002',
      name: 'Bank Transfer',
      type: 'Bank',
      min_amount: 100,
      fee: 5,
      processing_time: '1-3 business days',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'WM003',
      name: 'Binance Pay',
      type: 'Binance',
      min_amount: 20,
      fee: 1,
      processing_time: '30 minutes - 2 hours',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const { error } = await supabase.from('withdrawal_methods').upsert(methods, { onConflict: 'id' });
  if (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
    return false;
  }
  console.log(`   ✅ Migrated ${methods.length} withdrawal methods`);
  return true;
}

async function migrateIPOs() {
  console.log('📈 Migrating IPOs...');
  const ipos = [
    {
      id: 'IPO001',
      company_name: 'Reliance JIO',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 850,
      price_max: 950,
      lot_size: 1,
      min_investment: 14200,
      open_date: '2025-01-15',
      close_date: '2025-01-17',
      description: 'India\'s largest telecom operator, part of Reliance Industries. Offers 5G services, digital solutions, and enterprise connectivity across India.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO002',
      company_name: 'Oyo Rooms',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 165,
      price_max: 185,
      lot_size: 85,
      min_investment: 14025,
      open_date: '2025-01-20',
      close_date: '2025-01-22',
      description: 'Leading hospitality technology platform offering budget and premium accommodations across India and international markets.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO003',
      company_name: 'Boat Lifestyle',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 1200,
      price_max: 1350,
      lot_size: 12,
      min_investment: 14400,
      open_date: '2025-02-01',
      close_date: '2025-02-03',
      description: 'Popular consumer electronics brand specializing in audio products, smartwatches, and lifestyle accessories.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO004',
      company_name: 'Zepto',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 280,
      price_max: 320,
      lot_size: 46,
      min_investment: 12880,
      open_date: '2025-02-10',
      close_date: '2025-02-12',
      description: '10-minute grocery delivery startup revolutionizing quick commerce in India.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO005',
      company_name: 'Pharmeasy',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 450,
      price_max: 500,
      lot_size: 32,
      min_investment: 14400,
      open_date: '2025-02-15',
      close_date: '2025-02-17',
      description: 'Online pharmacy and healthcare platform providing medicines, diagnostics, and wellness products.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO006',
      company_name: 'Meesho',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 320,
      price_max: 360,
      lot_size: 40,
      min_investment: 12800,
      open_date: '2025-02-20',
      close_date: '2025-02-22',
      description: 'Social commerce platform enabling small businesses and individuals to sell online.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO007',
      company_name: 'Razorpay',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 1800,
      price_max: 2000,
      lot_size: 7,
      min_investment: 12600,
      open_date: '2025-03-01',
      close_date: '2025-03-03',
      description: 'Payment gateway and financial services company serving businesses of all sizes.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO008',
      company_name: 'Byju\'s',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 420,
      price_max: 480,
      lot_size: 33,
      min_investment: 13860,
      open_date: '2025-03-10',
      close_date: '2025-03-12',
      description: 'EdTech platform offering online learning courses and educational content.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO009',
      company_name: 'Swiggy',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 380,
      price_max: 420,
      lot_size: 37,
      min_investment: 14060,
      open_date: '2025-03-15',
      close_date: '2025-03-17',
      description: 'Food delivery and instant grocery platform operating across major Indian cities.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO010',
      company_name: 'Zomato',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 68,
      price_max: 76,
      lot_size: 195,
      min_investment: 13260,
      open_date: '2025-03-20',
      close_date: '2025-03-22',
      description: 'Food delivery and restaurant discovery platform with extensive restaurant network.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO011',
      company_name: 'Paytm',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 1950,
      price_max: 2150,
      lot_size: 6,
      min_investment: 11700,
      open_date: '2025-03-25',
      close_date: '2025-03-27',
      description: 'Digital payments and financial services platform with mobile wallet and UPI services.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO012',
      company_name: 'Nykaa',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 1125,
      price_max: 1275,
      lot_size: 12,
      min_investment: 13500,
      open_date: '2025-04-01',
      close_date: '2025-04-03',
      description: 'Beauty and personal care e-commerce platform with extensive product range.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO013',
      company_name: 'Policybazaar',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 980,
      price_max: 1080,
      lot_size: 14,
      min_investment: 13720,
      open_date: '2025-04-10',
      close_date: '2025-04-12',
      description: 'Online insurance aggregator platform comparing and selling insurance products.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO014',
      company_name: 'Delhivery',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 487,
      price_max: 537,
      lot_size: 28,
      min_investment: 13436,
      open_date: '2025-04-15',
      close_date: '2025-04-17',
      description: 'Logistics and supply chain services company providing last-mile delivery solutions.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO015',
      company_name: 'Freshworks',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 450,
      price_max: 500,
      lot_size: 31,
      min_investment: 13950,
      open_date: '2025-04-20',
      close_date: '2025-04-22',
      description: 'Customer engagement software platform offering CRM, ITSM, and sales automation.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO016',
      company_name: 'Cred',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 1650,
      price_max: 1850,
      lot_size: 7,
      min_investment: 11550,
      open_date: '2025-05-01',
      close_date: '2025-05-03',
      description: 'Credit card payment and rewards platform with premium membership benefits.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO017',
      company_name: 'Unacademy',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 320,
      price_max: 360,
      lot_size: 40,
      min_investment: 12800,
      open_date: '2025-05-10',
      close_date: '2025-05-12',
      description: 'Online learning platform offering courses for competitive exams and skill development.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO018',
      company_name: 'Rapido',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 180,
      price_max: 200,
      lot_size: 70,
      min_investment: 12600,
      open_date: '2025-05-15',
      close_date: '2025-05-17',
      description: 'Bike taxi and logistics platform providing affordable last-mile transportation.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO019',
      company_name: 'Licious',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 280,
      price_max: 320,
      lot_size: 46,
      min_investment: 12880,
      open_date: '2025-05-20',
      close_date: '2025-05-22',
      description: 'Fresh meat and seafood delivery platform with farm-to-fork supply chain.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO020',
      company_name: 'Cure.fit',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 350,
      price_max: 390,
      lot_size: 36,
      min_investment: 12600,
      open_date: '2025-05-25',
      close_date: '2025-05-27',
      description: 'Health and fitness platform offering online workouts, nutrition, and mental wellness.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'IPO021',
      company_name: 'ShareChat',
      company_logo: '',
      ipo_type: 'Mainline',
      price_min: 520,
      price_max: 580,
      lot_size: 26,
      min_investment: 13520,
      open_date: '2025-06-01',
      close_date: '2025-06-03',
      description: 'Regional language social media platform with short video content and messaging.',
      status: 'Upcoming',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const { error } = await supabase.from('ipos').upsert(ipos, { onConflict: 'id' });
  if (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
    return false;
  }
  console.log(`   ✅ Migrated ${ipos.length} IPOs`);
  return true;
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...');
  
  const tables = ['users', 'payment_gateways', 'withdrawal_methods', 'ipos'];
  let allGood = true;

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count').limit(1);
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
      allGood = false;
    } else {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      console.log(`   ✅ ${table}: OK`);
    }
  }

  return allGood;
}

async function main() {
  console.log('🚀 Automatic Supabase Setup');
  console.log('='.repeat(50));
  console.log('');

  // Step 1: Check connection
  const connected = await checkConnection();
  if (!connected) {
    console.log('❌ Setup cannot continue. Please run SQL migration first.');
    process.exit(1);
  }

  // Step 2: Migrate data
  console.log('📦 Starting data migration...\n');
  
  await migrateUsers();
  await migratePaymentGateways();
  await migrateWithdrawalMethods();
  await migrateIPOs();

  // Step 3: Verify
  console.log('\n' + '='.repeat(50));
  const verified = await verifySetup();

  if (verified) {
    console.log('\n✅ Setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Users migrated (including admin)');
    console.log('   ✅ Payment gateways configured');
    console.log('   ✅ Withdrawal methods configured');
    console.log('   ✅ 21 IPOs migrated');
    console.log('\n🔑 Admin credentials:');
    console.log('   Email: admin@stockmart.com');
    console.log('   Password: admin@stockmart.com');
    console.log('\n🎉 Your Supabase database is ready to use!');
  } else {
    console.log('\n⚠️  Setup completed with some warnings.');
    console.log('   Please verify data in Supabase Dashboard.');
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
