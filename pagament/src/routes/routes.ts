// src/routes/client.routes.ts
import { Router, Request, Response } from "express";
import { BoletoController } from "../controllers/boletoController.js";
import { ClientController } from "../controllers/clientController.js";
import { PaymentController } from "../controllers/paymentController.js";

export const clientRouter = Router();
const clientController = new ClientController();
clientRouter.post('/cliente', (req:Request, res:Response) => clientController.create(req, res));
clientRouter.get('/cliente', (req:Request, res:Response) => clientController.getAll(req, res));

const paymentController = new PaymentController();
clientRouter.post("/payments/pix",(req: Request, res: Response) => paymentController.createPix(req, res));
clientRouter.post("/payments/pix/:id/pay", (req: Request, res: Response) =>
  paymentController.simulatePixPayment(req, res)
);

const boletoController = new BoletoController();
clientRouter.post("/payments/boleto", (req: Request, res: Response) =>
  boletoController.create(req, res)
);
clientRouter.get("/payments/boletos", (req: Request, res: Response) =>
  boletoController.getAll(req, res)
);
clientRouter.get("/payments/boletos/:id", (req: Request, res: Response) =>
  boletoController.getById(req, res)
);
clientRouter.get("/payments",(req: Request, res: Response) =>paymentController.getAll(req, res));

clientRouter.get("/payments/:id",(req: Request, res: Response) =>paymentController.getById(req, res));

clientRouter.post("/payments/:id/simulate", (req: Request, res: Response) => paymentController.simulatePixPayment(req,res)
);
