// src/repositories/ClientRepository.ts
import  pool  from '../config/configDB.js';
import { ClientResponse, ClientRequest } from '../types/client.js';

export class ClientRepository {
    async save(client: Omit<ClientRequest, 'id'>): Promise<ClientResponse> {
        const queryText = `
          INSERT INTO clients (name, cpf, idade, sexo, telefone, email)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *
        `;
        const values = [client.name, client.cpf, client.idade, client.sexo, client.telefone, client.email];
        const res= await pool.query(queryText, values);

      return res.rows[0] || null as any as ClientResponse;
    }

    async getAllClient():Promise<ClientResponse[]>{
      const res = await pool.query<ClientResponse>('SELECT * FROM clients');
      return res.rows
    }

    async findByCpf(cpf: string): Promise<ClientResponse | null> {
      const res = await pool.query('SELECT * FROM clients WHERE cpf = $1', [cpf]);
      return res.rows[0] || null;
    }
}