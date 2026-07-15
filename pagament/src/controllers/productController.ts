import { Request, Response } from "express";
import { ProductService } from "../services/productService.js";

export class ProductController {
  private readonly service = new ProductService();

  async create(req: Request, res: Response): Promise<Response> {
    try { 
      return res.status(201).json({ message: "Produto criado com sucesso.", product: await this.service.create(req.body) }); 
    }
    catch (e: unknown) { 
      return res.status(400).json({ error: e instanceof Error ? e.message : "Erro ao criar produto." }); 
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const { search, after, before, id } = req.query;
      const params = {
        ...(typeof search === "string" ? { search } : {}), ...(typeof after === "string" ? { after } : {}),
        ...(typeof before === "string" ? { before } : {}), ...(typeof id === "string" ? { id } : {}),
        ...(typeof req.query.limit === "string" ? { limit: Number(req.query.limit) } : {})
      };
      return res.status(200).json(await this.service.getAll(params));
    } catch (e: unknown) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Erro ao listar produtos." }); 
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try { return res.status(200).json(await this.service.getById(String(req.params.id))); }
    catch (e: unknown) { return res.status(404).json({ error: e instanceof Error ? e.message : "Produto não encontrado." }); }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try { return res.status(200).json({ message: "Produto deletado com sucesso.", product: await this.service.delete(String(req.params.id)) }); }
    catch (e: unknown) { return res.status(400).json({ error: e instanceof Error ? e.message : "Erro ao deletar produto." }); }
  }
}
