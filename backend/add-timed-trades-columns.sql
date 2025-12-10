-- Migration: Add symbol and side columns to timed_trades table
-- Run this in your Supabase SQL Editor if the columns don't exist

-- Add symbol column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timed_trades' AND column_name = 'symbol'
    ) THEN
        ALTER TABLE timed_trades ADD COLUMN symbol TEXT;
    END IF;
END $$;

-- Add side column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timed_trades' AND column_name = 'side'
    ) THEN
        ALTER TABLE timed_trades ADD COLUMN side TEXT CHECK (side IN ('BUY', 'SELL'));
    END IF;
END $$;










