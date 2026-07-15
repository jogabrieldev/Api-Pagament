import axios from "axios";
import { abacatePayClient } from "../config/abacatePayClient.js";
import { CheckoutData, CreateCheckoutRequest, ProviderResponse } from "../types/checkout.js";

export class CheckoutService {

  async create(data: CreateCheckoutRequest): Promise<CheckoutData> {
    this.validate(data);
    return this.request<CheckoutData>("post", "/checkouts/create", data);
  }

  async getAll(): Promise<CheckoutData[]> {
    return this.request<CheckoutData[]>("get", "/checkouts/list");
  }

  async getById(id: string): Promise<CheckoutData> {
    if (!id.trim() || !id.startsWith("bill_")) throw new Error("Informe um ID válido iniciado por bill_.");
    return this.request<CheckoutData>("get", "/checkouts/get", undefined, { id });
  }

  private validate(data: CreateCheckoutRequest): void {
    if (!Array.isArray(data.items) || data.items.length === 0) throw new Error("Informe ao menos um item.");
    for (const item of data.items) {
      if (!item || typeof item.id !== "string" || !item.id.trim() || !Number.isInteger(item.quantity) || item.quantity <= 0)
        throw new Error("Cada item deve possuir id e quantity inteiro maior que zero.");
    }
    if (data.methods !== undefined && (!Array.isArray(data.methods) || data.methods.length === 0 || data.methods.some(m => m !== "PIX" && m !== "BOLETO")))
      throw new Error("Os métodos permitidos neste back-end são PIX e BOLETO.");
  }

  private async request<T>(method: "get" | "post", url: string, data?: unknown, params?: Record<string, string>): Promise<T> {
    try {
      const response = await abacatePayClient.request<ProviderResponse<T>>({ method, url, data, params });
      if (!response.data.success || response.data.data === null) throw new Error(response.data.error ?? "Dados não retornados pela AbacatePay.");
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const body = error.response?.data as { error?: string; message?: string } | undefined;
        throw new Error(body?.error ?? body?.message ?? "Erro ao comunicar com a AbacatePay.");
      }
      throw error instanceof Error ? error : new Error("Erro ao comunicar com a AbacatePay.");
    }
  }
  
}
