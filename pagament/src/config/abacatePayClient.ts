import "dotenv/config";
import axios from "axios";

const apiKey = process.env.ABACATEPAY_API_KEY;

if (!apiKey) {
  throw new Error(
    "A variável ABACATEPAY_API_KEY não foi configurada no arquivo .env."
  );
}

export const abacatePayClient = axios.create({
  baseURL:
    process.env.ABACATEPAY_BASE_URL ??
    "https://api.abacatepay.com/v2",

  timeout: 15000,

  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  }
});