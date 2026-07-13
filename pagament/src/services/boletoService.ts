import { randomUUID } from "node:crypto";
import axios from "axios";

import { abacatePayClient } from "../config/abacatePayClient.js";
import { BoletoModel } from "../models/boleto.js";
import {
  AbacatePayBoletoResponse,
  BoletoPaymentResponse,
  CreateBoletoRequest
} from "../types/boleto.js";

export class BoletoService {
  private readonly boletoModel: BoletoModel;

  constructor() {
    this.boletoModel = new BoletoModel();
  }

  async create(data: CreateBoletoRequest): Promise<BoletoPaymentResponse> {
    this.validateCreateData(data);

    const client = await this.boletoModel.findClientById(data.clientId);
    if (!client) {
      throw new Error("Cliente não encontrado.");
    }

    const description = data.description?.trim() || "Cobrança por boleto";
    const externalId = `boleto-${randomUUID()}`;
    const amountInCents = Math.round(data.amount * 100);

    try {
      const response = await abacatePayClient.post<AbacatePayBoletoResponse>(
        "/transparents/create",
        {
          method: "BOLETO",
          data: {
            amount: amountInCents,
            description,
            externalId,
            customer: {
              name: client.name,
              taxId: client.cpf,
              email: client.email ?? undefined,
              cellphone: client.telefone ?? undefined
            },
            metadata: {
              externalId,
              clientId: data.clientId
            },
            ...(data.interest ? { interest: data.interest } : {}),
            ...(data.fine ? { fine: data.fine } : {})
          }
        }
      );

      const boleto = response.data.data;
      if (!boleto) {
        throw new Error(
          response.data.error ?? "A AbacatePay não retornou os dados do boleto."
        );
      }

      return await this.boletoModel.save({
        clientId: data.clientId,
        externalId,
        providerPaymentId: boleto.id,
        amount: boleto.amount,
        description,
        status: boleto.status,
        barCode: boleto.barCode,
        boletoUrl: boleto.url,
        pixCode: boleto.brCode,
        pixQrCodeBase64: boleto.brCodeBase64,
        interestValue: boleto.interest?.value ?? null,
        fineValue: boleto.fine?.value ?? null,
        fineType: boleto.fine?.type ?? null,
        receiptUrl: boleto.receiptUrl ?? null,
        expiresAt: boleto.expiresAt
      });
    } catch (error: unknown) {
      throw this.toProviderError(error, "Erro ao criar boleto na AbacatePay.");
    }
  }

  async getByIdentifier(identifier: string): Promise<BoletoPaymentResponse> {
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      throw new Error("O identificador do boleto é obrigatório.");
    }

    const isLocalId = /^\d+$/.test(normalizedIdentifier);
    const isProviderId = normalizedIdentifier.startsWith("bole_");
    if (!isLocalId && !isProviderId) {
      throw new Error("Informe o ID numérico local ou o ID da AbacatePay iniciado por bole_.");
    }

    if (isLocalId) {
      const localId = Number(normalizedIdentifier);
      if (!Number.isSafeInteger(localId) || localId <= 0) {
        throw new Error("O identificador local do boleto é inválido.");
      }
    }

    const boleto = await this.boletoModel.findByIdentifier(normalizedIdentifier);
    if (!boleto) {
      throw new Error("Boleto não encontrado.");
    }

    return boleto;
  }

  async getAll(): Promise<BoletoPaymentResponse[]> {
    return this.boletoModel.getAll();
  }

  private validateCreateData(data: CreateBoletoRequest): void {
    if (!Number.isInteger(data.clientId) || data.clientId <= 0) {
      throw new Error("O clientId deve ser um número inteiro válido.");
    }

    if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("O valor do boleto deve ser maior que zero.");
    }

    if (data.amount > 1_000_000) {
      throw new Error("O valor informado ultrapassa o limite permitido pela aplicação.");
    }

    if (data.description !== undefined &&
        (typeof data.description !== "string" || data.description.trim().length > 255)) {
      throw new Error("A descrição do boleto deve possuir no máximo 255 caracteres.");
    }

    if (data.interest !== undefined &&
        (!Number.isInteger(data.interest.value) || data.interest.value < 0)) {
      throw new Error("O valor dos juros deve ser um número inteiro maior ou igual a zero.");
    }

    if (data.fine !== undefined) {
      if (!Number.isInteger(data.fine.value) || data.fine.value < 0) {
        throw new Error("O valor da multa deve ser um número inteiro maior ou igual a zero.");
      }

      if (data.fine.type !== "PERCENTAGE" && data.fine.type !== "FIXED") {
        throw new Error("O tipo da multa deve ser PERCENTAGE ou FIXED.");
      }
    }
  }

  private toProviderError(error: unknown, fallbackMessage: string): Error {
    if (axios.isAxiosError(error)) {
      const body = error.response?.data as
        | { error?: string; message?: string }
        | undefined;
      const status = error.response?.status;
      return new Error(
        body?.error ?? body?.message ??
          (status ? `${fallbackMessage} HTTP ${status}.` : fallbackMessage)
      );
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
  }
}
