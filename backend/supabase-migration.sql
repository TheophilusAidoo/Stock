-- ============================================
-- Supabase Database Migration Script
-- StockMart Trading Platform
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  mobile TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  address TEXT,
  pan TEXT,
  aadhaar TEXT,
  profile_photo TEXT,
  email_verified BOOLEAN DEFAULT false,
  mobile_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  default_deposit_method TEXT,
  default_withdrawal_method TEXT,
  notification_preferences JSONB DEFAULT '{}',
  segment TEXT[] DEFAULT '{}',
  kyc_status TEXT CHECK (kyc_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  balance NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- ============================================
-- 2. PAYMENT GATEWAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_gateways (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trc20_address TEXT,
  trc20_qr_code TEXT,
  min_deposit NUMERIC(10, 2) DEFAULT 0,
  confirmation_time TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_gateways_active ON payment_gateways(is_active);

-- ============================================
-- 3. WITHDRAWAL METHODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawal_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  min_amount NUMERIC(10, 2) NOT NULL,
  fee NUMERIC(10, 2) DEFAULT 0,
  processing_time TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_methods_active ON withdrawal_methods(is_active);

-- ============================================
-- 4. WALLET TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_txns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  type TEXT CHECK (type IN ('deposit', 'withdrawal')) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  channel TEXT NOT NULL,
  gateway_id TEXT REFERENCES payment_gateways(id),
  method_id TEXT REFERENCES withdrawal_methods(id),
  withdrawal_account TEXT,
  withdrawal_details JSONB,
  fee NUMERIC(10, 2) DEFAULT 0,
  final_amount NUMERIC(15, 2),
  rejection_reason TEXT,
  screenshot_data TEXT,
  screenshot_type TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'approved', 'rejected')) DEFAULT 'pending',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_txns_user_id ON wallet_txns(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_type ON wallet_txns(type);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_status ON wallet_txns(status);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_timestamp ON wallet_txns(timestamp DESC);

-- ============================================
-- 5. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT CHECK (side IN ('BUY', 'SELL')) NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(15, 2) NOT NULL,
  status TEXT CHECK (status IN ('Executed', 'Pending')) DEFAULT 'Pending',
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- 6. POSITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  avg_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ltp NUMERIC(15, 2) DEFAULT 0,
  invested NUMERIC(15, 2) DEFAULT 0,
  current_value NUMERIC(15, 2) DEFAULT 0,
  pnl NUMERIC(15, 2) DEFAULT 0,
  pnl_percent NUMERIC(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);

-- ============================================
-- 7. REALIZED PNL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS realized_pnl (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  buy_price NUMERIC(15, 2) NOT NULL,
  sell_price NUMERIC(15, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  pnl NUMERIC(15, 2) NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_realized_pnl_user_id ON realized_pnl(user_id);
CREATE INDEX IF NOT EXISTS idx_realized_pnl_executed_at ON realized_pnl(executed_at DESC);

-- ============================================
-- 8. IPOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ipos (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_logo TEXT,
  ipo_type TEXT CHECK (ipo_type IN ('Mainline', 'SME')) NOT NULL,
  price_min NUMERIC(15, 2) NOT NULL,
  price_max NUMERIC(15, 2) NOT NULL,
  lot_size INTEGER NOT NULL,
  min_investment NUMERIC(15, 2) NOT NULL,
  open_date DATE NOT NULL,
  close_date DATE NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('Upcoming', 'Live', 'Closed')) DEFAULT 'Upcoming',
  is_active BOOLEAN DEFAULT true,
  -- Discount fields
  ipo_price NUMERIC(15, 2),
  discount_type TEXT CHECK (discount_type IN ('Percentage', 'Fixed')),
  discount_value NUMERIC(10, 2),
  final_price NUMERIC(15, 2),
  show_discount BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ipos_status ON ipos(status);
CREATE INDEX IF NOT EXISTS idx_ipos_is_active ON ipos(is_active);
CREATE INDEX IF NOT EXISTS idx_ipos_open_date ON ipos(open_date);
CREATE INDEX IF NOT EXISTS idx_ipos_close_date ON ipos(close_date);

-- ============================================
-- 9. IPO APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ipo_applications (
  id TEXT PRIMARY KEY,
  ipo_id TEXT NOT NULL REFERENCES ipos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  lots INTEGER NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  status TEXT CHECK (status IN ('Pending Allotment', 'Allotted', 'Not Allotted')) DEFAULT 'Pending Allotment',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  allotted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ipo_applications_ipo_id ON ipo_applications(ipo_id);
CREATE INDEX IF NOT EXISTS idx_ipo_applications_user_id ON ipo_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ipo_applications_status ON ipo_applications(status);
CREATE INDEX IF NOT EXISTS idx_ipo_applications_applied_at ON ipo_applications(applied_at DESC);

-- ============================================
-- 10. KYC REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kycs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  document_name TEXT,
  document_size INTEGER,
  document_data TEXT, -- Base64 encoded file data
  document_type TEXT, -- MIME type
  payload JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kycs_user_id ON kycs(user_id);
CREATE INDEX IF NOT EXISTS idx_kycs_status ON kycs(status);
CREATE INDEX IF NOT EXISTS idx_kycs_submitted_at ON kycs(submitted_at DESC);

-- ============================================
-- 11. SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT CHECK (category IN ('Deposit', 'Withdrawal', 'IPO', 'Trading', 'KYC', 'Other')) NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist, then create them
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_gateways_updated_at ON payment_gateways;
CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON payment_gateways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_withdrawal_methods_updated_at ON withdrawal_methods;
CREATE TRIGGER update_withdrawal_methods_updated_at BEFORE UPDATE ON withdrawal_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ipos_updated_at ON ipos;
CREATE TRIGGER update_ipos_updated_at BEFORE UPDATE ON ipos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_txns ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE realized_pnl ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kycs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Public read access for IPOs and payment gateways (users need to see them)
ALTER TABLE ipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
-- Drop policies if they exist, then create them
DROP POLICY IF EXISTS "Users can view own data" ON wallet_txns;
CREATE POLICY "Users can view own data" ON wallet_txns
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own positions" ON positions;
CREATE POLICY "Users can view own positions" ON positions
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own realized pnl" ON realized_pnl;
CREATE POLICY "Users can view own realized pnl" ON realized_pnl
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own ipo applications" ON ipo_applications;
CREATE POLICY "Users can view own ipo applications" ON ipo_applications
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own kycs" ON kycs;
CREATE POLICY "Users can view own kycs" ON kycs
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can view own support tickets" ON support_tickets;
CREATE POLICY "Users can view own support tickets" ON support_tickets
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Public read access for IPOs and payment methods
DROP POLICY IF EXISTS "Public can view active IPOs" ON ipos;
CREATE POLICY "Public can view active IPOs" ON ipos
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active payment gateways" ON payment_gateways;
CREATE POLICY "Public can view active payment gateways" ON payment_gateways
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active withdrawal methods" ON withdrawal_methods;
CREATE POLICY "Public can view active withdrawal methods" ON withdrawal_methods
  FOR SELECT USING (is_active = true);

-- ============================================
-- 12. TIMER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS timer_settings (
  id TEXT PRIMARY KEY,
  timer_duration INTEGER NOT NULL UNIQUE, -- Duration in minutes (1, 5, 10, 15, 60)
  timer_label TEXT NOT NULL, -- Display label (e.g., "1min", "5min", "1hour")
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timer_settings_enabled ON timer_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_timer_settings_duration ON timer_settings(timer_duration);

-- ============================================
-- 13. TRADING SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trading_settings (
  id TEXT PRIMARY KEY DEFAULT 'SETTINGS001',
  default_profit_rate NUMERIC(5, 2) DEFAULT 80.00, -- Default profit rate percentage
  currency_code TEXT DEFAULT 'INR', -- Currency code (e.g., 'INR', 'USD', 'EUR')
  currency_symbol TEXT DEFAULT '₹', -- Currency symbol (e.g., '₹', '$', '€')
  locale TEXT DEFAULT 'en-IN', -- Locale for number formatting (e.g., 'en-IN', 'en-US')
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. TIMED TRADES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS timed_trades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  symbol TEXT,
  side TEXT CHECK (side IN ('BUY', 'SELL')),
  amount NUMERIC(15, 2) NOT NULL,
  timer_duration INTEGER NOT NULL, -- Duration in minutes
  timer_label TEXT NOT NULL,
  profit_rate NUMERIC(5, 2) NOT NULL, -- Profit rate at time of trade
  status TEXT CHECK (status IN ('pending', 'win', 'lose', 'draw')) DEFAULT 'pending',
  profit_amount NUMERIC(15, 2) DEFAULT 0,
  result_set_by TEXT, -- Admin user ID who set the result
  result_set_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL, -- When the timer expires
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timed_trades_user_id ON timed_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_timed_trades_status ON timed_trades(status);
CREATE INDEX IF NOT EXISTS idx_timed_trades_created_at ON timed_trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timed_trades_expires_at ON timed_trades(expires_at);

-- Drop triggers if they exist, then create them
DROP TRIGGER IF EXISTS update_timer_settings_updated_at ON timer_settings;
CREATE TRIGGER update_timer_settings_updated_at BEFORE UPDATE ON timer_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trading_settings_updated_at ON trading_settings;
CREATE TRIGGER update_trading_settings_updated_at BEFORE UPDATE ON trading_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE timer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE timed_trades ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view enabled timer settings
DROP POLICY IF EXISTS "Public can view enabled timers" ON timer_settings;
CREATE POLICY "Public can view enabled timers" ON timer_settings
  FOR SELECT USING (is_enabled = true);

-- Policy: Public can view trading settings
DROP POLICY IF EXISTS "Public can view trading settings" ON trading_settings;
CREATE POLICY "Public can view trading settings" ON trading_settings
  FOR SELECT USING (true);

-- Policy: Users can view own timed trades
DROP POLICY IF EXISTS "Users can view own timed trades" ON timed_trades;
CREATE POLICY "Users can view own timed trades" ON timed_trades
  FOR SELECT USING (auth.uid()::text = user_id);

-- ============================================
-- 15. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('IPO Alerts', 'Deposit & Withdrawal updates', 'Approval notifications', 'System alerts')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);

-- Note: For now, we'll use service role key for admin operations
-- You can add more granular RLS policies later based on your auth setup

