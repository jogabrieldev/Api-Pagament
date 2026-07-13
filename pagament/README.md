# API de Pagamentos

Back-end desenvolvido em Node.js, Express e TypeScript para gerenciamento de clientes e processamento de pagamentos por meio da API v2 da AbacatePay.

A aplicação permite cadastrar clientes, gerar cobranças PIX, emitir boletos bancários com PIX alternativo e persistir os dados das transações em PostgreSQL.

## Funcionalidades

### Clientes

- Cadastro de clientes.
- Listagem de clientes.
- Validação básica dos dados cadastrais.
- Verificação de CPF já cadastrado.
- Restrição de cadastro para clientes menores de idade.

### Pagamentos PIX

- Criação de cobranças PIX.
- Geração do código PIX copia e cola.
- Geração do QR Code PIX em Base64.
- Configuração do tempo de expiração.
- Associação da cobrança a um cliente.
- Persistência dos dados no PostgreSQL.
- Consulta pelo identificador local ou pelo identificador da AbacatePay.
- Listagem dos pagamentos cadastrados.

### Boletos

- Emissão de boleto bancário pela AbacatePay.
- Geração da linha digitável.
- URL para visualização e impressão do boleto.
- Geração de PIX alternativo para o mesmo boleto.
- Configuração opcional de juros por atraso.
- Configuração opcional de multa fixa ou percentual.
- Associação do boleto a um cliente.
- Persistência dos dados no PostgreSQL.
- Consulta e listagem de boletos.

## Tecnologias

- Node.js
- TypeScript
- Express
- PostgreSQL
- Axios
- dotenv
- CORS
- AbacatePay API v2
- Nodemon

## Arquitetura

O projeto utiliza uma arquitetura em camadas:

```text
Requisição HTTP
      │
      ▼
Controller
      │
      ▼
Service ──────────────► AbacatePay API
      │
      ▼
Model
      │
      ▼
PostgreSQL
```

### Controllers

Responsáveis por receber as requisições HTTP, extrair os dados de entrada, executar os serviços correspondentes e retornar respostas em JSON.

### Services

Concentram as regras de negócio, validações, conversão de valores, comunicação com a AbacatePay e coordenação da persistência dos pagamentos.

### Models

Responsáveis pelas queries e operações de persistência no PostgreSQL.

### Types

Definem os contratos TypeScript utilizados entre controllers, services, models, banco de dados e respostas da AbacatePay.

## Estrutura do projeto

```text
pagament/
├── database/
│   └── migrations/
│       └── 001_add_boleto_fields.sql
├── src/
│   ├── config/
│   │   ├── abacatePayClient.ts
│   │   └── configDB.ts
│   ├── controllers/
│   │   ├── boletoController.ts
│   │   ├── clientController.ts
│   │   ├── paymentController.ts
│   │   └── webhookController.ts
│   ├── models/
│   │   ├── boleto.ts
│   │   ├── client.ts
│   │   └── payment.ts
│   ├── routes/
│   │   └── routes.ts
│   ├── services/
│   │   ├── boletoService.ts
│   │   ├── clientService.ts
│   │   └── paymentService.ts
│   ├── types/
│   │   ├── boleto.ts
│   │   ├── client.ts
│   │   └── payment.ts
│   └── server.ts
├── .gitignore
├── nodemon.json
├── package.json
├── package-lock.json
└── tsconfig.json
```

## Pré-requisitos

- Node.js
- npm
- PostgreSQL
- Uma chave de API da AbacatePay

## Instalação

Clone o repositório:

```bash
git clone https://github.com/jogabrieldev/Api-Pagament.git
```

Entre no diretório da aplicação:

```bash
cd Api-Pagament/pagament
```

Instale as dependências:

```bash
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz da aplicação:

```env
PORT=3000

USER_DB=postgres
HOST_DB=localhost
NAME_DB=pagament
PASS_DB=sua_senha
PORT_DB=5432

