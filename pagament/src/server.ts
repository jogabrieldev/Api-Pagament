// src/server.ts
import express from 'express';
import cors from 'cors';
import { clientRouter } from '../src/routes/routes.js';

import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(cors());

const PORT= process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('API de Pagamentos Ativa!');
});

app.use("/api", clientRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});