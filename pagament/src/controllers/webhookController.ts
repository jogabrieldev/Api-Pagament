import { Request, Response } from "express";
import { WebhookService, WebhookUnauthorizedError } from "../services/webhookService.js";

type RequestWithRawBody = Request & { rawBody?: Buffer };

export class WebhookController {
  private readonly service = new WebhookService();

  async create(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(201).json({ message: "Webhook criado com sucesso.", webhook: await this.service.create(req.body) });
    }
    catch (e: unknown) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Erro ao criar webhook." });
    }
  }
  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const params = Object.fromEntries(Object.entries(req.query).filter(([, value]) => typeof value === "string"));
      return res.status(200).json(await this.service.getAll(params));
    } catch (e: unknown) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Erro ao listar webhooks." });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try { return res.status(200).json(await this.service.getById(String(req.params.id))); }
    catch (e: unknown) { return res.status(404).json({ error: e instanceof Error ? e.message : "Webhook não encontrado." }); }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try { return res.status(200).json({ message: "Webhook deletado com sucesso.", webhook: await this.service.delete(String(req.params.id)) }); }
    catch (e: unknown) { return res.status(400).json({ error: e instanceof Error ? e.message : "Erro ao deletar webhook." }); }
  }

  async receive(req: RequestWithRawBody, res: Response): Promise<Response> {
    try {
      if (!req.rawBody) throw new Error("Corpo bruto da requisição indisponível.");
      const processed = await this.service.receive(req.rawBody, req.get("X-Webhook-Signature"),
        typeof req.query.webhookSecret === "string" ? req.query.webhookSecret : undefined, req.body);
      return res.status(200).json({ received: true, processed });
    } catch (e: unknown) {
      const status = e instanceof WebhookUnauthorizedError ? 401 : 400;
      return res.status(status).json({ error: e instanceof Error ? e.message : "Erro ao processar webhook." });
    }
  }
}
