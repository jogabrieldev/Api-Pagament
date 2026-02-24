import { MercadoPagoConfig, Payment } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config()
 
const token:string = process.env.MP_ACCESS_TOKEN || '';

if (!token) {
    console.warn("⚠️ MP_ACCESS_TOKEN não encontrado no .env");
}
console.log("Token MP" , token)
const client = new MercadoPagoConfig({ 
  accessToken: token
});


export const payment = new Payment(client);