ABACATEPAY_API_KEY=sua_chave_da_api
ABACATEPAY_BASE_URL=https://api.abacatepay.com/v2
```

| Variável | Obrigatória | Descrição |
|---|---:|---|
| `PORT` | Não | Porta HTTP da aplicação. O padrão é `3000`. |
| `USER_DB` | Sim | Usuário do PostgreSQL. |
| `HOST_DB` | Sim | Host do PostgreSQL. |
| `NAME_DB` | Sim | Nome do banco de dados. |
| `PASS_DB` | Sim | Senha do PostgreSQL. |
| `PORT_DB` | Não | Porta do PostgreSQL. O padrão é `5432`. |
| `ABACATEPAY_API_KEY` | Sim | Chave de autenticação da AbacatePay. |
| `ABACATEPAY_BASE_URL` | Não | URL base da API. O padrão é a API v2. |

> Nunca envie o arquivo `.env` ao repositório. Ele pode conter senhas e chaves privadas.

## Banco de dados

A aplicação utiliza as tabelas `clients` e `payments`. A estrutura inicial dessas tabelas deve existir antes da inicialização da API.

O módulo de boleto também precisa de campos adicionais na tabela `payments`. Execute a migração localizada em:

```text
database/migrations/001_add_boleto_fields.sql
```

Exemplo com `psql`:

```bash
psql -U postgres -d pagament -f database/migrations/001_add_boleto_fields.sql
```

A migração adiciona os seguintes campos:

- `boleto_bar_code`
- `boleto_url`
- `interest_value`
- `fine_value`
- `fine_type`

Também são adicionados um índice para o método de pagamento e uma restrição para os tipos de multa `PERCENTAGE` e `FIXED`.

## Executando a aplicação

### Desenvolvimento

```bash
npm run dev
```

### Compilação

```bash
npm run build
```

Os arquivos compilados são gerados no diretório `dist`.

### Execução

```bash
npm start
```

Por padrão, a aplicação fica disponível em:

```text
http://localhost:3000
```

Para verificar se a API está ativa:

```http
GET /
```

Resposta:

```text
API de Pagamentos Ativa!
```

## Endpoints

As rotas da aplicação utilizam o prefixo `/api`.

### Cadastrar cliente

```http
POST /api/cliente
```

```json
{
  "name": "João da Silva",
  "cpf": "123.456.789-00",
  "idade": 30,
  "sexo": "M",
  "telefone": "(11) 99999-9999",
  "email": "joao@example.com"
}
```

### Listar clientes

```http
GET /api/cliente
```

## Pagamentos PIX

### Criar cobrança PIX

```http
POST /api/payments/pix
```

```json
{
  "clientId": 1,
  "amount": 100,
  "description": "Pagamento do pedido 123",
  "expiresIn": 3600
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `clientId` | `number` | Sim | ID local do cliente. |
| `amount` | `number` | Sim | Valor da cobrança em reais. |
| `description` | `string` | Não | Descrição da cobrança. |
| `expiresIn` | `number` | Não | Expiração em segundos. O padrão é `3600`. |

A aplicação converte o valor informado em reais para centavos antes de enviá-lo à AbacatePay. Por exemplo, `100.50` é convertido para `10050` centavos.

Exemplo de resposta:

```json
{
  "message": "Cobrança PIX criada com sucesso.",
  "payment": {
    "id": 1,
    "client_id": 1,
    "external_id": "payment-uuid",
    "provider_payment_id": "pix_char_123456",
    "method": "PIX",
    "amount": 10000,
    "status": "PENDING",
    "pix_code": "000201...",
    "pix_qr_code_base64": "data:image/png;base64,..."
  }
}
```

### Listar pagamentos

```http
GET /api/payments
```

### Consultar pagamento

```http
GET /api/payments/:id
```

O identificador pode ser o ID numérico local ou o identificador da AbacatePay iniciado por `pix_char_`.

## Boletos

### Criar boleto

```http
POST /api/payments/boleto
```

Corpo mínimo:

```json
{
  "clientId": 1,
  "amount": 250
}
```

Corpo completo:

```json
{
  "clientId": 1,
  "amount": 250,
  "description": "Fatura de serviço mensal",
  "interest": {
    "value": 100
  },
  "fine": {
    "value": 200,
    "type": "PERCENTAGE"
  }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `clientId` | `number` | Sim | ID do cliente cadastrado. |
| `amount` | `number` | Sim | Valor do boleto em reais. |
| `description` | `string` | Não | Descrição com até 255 caracteres. |
| `interest.value` | `integer` | Não | Juros mensais em centésimos de percentual. |
| `fine.value` | `integer` | Não | Valor da multa. |
| `fine.type` | `string` | Não | Tipo da multa: `PERCENTAGE` ou `FIXED`. |

### Juros

O campo `interest.value` utiliza centésimos de percentual:

```text
100 = 1% ao mês
250 = 2,5% ao mês
```

### Multa percentual

```json
{
  "fine": {
    "value": 200,
    "type": "PERCENTAGE"
  }
}
```

Nesse exemplo, `200` representa uma multa de 2%.

### Multa fixa

```json
{
  "fine": {
    "value": 1000,
    "type": "FIXED"
  }
}
```

Nesse exemplo, `1000` representa uma multa fixa de R$ 10,00.

### Resposta do boleto

```json
{
  "message": "Boleto criado com sucesso.",
  "boleto": {
    "id": 2,
    "client_id": 1,
    "provider_payment_id": "bole_123456",
    "method": "BOLETO",
    "amount": 25000,
    "status": "PENDING",
    "boleto_bar_code": "23793.38128...",
    "boleto_url": "https://app.abacatepay.com/pay/bole_123456/boleto",
    "pix_code": "000201...",
    "pix_qr_code_base64": "data:image/png;base64,...",
    "interest_value": 100,
    "fine_value": 200,
    "fine_type": "PERCENTAGE"
  }
}
```

O boleto retornado contém a linha digitável, uma URL para impressão e um PIX alternativo com código copia e cola e QR Code.

### Listar boletos

```http
GET /api/payments/boletos
```

### Consultar boleto

```http
GET /api/payments/boletos/:id
```

O identificador pode ser o ID numérico local ou o identificador da AbacatePay iniciado por `bole_`.

## Integração com a AbacatePay

A aplicação utiliza a API v2:

```text
https://api.abacatepay.com/v2
```

Endpoint utilizado para criação de cobranças:

```http
POST /transparents/create
```

Todas as requisições enviadas à AbacatePay incluem a chave de API no cabeçalho `Authorization`.

Documentação oficial:

- [Introdução à API](https://docs.abacatepay.com/pages/reference/introduction)
- [Criar cobrança PIX](https://docs.abacatepay.com/pages/transparents/create)
- [Criar boleto](https://docs.abacatepay.com/pages/transparents/boleto)

## Segurança

Antes de disponibilizar a aplicação em produção, recomenda-se:

- Implementar autenticação e autorização.
- Adicionar rate limiting.
- Validar os payloads por meio de schemas.
- Não retornar mensagens internas do banco de dados ao cliente.
- Utilizar HTTPS.
- Proteger variáveis de ambiente e credenciais.
- Implementar idempotência na criação de cobranças.
- Configurar e validar webhooks da AbacatePay.
- Restringir a exposição de CPF e códigos de pagamento.

## Status do projeto

- [x] Cadastro e listagem de clientes
- [x] Criação de cobrança PIX
- [x] Consulta e listagem de pagamentos
- [x] Criação de boleto
- [x] Configuração de juros e multa
- [x] Consulta e listagem de boletos
- [x] Migração para os campos de boleto
- [ ] Autenticação e autorização
- [ ] Webhooks da AbacatePay
- [ ] Idempotência
- [ ] Paginação
- [ ] Documentação OpenAPI/Swagger
- [ ] Tratamento global de erros

## Licença

Este projeto utiliza a licença ISC, conforme definido no arquivo `package.json`.
