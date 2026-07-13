import { Request, Response } from "express";
import { PaymentService } from "../services/paymentService.js";

export class PaymentController {
  private readonly paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createPix(req: Request,res: Response): Promise<Response> {
    try {
        const {
         clientId,
         amount,
         description,
         expiresIn
        }  = req.body;

        const payment = await this.paymentService.createPix({clientId,amount,description,expiresIn});
        return res.status(201).json({
         message: "Cobrança PIX criada com sucesso.",
         payment
        });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao criar pagamento.";

      return res.status(400).json({error: message});
    }
  }

  async getById(req: Request,res: Response):Promise<Response> {
    try {
      const paymentId= String(req.params.id);
      const payment = await this.paymentService.getPaymentByIdentifier(paymentId);

      return res.status(200).json(payment);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao buscar pagamento.";

        return res.status(404).json({
         error: message
        });
    }
  }

  async getAll(req: Request,res: Response): Promise<Response> {
    try {
      const payments = await this.paymentService.getAllPayments();

      return res.status(200).json(payments);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao listar pagamentos.";

      return res.status(500).json({
        error: message
      });
    }
  }
  

  async simulatePixPayment(req: Request,res: Response): Promise<Response> {
    try {
      const paymentId = String(req.params.id);
      const result = await this.paymentService.simulatePixPayment(paymentId);
        return res.status(200).json({
         message: "Pagamento simulado com sucesso.",
         result
        });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao simular pagamento.";
      return res.status(400).json({
        error: message
      });
    }
  }
}