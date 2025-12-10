/**
 * Data Migration Script
 * Migrates existing in-memory data to Supabase
 * 
 * Run this script after creating tables in Supabase:
 * npx ts-node migrate-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Import the service to get existing data
// Note: This requires the service to export its data or we read it directly
async function migrateData() {
  console.log('🚀 Starting data migration to Supabase...\n');

  try {
    // 1. Migrate Users
    console.log('📦 Migrating users...');
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

    const { error: usersError } = await supabase.from('users').upsert(users, { onConflict: 'id' });
    if (usersError) {
      console.error('❌ Error migrating users:', usersError);
    } else {
      console.log(`✅ Migrated ${users.length} users`);
    }

    // 2. Migrate Payment Gateways
    console.log('\n📦 Migrating payment gateways...');
    const paymentGateways = [
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

    const { error: gwError } = await supabase.from('payment_gateways').upsert(paymentGateways, { onConflict: 'id' });
    if (gwError) {
      console.error('❌ Error migrating payment gateways:', gwError);
    } else {
      console.log(`✅ Migrated ${paymentGateways.length} payment gateways`);
    }

    // 3. Migrate Withdrawal Methods
    console.log('\n📦 Migrating withdrawal methods...');
    const withdrawalMethods = [
      {
        id: 'WM001',
        name: 'TRC20 USDT',
        type: 'trc20',
        min_amount: 50,
        fee: 2,
        processing_time: '1-2 hours',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'WM002',
        name: 'Bank Transfer',
        type: 'bank',
        min_amount: 100,
        fee: 5,
        processing_time: '1-3 business days',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'WM003',
        name: 'Binance Pay',
        type: 'binance',
        min_amount: 20,
        fee: 1,
        processing_time: '30 minutes - 2 hours',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    const { error: wmError } = await supabase.from('withdrawal_methods').upsert(withdrawalMethods, { onConflict: 'id' });
    if (wmError) {
      console.error('❌ Error migrating withdrawal methods:', wmError);
    } else {
      console.log(`✅ Migrated ${withdrawalMethods.length} withdrawal methods`);
    }

    // 4. Migrate IPOs (from the service - you'll need to copy the IPO data)
    console.log('\n📦 Migrating IPOs...');
    console.log('⚠️  Note: IPO data needs to be migrated manually or extracted from platform.service.ts');
    console.log('   Run the IPO migration after creating IPOs in the admin panel');

    console.log('\n✅ Data migration completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify data in Supabase dashboard');
    console.log('   2. Update platform.service.ts to use Supabase');
    console.log('   3. Test all endpoints');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData().then(() => {
  console.log('\n✨ Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});



