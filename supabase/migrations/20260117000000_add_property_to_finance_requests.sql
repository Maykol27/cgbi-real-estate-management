-- Add property_id to finance_requests table
ALTER TABLE finance_requests 
ADD COLUMN IF NOT EXISTS property_id BIGINT REFERENCES properties(id);

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_finance_requests_property_id ON finance_requests(property_id);
