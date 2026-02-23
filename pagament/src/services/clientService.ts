import { ClientResponse, ClientRequest } from '../types/client.js';
import { ClientRepository } from "../models/client.js";

export class ClientService {
    private repository: ClientRepository;

    constructor() {
     this.repository = new ClientRepository();
    }

    async serviceRegisterClient(data: Omit<ClientRequest, 'id'>): Promise<ClientResponse> {

        if(!data.name || data.name.trim() ==="" || !data.cpf || !data.idade || !data.sexo || !data.telefone || !data.email) {
         throw new Error("Campos obrigatórios ausentes.");
        }
        if (data.idade < 18) {
         throw new Error("Apenas clientes maiores de idade podem ser cadastrados.");
        }

        const clientExists = await this.repository.findByCpf(data.cpf);
        if (clientExists) {
         throw new Error("CPF já cadastrado no sistema.");
        }
        return await this.repository.save(data);
    }

    async serviceGetAllClient():Promise<ClientResponse[]> {
     const response = await this.repository.getAllClient();
        if(!response || response.length ===0){
          throw new Error("Nenhum cliente encontrado.");
        }
       return response
    }
}