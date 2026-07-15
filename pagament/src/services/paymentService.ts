import { randomUUID } from "node:crypto";
import axios from "axios";

import { abacatePayClient } from "../config/abacatePayClient.js";
import { PaymentModel } from "../models/payment.js";
import {
  AbacatePayPixResponse,
  CreatePixRequest,
  PaymentResponse
} from "../types/payment.js";

export class PaymentService {
  private readonly paymentModel: PaymentModel;

  constructor() {
    this.paymentModel = new PaymentModel();
  }

  async createPix(paymentData: CreatePixRequest): Promise<PaymentResponse> {
    this.validateCreatePixData(paymentData);

    const {
      clientId,
      amount,
      description = "Cobrança PIX",
      expiresIn = 3600
    } = paymentData;

    const client = await this.paymentModel.findClientById(clientId);

    if (!client) {
      throw new Error("Cliente não encontrado.");
    }

    const amountInCents = Math.round(amount * 100);
    const externalId = `payment-${randomUUID()}`;

    try {
      const response = await abacatePayClient.post<AbacatePayPixResponse>(
        "/transparents/create",
        {
          method: "PIX",
          data: {
            amount: amountInCents,
            expiresIn,
            description,
            externalId,
            customer: {
              name: client.name,
              email: client.email ?? undefined,
              taxId: client.cpf,
              cellphone: client.telefone ?? undefined
            },
            metadata: {
              externalId,
              clientId
            }
          }
        }
      );

      const abacatePayment = response.data.data;

      if (!abacatePayment) {
        throw new Error(
          response.data.error ??
            "A AbacatePay não retornou os dados da cobrança."
        );
      }

      if (!abacatePayment.devMode) {
        throw new Error(
          "A cobrança não foi criada em devMode. Use uma chave sandbox para simular o pagamento."
        );
      }

      return await this.paymentModel.savePixPayment({
        clientId,
        externalId,
        providerPaymentId: abacatePayment.id,
        amount: abacatePayment.amount,
        description,
        status: abacatePayment.status,
        pixCode: abacatePayment.brCode,
        pixQrCodeBase64: abacatePayment.brCodeBase64,
        receiptUrl: abacatePayment.receiptUrl ?? null,
        expiresAt: abacatePayment.expiresAt
      });
    } catch (error: unknown) {
      throw this.toProviderError(error, "Erro ao criar cobrança na AbacatePay.");
    }
  }

  async getPaymentByIdentifier(identifier: string): Promise<PaymentResponse> {
    const payment = await this.findPayment(identifier);

    if (!payment) {
      throw new Error("Pagamento não encontrado.");
    }

    return payment;
  }

  async getAllPayments(): Promise<PaymentResponse[]> {
    return this.paymentModel.getAll();
  }

  async getAllByMethod(method: "PIX" | "BOLETO"): Promise<PaymentResponse[]> {
    return this.paymentModel.getByMethod(method);
  }

  async checkStatus(identifier: string): Promise<{ provider: AbacatePayPixResponse; payment: PaymentResponse }> {
    const payment = await this.findPayment(identifier);
    if (!payment) throw new Error("Pagamento não encontrado.");
    try {
      const response = await abacatePayClient.get<AbacatePayPixResponse>("/transparents/check", {
        params: { id: payment.provider_payment_id }
      });
      const providerPayment = response.data.data;
      if (!providerPayment) throw new Error(response.data.error ?? "Status não retornado pela AbacatePay.");
      const updated = await this.paymentModel.updateStatus(payment.provider_payment_id, providerPayment.status, providerPayment.receiptUrl ?? null);
      if (!updated) throw new Error("O status foi consultado, mas não pôde ser salvo.");
      return { provider: response.data, payment: updated };
    } catch (error: unknown) {
      throw this.toProviderError(error, "Não foi possível consultar o status do pagamento.");
    }
  }

  async refund(identifier: string, reason?: string): Promise<{ provider: unknown; payment: PaymentResponse }> {
    const payment = await this.findPayment(identifier);
    if (!payment) throw new Error("Pagamento não encontrado.");
    if (payment.method === "BOLETO") throw new Error("A AbacatePay não oferece reembolso de boleto pela API.");
    if (reason !== undefined && (typeof reason !== "string" || reason.trim().length > 255))
      throw new Error("O motivo do reembolso deve possuir no máximo 255 caracteres.");
    try {
      const response = await abacatePayClient.post("/transparents/refund", {
        id: payment.provider_payment_id,
        ...(reason?.trim() ? { reason: reason.trim() } : {})
      });
      const updated = await this.paymentModel.updateStatus(payment.provider_payment_id, "REFUNDED");
      if (!updated) throw new Error("O pagamento foi reembolsado, mas o banco não pôde ser atualizado.");
      return { provider: response.data, payment: updated };
    } catch (error: unknown) {
      throw this.toProviderError(error, "Não foi possível reembolsar o pagamento.");
    }
  }

