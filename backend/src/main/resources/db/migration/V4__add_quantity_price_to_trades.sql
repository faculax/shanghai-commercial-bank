-- Add quantity and price columns to trades table
ALTER TABLE trades 
ADD COLUMN quantity BIGINT,
ADD COLUMN price DECIMAL(15,6);

-- Add indexes for the new columns
CREATE INDEX idx_trades_quantity ON trades(quantity);
CREATE INDEX idx_trades_price ON trades(price);