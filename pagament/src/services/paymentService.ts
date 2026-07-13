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

  async simulatePixPayment(identifier: string): Promise<{provider: AbacatePayPixResponse;payment: PaymentResponse;}> {
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
    if (!payment.provider_payment_id?.startsWith("pix_char_")) {
      throw new Error("O ID da AbacatePay salvo no pagamento é inválido.");
    }
    try {
        const response = await abacatePayClient.post<AbacatePayPixResponse>("/transparents/simulate-payment",{
            metadata: {
             externalId: payment.external_id,
             paymentId: payment.id
            }},
            {
                params: {
                 id: payment.provider_payment_id
                }
            }
        );
        const simulatedPayment = response.data.data;
        if (!simulatedPayment) {
         throw new Error(response.data.error ?? "A AbacatePay não retornou os dados do pagamento simulado.");
        }
        const updatedPayment = await this.paymentModel.updateStatus(
         payment.provider_payment_id,
         simulatedPayment.status,
         simulatedPayment.receiptUrl ?? null
        );

        if(!updatedPayment){
         throw new Error("O pagamento foi simulado, mas o banco não foi atualizado.");
        }
 
        return {
         provider: response.data,
         payment: updatedPayment
        };
    } catch (error: unknown) {
      throw this.toProviderError(
        error,
        "Não foi possível simular o pagamento."
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

    if (normalizedIdentifier.startsWith("pix_char_")) {
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
