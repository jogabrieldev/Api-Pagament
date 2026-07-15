import { createHmac, timingSafeEqual } from "node:crypto";
import axios from "axios";
import { abacatePayClient } from "../config/abacatePayClient.js";
import { WebhookModel } from "../models/webhook.js";
import { ProviderResponse } from "../types/checkout.js";
import { CreateWebhookRequest, WebhookEventPayload, WebhookResponse } from "../types/webhook.js";

export class WebhookService {
  private readonly model = new WebhookModel();

  async create(data: CreateWebhookRequest): Promise<WebhookResponse> {
    if (typeof data.name !== "string" || !data.name.trim()) throw new Error("O nome do webhook é obrigatório.");
    if (typeof data.endpoint !== "string" || !this.isHttpsUrl(data.endpoint)) throw new Error("O endpoint deve ser uma URL HTTPS válida.");
    if (typeof data.secret !== "string" || data.secret.length < 8) throw new Error("O secret deve possuir ao menos 8 caracteres.");
    if (!Array.isArray(data.events) || data.events.length === 0 || data.events.some(event => typeof event !== "string" || !event.trim()))
      throw new Error("Informe ao menos um evento válido.");
    return this.request<WebhookResponse>("post", "/webhooks/create", data);
  }

  async getAll(params: object): Promise<WebhookResponse[]> {
    return this.request<WebhookResponse[]>("get", "/webhooks/list", undefined, params);
  }

  async getById(id: string): Promise<WebhookResponse> {
    this.validateId(id);
    return this.request<WebhookResponse>("get", "/webhooks/get", undefined, { id });
  }

  async delete(id: string): Promise<WebhookResponse> {
    this.validateId(id);
    return this.request<WebhookResponse>("post", "/webhooks/delete", { id });
  }

  async receive(rawBody: Buffer, signature: string | undefined, querySecret: string | undefined, payload: unknown): Promise<boolean> {
    const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    const publicKey = process.env.ABACATEPAY_WEBHOOK_PUBLIC_KEY;
    if (!secret || !publicKey) throw new Error("As variáveis de segurança do webhook não foram configuradas.");
    if (!querySecret || querySecret !== secret) throw new WebhookUnauthorizedError("Secret do webhook inválido.");
    if (!signature || !this.verifySignature(rawBody, signature, publicKey)) throw new WebhookUnauthorizedError("Assinatura do webhook inválida.");
    if (!this.isEvent(payload)) throw new Error("Payload de webhook inválido.");

    const providerId = this.findProviderId(payload.data);
    const status = this.statusForEvent(payload.event);
    return this.model.processEvent(payload, providerId, status);
  }

  private verifySignature(rawBody: Buffer, signature: string, key: string): boolean {
    const expected = createHmac("sha256", key).update(rawBody).digest("base64");
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signature);
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private isEvent(value: unknown): value is WebhookEventPayload {
    if (!value || typeof value !== "object") return false;
    const event = value as Partial<WebhookEventPayload>;
    return typeof event.id === "string" && !!event.id && typeof event.event === "string" &&
      typeof event.apiVersion === "number" && typeof event.devMode === "boolean" &&
      !!event.data && typeof event.data === "object";
  }

  private findProviderId(data: Record<string, unknown>): string | null {
    const candidates = [data.id, data.paymentId, data.checkoutId];
    if (data.payment && typeof data.payment === "object") candidates.push((data.payment as Record<string, unknown>).id);
    return candidates.find(value => typeof value === "string" && (value.startsWith("pix_char_") || value.startsWith("bole_"))) as string | undefined ?? null;
  }

  private statusForEvent(event: string): string | null {
    if (event === "transparent.completed" || event === "checkout.completed") return "PAID";
    if (event === "transparent.refunded" || event === "checkout.refunded") return "REFUNDED";
    if (event === "transparent.disputed" || event === "checkout.disputed") return "DISPUTED";
    return null;
  }

  private isHttpsUrl(value: string): boolean { try { return new URL(value).protocol === "https:"; } catch { return false; } }
  private validateId(id: string): void { if (!id.trim() || !id.startsWith("webh_")) throw new Error("Informe um ID válido iniciado por webh_."); }

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

export class WebhookUnauthorizedError extends Error {}
