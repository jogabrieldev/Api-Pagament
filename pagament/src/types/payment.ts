export interface ClientPaymentData {
  id: number;
  name: string;
  cpf: string;
  telefone: string | null;
  email: string | null;
}

export interface CreatePixRequest {
  clientId: number;
  amount: number;
  description?: string;
  expiresIn?: number;
}

export interface AbacatePayPaymentData {
  id: string;
  amount: number;
  status: string;
  devMode: boolean;
  brCode: string;
  brCodeBase64: string;
  receiptUrl?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface AbacatePayPixResponse {
  data: AbacatePayPaymentData | null;
  error: string | null;
  success: boolean | { message: string };
}

export interface SavePixPaymentData {
  clientId: number;
  externalId: string;
  providerPaymentId: string;
  amount: number;
  description: string | null;
  status: string;
  pixCode: string;
  pixQrCodeBase64: string;
  receiptUrl: string | null;
  expiresAt: string;
}

export interface PaymentResponse {
  id: number;
  client_id: number;
  external_id: string;
  provider_payment_id: string;
  method: string;
  amount: number;
  description: string | null;
  status: string;
  pix_code: string | null;
  pix_qr_code_base64: string | null;
  receipt_url: string | null;
  expires_at: string | Date | null;
  paid_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  client_name?: string;
  client_cpf?: string;
}