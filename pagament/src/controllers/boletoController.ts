import { Request, Response } from "express";
import { BoletoService } from "../services/boletoService.js";

export class BoletoController {
  private readonly boletoService: BoletoService;

  constructor() {
    this.boletoService = new BoletoService();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { clientId, amount, description, interest, fine } = req.body;
      const boleto = await this.boletoService.create({
        clientId,
        amount,
        description,
        interest,
        fine
      });

      return res.status(201).json({
        message: "Boleto criado com sucesso.",
        boleto
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao criar boleto.";
      return res.status(400).json({ error: message });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const boleto = await this.boletoService.getByIdentifier(String(req.params.id));
      return res.status(200).json(boleto);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao buscar boleto.";
      return res.status(404).json({ error: message });
    }
  }

  async getAll(_req: Request, res: Response): Promise<Response> {
    try {
      const boletos = await this.boletoService.getAll();
      return res.status(200).json(boletos);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao listar boletos.";
      return res.status(500).json({ error: message });
    }
  }
}
