import { ClientPaymentData, PaymentResponse } from "./payment.js";

export type BoletoFineType = "PERCENTAGE" | "FIXED";

export interface BoletoInterest {
  value: number;
}

export interface BoletoFine {
  value: number;
  type: BoletoFineType;
}

export interface CreateBoletoRequest {
  clientId: number;
  amount: number;
  description?: string;
  interest?: BoletoInterest;
  fine?: BoletoFine;
}

export interface AbacatePayBoletoData {
  id: string;
  amount: number;
  status: string;
  devMode: boolean;
  barCode: string;
  url: string;
  brCode: string;
  brCodeBase64: string;
  platformFee: number;
  interest?: BoletoInterest | null;
  fine?: BoletoFine | null;
  receiptUrl?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface AbacatePayBoletoResponse {
  data: AbacatePayBoletoData | null;
  error: string | null;
  success: boolean | { message: string };
}

export interface SaveBoletoPaymentData {
  clientId: number;
  externalId: string;
  providerPaymentId: string;
  amount: number;
  description: string | null;
  status: string;
  barCode: string;
  boletoUrl: string;
  pixCode: string;
  pixQrCodeBase64: string;
  interestValue: number | null;
  fineValue: number | null;
  fineType: BoletoFineType | null;
  receiptUrl: string | null;
  expiresAt: string;
}

export interface BoletoPaymentResponse extends PaymentResponse {
  boleto_bar_code: string | null;
  boleto_url: string | null;
  interest_value: number | null;
  fine_value: number | null;
  fine_type: BoletoFineType | null;
}

export type BoletoClientData = ClientPaymentData;
