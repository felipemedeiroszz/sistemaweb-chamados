-- Add expected resolution deadline for tickets placed in 'aguardando'
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS expected_resolution_at TIMESTAMP WITH TIME ZONE;

-- Optional: index to filter/sort by expected deadlines
CREATE INDEX IF NOT EXISTS idx_tickets_expected_resolution_at ON tickets(expected_resolution_at);
