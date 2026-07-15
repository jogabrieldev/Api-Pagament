import axios from "axios";
import { abacatePayClient } from "../config/abacatePayClient.js";
import { ProviderResponse } from "../types/checkout.js";
import { CreateProductRequest, ProductListParams, ProductResponse } from "../types/product.js";

export class ProductService {
  async create(data: CreateProductRequest): Promise<ProductResponse> {
    this.validateCreate(data);
    return this.request<ProductResponse>("post", "/products/create", data);
  }

  async getAll(params: ProductListParams): Promise<ProductResponse[]> {
    if (params.limit !== undefined && (!Number.isInteger(params.limit) || params.limit < 1 || params.limit > 100))
      throw new Error("O limit deve ser um inteiro entre 1 e 100.");
    return this.request<ProductResponse[]>("get", "/products/list", undefined, params);
  }

  async getById(id: string): Promise<ProductResponse> {
    this.validateId(id);
    return this.request<ProductResponse>("get", "/products/get", undefined, { id });
  }

  async delete(id: string): Promise<ProductResponse> {
    this.validateId(id);
    return this.request<ProductResponse>("post", "/products/delete", { id });
  }

  private validateCreate(data: CreateProductRequest): void {
    if (typeof data.externalId !== "string" || !data.externalId.trim()) throw new Error("O externalId é obrigatório.");
    if (typeof data.name !== "string" || !data.name.trim()) throw new Error("O nome do produto é obrigatório.");
    if (!Number.isInteger(data.price) || data.price < 1) throw new Error("O preço deve ser informado em centavos e ser maior que zero.");
    if (data.currency !== "BRL") throw new Error("A moeda do produto deve ser BRL.");
    const cycles = ["WEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUALLY", "ANNUALLY"];
    if (data.cycle !== undefined && data.cycle !== null && !cycles.includes(data.cycle)) throw new Error("O ciclo do produto é inválido.");
    if (data.trialDays !== undefined && (!data.cycle || !Number.isInteger(data.trialDays) || data.trialDays < 1 || data.trialDays > 90))
      throw new Error("trialDays exige cycle e deve ser um inteiro entre 1 e 90.");
  }

  private validateId(id: string): void {
    if (!id.trim() || !id.startsWith("prod_")) throw new Error("Informe um ID de produto válido iniciado por prod_.");
  }

  private async request<T>(method: "get" | "post", url: string, data?: unknown, params?: object): Promise<T> {
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
