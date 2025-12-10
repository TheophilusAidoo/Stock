-- Migration: Add currency columns to trading_settings table
-- Run this in your Supabase SQL Editor if the columns don't exist

-- Add currency_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_settings' AND column_name = 'currency_code'
    ) THEN
        ALTER TABLE trading_settings ADD COLUMN currency_code TEXT DEFAULT 'INR';
    END IF;
END $$;

-- Add currency_symbol column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_settings' AND column_name = 'currency_symbol'
    ) THEN
        ALTER TABLE trading_settings ADD COLUMN currency_symbol TEXT DEFAULT '₹';
    END IF;
END $$;

-- Add locale column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trading_settings' AND column_name = 'locale'
    ) THEN
        ALTER TABLE trading_settings ADD COLUMN locale TEXT DEFAULT 'en-IN';
    END IF;
END $$;

-- Update existing record if it exists
UPDATE trading_settings 
SET 
    currency_code = COALESCE(currency_code, 'INR'),
    currency_symbol = COALESCE(currency_symbol, '₹'),
    locale = COALESCE(locale, 'en-IN')
WHERE id = 'SETTINGS001';

-- Insert default settings if they don't exist
INSERT INTO trading_settings (id, default_profit_rate, currency_code, currency_symbol, locale)
VALUES ('SETTINGS001', 80.00, 'INR', '₹', 'en-IN')
ON CONFLICT (id) DO NOTHING;










