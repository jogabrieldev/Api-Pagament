import { BoletoFine, BoletoInterest } from "./boleto.js";

export type CheckoutMethod = "PIX" | "BOLETO";
export interface CheckoutItem { id: string; quantity: number; }
export interface CreateCheckoutRequest {
  items: CheckoutItem[]; methods?: CheckoutMethod[]; customerId?: string;
  externalId?: string; returnUrl?: string; completionUrl?: string;
  coupons?: string[]; upSellProductId?: string; interest?: BoletoInterest;
  fine?: BoletoFine; metadata?: Record<string, unknown>;
}
export interface CheckoutData {
  id: string; externalId: string | null; url: string; amount: number;
  paidAmount: number | null; items: CheckoutItem[]; status: string;
  receiptUrl: string | null; metadata: Record<string, unknown>;
  createdAt: string; updatedAt: string; [key: string]: unknown;
}
export interface ProviderResponse<T> {
  data: T | null; success: boolean; error: string | null;
  pagination?: Record<string, unknown>;
}
