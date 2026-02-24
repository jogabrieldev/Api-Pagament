// src/routes/client.routes.ts
import { Router, Request, Response } from "express";
import { ClientController } from "../controllers/clientController.js";
import {createPixPayment} from '../services/pagamentService.js'

export const clientRouter = Router();
const clientController = new ClientController();

clientRouter.post('/cliente', (req:Request, res:Response) => clientController.create(req, res));
clientRouter.get('/cliente', (req:Request, res:Response) => clientController.getAll(req, res));

clientRouter.post('/payment/pix', createPixPayment);