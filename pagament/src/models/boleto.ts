import pool from "../config/configDB.js";
import {
  BoletoClientData,
  BoletoPaymentResponse,
  SaveBoletoPaymentData
} from "../types/boleto.js";

export class BoletoModel {
  async findClientById(clientId: number): Promise<BoletoClientData | null> {
    const query = `
      SELECT id, name, cpf, telefone, email
      FROM clients
      WHERE id = $1
    `;

    const result = await pool.query<BoletoClientData>(query, [clientId]);
    return result.rows[0] ?? null;
  }

  async save(payment: SaveBoletoPaymentData): Promise<BoletoPaymentResponse> {
    const query = `
      INSERT INTO payments (
        client_id,
        external_id,
        provider_payment_id,
        method,
        amount,
        description,
        status,
        boleto_bar_code,
        boleto_url,
        pix_code,
        pix_qr_code_base64,
        interest_value,
        fine_value,
        fine_type,
        receipt_url,
        expires_at
      )
      VALUES ($1, $2, $3, 'BOLETO', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      payment.clientId,
      payment.externalId,
      payment.providerPaymentId,
      payment.amount,
      payment.description,
      payment.status,
      payment.barCode,
      payment.boletoUrl,
      payment.pixCode,
      payment.pixQrCodeBase64,
      payment.interestValue,
      payment.fineValue,
      payment.fineType,
      payment.receiptUrl,
      payment.expiresAt
    ];

    const result = await pool.query<BoletoPaymentResponse>(query, values);
    const savedPayment = result.rows[0];
    if (!savedPayment) {
      throw new Error("O boleto foi criado, mas não pôde ser salvo no banco de dados.");
    }

    return savedPayment;
  }

  async findByIdentifier(identifier: string): Promise<BoletoPaymentResponse | null> {
    const isLocalId = /^\d+$/.test(identifier);
    const query = isLocalId
      ? "SELECT * FROM payments WHERE id = $1 AND method = 'BOLETO'"
      : "SELECT * FROM payments WHERE provider_payment_id = $1 AND method = 'BOLETO'";
    const value = isLocalId ? Number(identifier) : identifier;
    const result = await pool.query<BoletoPaymentResponse>(query, [value]);
    return result.rows[0] ?? null;
  }

  async getAll(): Promise<BoletoPaymentResponse[]> {
    const query = `
      SELECT payments.*, clients.name AS client_name
      FROM payments
      INNER JOIN clients ON clients.id = payments.client_id
      WHERE payments.method = 'BOLETO'
      ORDER BY payments.id DESC
    `;

    const result = await pool.query<BoletoPaymentResponse>(query);
    return result.rows;
  }
}
