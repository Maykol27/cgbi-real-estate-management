ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS property_id bigint REFERENCES properties(id);
