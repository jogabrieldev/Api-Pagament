import pool from "../config/configDB.js";

import {
  ClientPaymentData,
  PaymentResponse,
  SavePixPaymentData
} from "../types/payment.js";

export class PaymentModel {
  async findClientById(clientId: number): Promise<ClientPaymentData | null> {
    const query = `
      SELECT id, name, cpf, telefone, email
      FROM clients
      WHERE id = $1
    `;

    const result = await pool.query<ClientPaymentData>(query, [clientId]);
    return result.rows[0] ?? null;
  }

  async savePixPayment(payment: SavePixPaymentData): Promise<any> {
    const query = `
      INSERT INTO payments (
        client_id,
        external_id,
        provider_payment_id,
        method,
        amount,
        description,
        status,
        pix_code,
        pix_qr_code_base64,
        receipt_url,
        expires_at
      )
      VALUES ($1, $2, $3, 'PIX', $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      payment.clientId,
      payment.externalId,
      payment.providerPaymentId,
      payment.amount,
      payment.description,
      payment.status,
      payment.pixCode,
      payment.pixQrCodeBase64,
      payment.receiptUrl,
      payment.expiresAt
    ];

    const result = await pool.query<PaymentResponse>(query, values);
   
    return result.rows[0];
  }

  async findById(paymentId: number): Promise<PaymentResponse | null> {
    const query = `SELECT * FROM payments WHERE id = $1`;
    const result = await pool.query<PaymentResponse>(query, [paymentId]);
    return result.rows[0] ?? null;
  }

    async findByProviderPaymentId(providerPaymentId: string): Promise<PaymentResponse | null> {
        const query = `
          SELECT *
          FROM payments
          WHERE provider_payment_id = $1
        `;
        const result = await pool.query<PaymentResponse>(query, [providerPaymentId]);
        return result.rows[0] ?? null;
    }

    async getAll(): Promise<PaymentResponse[]> {
        const query = `
           SELECT
           payments.*,
           clients.name AS client_name,
           clients.cpf AS client_cpf
           FROM payments
           INNER JOIN clients ON clients.id = payments.client_id
           ORDER BY payments.id DESC
        `;
       const result = await pool.query<PaymentResponse>(query);
       return result.rows;
    }

    async updateStatus(providerPaymentId: string, status: string, receiptUrl?: string | null): Promise<PaymentResponse | null> {
        const query = `
          UPDATE payments
          SET
           status = $1,
           receipt_url = COALESCE($2, receipt_url),
           paid_at = CASE
           WHEN $1 = 'PAID' THEN COALESCE(paid_at, CURRENT_TIMESTAMP)
           ELSE paid_at
           END,
           updated_at = CURRENT_TIMESTAMP
           WHERE provider_payment_id = $3
          RETURNING *
       `;

       const values = [status, receiptUrl ?? null, providerPaymentId];
       const result = await pool.query<PaymentResponse>(query, values);
       return result.rows[0] ?? null;
    }
}