  async simulatePixPayment(
    identifier: string
  ): Promise<{
    simulation: AbacatePayPixResponse;
    statusCheck: AbacatePayPixResponse;
    payment: PaymentResponse;
  }> {
    const payment = await this.findPayment(identifier);

    if (!payment) {
      throw new Error("Pagamento não encontrado.");
    }

    if (payment.method !== "PIX") {
      throw new Error("A simulação está disponível apenas para PIX.");
    }

    if (payment.status === "PAID") {
      throw new Error("Este pagamento já está marcado como pago.");
    }

    const providerPaymentId = payment.provider_payment_id?.trim();

    if (!providerPaymentId?.startsWith("pix_char_")) {
      throw new Error("O ID da AbacatePay salvo no pagamento é inválido.");
    }

    try {
      const simulationResponse =
        await abacatePayClient.post<AbacatePayPixResponse>(
          "/transparents/simulate-payment",
          {
            metadata: {
              externalId: payment.external_id,
              paymentId: payment.id
            }
          },
          {
            params: {
              id: providerPaymentId
            }
          }
        );

      if (!simulationResponse.data.success || !simulationResponse.data.data) {
        throw new Error(
          simulationResponse.data.error ??
            "A AbacatePay não confirmou a simulação do pagamento."
        );
      }

      const statusResponse =
        await abacatePayClient.get<AbacatePayPixResponse>(
          "/transparents/check",
          {
            params: {
              id: providerPaymentId
            }
          }
        );

      const confirmedPayment = statusResponse.data.data;

      if (!statusResponse.data.success || !confirmedPayment) {
        throw new Error(
          statusResponse.data.error ??
            "A AbacatePay não retornou o status confirmado do pagamento."
        );
      }

      const updatedPayment = await this.paymentModel.updateStatus(
        providerPaymentId,
        confirmedPayment.status,
        confirmedPayment.receiptUrl ?? null
      );

      if (!updatedPayment) {
        throw new Error(
          "O status foi confirmado, mas o pagamento não pôde ser atualizado no banco."
        );
      }

      return {
        simulation: simulationResponse.data,
        statusCheck: statusResponse.data,
        payment: updatedPayment
      };
    } catch (error: unknown) {
      throw this.toProviderError(
        error,
        "Não foi possível simular o pagamento PIX."
      );
    }
  }

  private async findPayment(identifier: string): Promise<PaymentResponse | null> {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier) {
      throw new Error("O identificador do pagamento é obrigatório.");
    }

    if (/^\d+$/.test(normalizedIdentifier)) {
      const localId = Number(normalizedIdentifier);

      if (!Number.isSafeInteger(localId) || localId <= 0) {
        throw new Error("O identificador local do pagamento é inválido.");
      }

      return this.paymentModel.findById(localId);
    }

    if (normalizedIdentifier.startsWith("pix_char_") || normalizedIdentifier.startsWith("bole_")) {
      return this.paymentModel.findByProviderPaymentId(normalizedIdentifier);
    }

    throw new Error("Informe o ID numérico local ou o ID da AbacatePay iniciado por pix_char_.");
  }

  private validateCreatePixData(data: CreatePixRequest): void {
    if (!Number.isInteger(data.clientId) || data.clientId <= 0) {
      throw new Error("O clientId deve ser um número inteiro válido.");
    }

    if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("O valor do pagamento deve ser maior que zero.");
    }

    if (data.amount > 1_000_000) {
      throw new Error(
        "O valor informado ultrapassa o limite permitido pela aplicação."
      );
    }

    if (data.expiresIn !== undefined && (!Number.isInteger(data.expiresIn) || data.expiresIn <= 0)) {
      throw new Error("O expiresIn deve ser um número inteiro positivo.");
    }
  }

  private toProviderError(error: unknown, fallbackMessage: string): Error {
    if (axios.isAxiosError(error)) {
      const responseBody = error.response?.data as | { error?: string; message?: string } | undefined;

      const apiMessage = responseBody?.error ?? responseBody?.message;
      const status = error.response?.status;

      return new Error(apiMessage ?? (status ? `${fallbackMessage} HTTP ${status}.` : fallbackMessage));
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(fallbackMessage);
  }
}
