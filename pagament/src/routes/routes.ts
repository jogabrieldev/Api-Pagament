// src/routes/client.routes.ts
import { Router, Request, Response } from "express";
import { BoletoController } from "../controllers/boletoController.js";
import { ClientController } from "../controllers/clientController.js";
import { PaymentController } from "../controllers/paymentController.js";
import { CheckoutController } from "../controllers/checkoutController.js";
import { ProductController } from "../controllers/productController.js";
import { WebhookController } from "../controllers/webhookController.js";

export const clientRouter = Router();
const clientController = new ClientController();
clientRouter.post('/cliente', (req:Request, res:Response) => clientController.create(req, res));
clientRouter.get('/cliente', (req:Request, res:Response) => clientController.getAll(req, res));

const paymentController = new PaymentController();
clientRouter.post("/payments/pix",(req: Request, res: Response) => paymentController.createPix(req, res));
clientRouter.post("/payments/pix/:id/pay", (req: Request, res: Response) =>paymentController.simulatePixPayment(req, res));
clientRouter.get("/payments/pix", (req: Request, res: Response) => paymentController.getAllPix(req, res));
clientRouter.get("/payments/:id/status", (req: Request, res: Response) => paymentController.checkStatus(req, res));
clientRouter.post("/payments/:id/refund", (req: Request, res: Response) => paymentController.refund(req, res));
clientRouter.get("/payments",(req: Request, res: Response) =>paymentController.getAll(req, res));

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

clientRouter.get("/payments/:id",(req: Request, res: Response) => paymentController.getById(req, res));
clientRouter.post("/payments/:id/simulate", (req: Request, res: Response) =>
  paymentController.simulatePixPayment(req, res)
);

const checkoutController = new CheckoutController();
clientRouter.post("/checkouts", (req: Request, res: Response) => checkoutController.create(req, res));
clientRouter.get("/checkouts", (req: Request, res: Response) => checkoutController.getAll(req, res));
clientRouter.get("/checkouts/:id", (req: Request, res: Response) => checkoutController.getById(req, res));

const productController = new ProductController();
clientRouter.post("/products", (req: Request, res: Response) => productController.create(req, res));
clientRouter.get("/products", (req: Request, res: Response) => productController.getAll(req, res));
clientRouter.get("/products/:id", (req: Request, res: Response) => productController.getById(req, res));
clientRouter.post("/products/:id/delete", (req: Request, res: Response) => productController.delete(req, res));

const webhookController = new WebhookController();
clientRouter.post("/webhooks/receive", (req: Request, res: Response) => webhookController.receive(req, res));
clientRouter.post("/webhooks", (req: Request, res: Response) => webhookController.create(req, res));
clientRouter.get("/webhooks", (req: Request, res: Response) => webhookController.getAll(req, res));
clientRouter.get("/webhooks/:id", (req: Request, res: Response) => webhookController.getById(req, res));
clientRouter.post("/webhooks/:id/delete", (req: Request, res: Response) => webhookController.delete(req, res));
