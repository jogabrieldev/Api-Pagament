BEGIN;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS boleto_bar_code TEXT,
  ADD COLUMN IF NOT EXISTS boleto_url TEXT,
  ADD COLUMN IF NOT EXISTS interest_value INTEGER,
  ADD COLUMN IF NOT EXISTS fine_value INTEGER,
  ADD COLUMN IF NOT EXISTS fine_type VARCHAR(20);

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_fine_type_check;

ALTER TABLE payments
  ADD CONSTRAINT payments_fine_type_check
  CHECK (fine_type IS NULL OR fine_type IN ('PERCENTAGE', 'FIXED'));

CREATE INDEX IF NOT EXISTS idx_payments_method
  ON payments (method);

COMMIT;
