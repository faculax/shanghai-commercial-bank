-- Add is_original column to trades table to distinguish between original and consolidated trades
ALTER TABLE trades ADD COLUMN is_original BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing trades to be marked as original
UPDATE trades SET is_original = TRUE WHERE is_original IS NULL;