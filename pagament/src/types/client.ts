export interface ClientResponse {
  id: number;
  name: string;
  cpf: string;
  idade: number;
  telefone:string;
  email:string;
  sexo: 'M' | 'F'; 
}

export interface ClientRequest{
  name:string;
  cpf:string;
  idade:number
  telefone:string;
  email:string;
  sexo:'M' | 'F' 
}