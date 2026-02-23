import { Request, Response } from "express";
import { ClientService } from "../services/clientService.js";

export class ClientController {

  private service: ClientService;
  constructor(){
    this.service = new ClientService();
  }
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const { name, cpf, idade, sexo, telefone, email } = req.body;

      const result = await this.service.serviceRegisterClient({ name, cpf, idade, sexo, telefone, email });

      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.service.serviceGetAllClient();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}