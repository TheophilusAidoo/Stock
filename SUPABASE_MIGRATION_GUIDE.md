# Supabase Migration Guide

This guide documents the migration from in-memory arrays to Supabase database.

## ✅ Completed Migrations

### 1. Database Schema
- ✅ Created `supabase-migration.sql` with all table definitions
- ✅ Tables created: users, payment_gateways, withdrawal_methods, wallet_txns, orders, positions, realized_pnl, ipos, ipo_applications, kycs, support_tickets

### 2. Service Updates
- ✅ Added SupabaseService injection to PlatformService
- ✅ Updated `login()` method to use Supabase
- ✅ Updated `register()` method to use Supabase
- ✅ Updated `adminUsers()` method to use Supabase
- ✅ Updated `walletHistoryFeed()` method to use Supabase
- ✅ Updated `deposit()` method to use Supabase

### 3. Helper Functions
- ✅ Created `supabase-helpers.ts` with mapping functions for all data types

## 🔄 Remaining Migrations

The following methods still need to be migrated to Supabase:

### User Management
- [ ] `approveUser(id)` - Update user status in Supabase
- [ ] `rejectUser(id)` - Update user status in Supabase
- [ ] `getUserProfile(userId)` - Fetch from Supabase
- [ ] `updateUserProfile(userId, data)` - Update in Supabase
- [ ] `changePassword(userId, oldPassword, newPassword)` - Update in Supabase
- [ ] `toggle2FA(userId)` - Update in Supabase
- [ ] `updateNotificationPreferences(userId, prefs)` - Update in Supabase
- [ ] `updateWalletPreferences(userId, prefs)` - Update in Supabase

### Wallet Operations
- [ ] `withdraw()` - Insert withdrawal transaction
- [ ] `approveDeposit(id)` - Update transaction and user balance
- [ ] `rejectDeposit(id)` - Update transaction status
- [ ] `approveWithdrawal(id)` - Update transaction and user balance
- [ ] `rejectWithdrawal(id)` - Update transaction status
- [ ] `getPendingDeposits()` - Query from Supabase
- [ ] `getAllDeposits(userId?)` - Query from Supabase
- [ ] `getAllWithdrawals(userId?)` - Query from Supabase
- [ ] `walletBalance(userId)` - Query user balance from Supabase

### Payment Gateways & Withdrawal Methods
- [ ] `getPaymentGateways()` - Query from Supabase
- [ ] `getAllPaymentGateways()` - Query from Supabase
- [ ] `addPaymentGateway()` - Insert into Supabase
- [ ] `updatePaymentGateway()` - Update in Supabase
- [ ] `deletePaymentGateway()` - Delete from Supabase
- [ ] `getPaymentGatewayById()` - Query from Supabase
- [ ] `getWithdrawalMethods()` - Query from Supabase
- [ ] `getAllWithdrawalMethods()` - Query from Supabase
- [ ] `addWithdrawalMethod()` - Insert into Supabase
- [ ] `updateWithdrawalMethod()` - Update in Supabase
- [ ] `deleteWithdrawalMethod()` - Delete from Supabase

### Trading Operations
- [ ] `placeOrder()` - Insert order and update position
- [ ] `listOrders(userId?)` - Query from Supabase
- [ ] `listPositions(userId?)` - Query from Supabase
- [ ] `getPortfolioSummary(userId)` - Calculate from Supabase data
- [ ] `getRealizedPnl(userId?)` - Query from Supabase

### IPO Operations
- [ ] `getIpos()` - Query from Supabase
- [ ] `getAllIpos()` - Query from Supabase
- [ ] `addIpo()` - Insert into Supabase
- [ ] `updateIpo()` - Update in Supabase
- [ ] `deleteIpo()` - Delete from Supabase
- [ ] `applyForIpo()` - Insert application and block balance
- [ ] `getUserIpoApplications(userId)` - Query from Supabase
- [ ] `getIpoApplications(ipoId)` - Query from Supabase
- [ ] `approveIpoApplication()` - Update application and deduct balance
- [ ] `rejectIpoApplication()` - Update application and unblock balance

### KYC Operations
- [ ] `submitKyc()` - Insert into Supabase
- [ ] `adminKycs()` - Query from Supabase
- [ ] `approveKyc()` - Update KYC status
- [ ] `rejectKyc()` - Update KYC status

### Support Tickets
- [ ] `createSupportTicket()` - Insert into Supabase
- [ ] `getUserSupportTickets(userId)` - Query from Supabase
- [ ] `getSupportTicket(id)` - Query from Supabase

### Admin Operations
- [ ] `getAdminOverview()` - Aggregate queries from Supabase
- [ ] `getUserNotifications(userId)` - Query from Supabase

## Migration Pattern

For each method, follow this pattern:

```typescript
async methodName(...args) {
  const supabase = this.supabaseService.getAdminClient();
  
  // 1. Try Supabase operation
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('field', value);
    
    if (data && !error) {
      // Map from database format using helper functions
      return data.map(row => mapFromDb(row));
    }
  } catch (error) {
    console.error('Supabase error:', error);
  }
  
  // 2. Fallback to in-memory array
  return this.inMemoryArray.find(...);
}
```

## Data Migration

1. Run the SQL migration script in Supabase SQL Editor:
   ```bash
   # Copy contents of supabase-migration.sql
   # Paste into Supabase Dashboard > SQL Editor > New Query
   # Execute
   ```

2. Run the data migration script:
   ```bash
   cd backend
   npx ts-node migrate-data.ts
   ```

3. Verify data in Supabase Dashboard

## Testing

After migration:
1. Test all user endpoints
2. Test all admin endpoints
3. Test wallet operations
4. Test IPO operations
5. Test trading operations
6. Verify data persistence across server restarts

## Notes

- All methods maintain backward compatibility with in-memory arrays as fallback
- Supabase operations use the admin client (service role key) for full access
- Row Level Security (RLS) is enabled but policies allow service role access
- All timestamps are stored as TIMESTAMPTZ in Supabase
- JSON fields (notification_preferences, withdrawal_details, payload) are stored as JSONB












