CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  dev_mode BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events (event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events (created_at DESC);
