import { payment } from '../config/configPagament.js';
import { Request, Response } from 'express';

export const createPixPayment = async (req: Request, res: Response) => {
    try {
        const body = {
          transaction_amount: req.body.transaction_amount || 100.50,
          description: req.body.description || 'Pedido via API Pix',
          payment_method_id: 'pix',
            payer: {
              email: req.body.email || 'test_user_8435180749215100259@testuser.com', 
                identification: {
                  type: 'CPF',
                  number: req.body.cpf || '12345678909'
                }
            },
            notification_url: 'https://webhook.site', 
        };

        const response = await payment.create({ body, requestOptions: { idempotencyKey: Date.now().toString() } });
    
       const qrCode = response.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64;

        return res.status(201).json({
         id: response.id,
         status: response.status,
         pix_copia_e_cola: qrCode,
         qr_code_base64: qrCodeBase64
        });
    } catch (error: any) {
    const detail = error.cause?.[0]?.description || error.message;
    console.error("Erro MP:", detail);
    return res.status(400).json({ error: detail });
  }
};