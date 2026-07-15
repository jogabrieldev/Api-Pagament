import { Request, Response } from "express";
import { CheckoutService } from "../services/checkoutService.js";

export class CheckoutController {
  private readonly service = new CheckoutService();
  async create(req: Request, res: Response): Promise<Response> {
    try { 
      return res.status(201).json({ message: "Checkout criado com sucesso.", checkout: await this.service.create(req.body) }); 
    }
    catch (e: unknown) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Erro ao criar checkout." }); 
    }
  }
  async getAll(_req: Request, res: Response): Promise<Response> {
    try { 
      return res.status(200).json(await this.service.getAll()); 
    }
    catch (e: unknown) { 
      return res.status(502).json({ error: e instanceof Error ? e.message : "Erro ao listar checkouts." }); 
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json(await this.service.getById(String(req.params.id))); 
    }
    catch (e: unknown) {
      return res.status(404).json({ error: e instanceof Error ? e.message : "Checkout não encontrado." }); 
    }
  }
}
