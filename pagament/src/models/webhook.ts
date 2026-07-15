import pool from "../config/configDB.js";
import { WebhookEventPayload } from "../types/webhook.js";

export class WebhookModel {
  async processEvent(event: WebhookEventPayload, providerPaymentId: string | null, status: string | null): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `INSERT INTO webhook_events (event_id, event_type, dev_mode, payload)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (event_id) DO NOTHING
         RETURNING event_id`,
        [event.id, event.event, event.devMode, JSON.stringify(event)]
      );
      if (inserted.rowCount === 0) {
        await client.query("ROLLBACK");
        return false;
      }
      if (providerPaymentId && status) {
        await client.query(
          `UPDATE payments SET status = $1,
             paid_at = CASE WHEN $1 = 'PAID' THEN COALESCE(paid_at, CURRENT_TIMESTAMP) ELSE paid_at END,
             updated_at = CURRENT_TIMESTAMP
           WHERE provider_payment_id = $2`,
          [status, providerPaymentId]
        );
      }
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
