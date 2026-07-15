# API de Pagamentos

Back-end desenvolvido com Node.js, Express, TypeScript e PostgreSQL para integrar pagamentos à API v2 da AbacatePay.

O projeto centraliza o cadastro de clientes, catálogo de produtos, checkouts hospedados, cobranças PIX e boleto, consultas de status, reembolsos e recebimento seguro de webhooks.

## Funcionalidades

### Clientes

- Cadastro e listagem de clientes locais.
- Validação de campos obrigatórios, idade mínima e CPF duplicado.
- Associação do cliente às cobranças PIX e boleto.

### Produtos

- Criação de produtos na AbacatePay.
- Listagem e busca por ID.
- Exclusão de produtos.
- Suporte a produtos avulsos e recorrentes.
- Utilização do ID `prod_...` na criação de checkouts.

### Checkout hospedado

- Criação de checkout com produtos cadastrados.
- Suporte aos métodos PIX e boleto.
- Listagem e consulta por ID `bill_...`.
- Retorno da URL que deve ser aberta pelo client para finalizar o pagamento.
- Suporte a URLs de retorno, metadados, juros e multa para boleto.

### PIX

- Criação de cobrança transparente.
- Código PIX copia e cola e QR Code em Base64.
- Persistência da cobrança no PostgreSQL.
- Listagem global, listagem por método e consulta por ID.
- Simulação de pagamento em ambiente de desenvolvimento.
- Confirmação do status em `/transparents/check` após a simulação.
- Sincronização do status confirmado com o banco de dados.
- Reembolso de pagamentos compatíveis.

### Boleto

- Criação de boleto transparente.
- Linha digitável, URL do boleto e PIX alternativo.
- Configuração opcional de juros e multa.
- Persistência e consulta pelo ID local ou `bole_...`.
- Consulta e sincronização do status junto à AbacatePay.

### Webhooks

- Criação, listagem, consulta e exclusão de webhooks na AbacatePay.
- Endpoint para recebimento de eventos.
- Validação do secret informado na URL.
- Validação HMAC-SHA256 pelo header `X-Webhook-Signature` e corpo bruto.
- Registro idempotente dos eventos no PostgreSQL.
- Atualização automática de pagamentos para `PAID`, `REFUNDED` ou `DISPUTED`.
- Processamento transacional do evento e da atualização do pagamento.

## Funcionamento

O projeto segue uma arquitetura em camadas:

```text
Requisição HTTP
      ↓
Controller
      ↓
Service ──────────→ AbacatePay
      ↓
Model
      ↓
PostgreSQL
```

- **Controllers** recebem as requisições e constroem as respostas HTTP.
- **Services** concentram validações, regras de negócio e comunicação com a AbacatePay.
- **Models** executam a persistência e as consultas no PostgreSQL.
- **Types** definem os contratos TypeScript utilizados entre as camadas.

No fluxo de simulação PIX, a API não utiliza a resposta da simulação como estado final. Depois de simular, consulta novamente a AbacatePay e atualiza o banco apenas com o status confirmado.

No fluxo de webhook, cada evento é registrado uma única vez. Eventos repetidos são reconhecidos sem executar novamente a atualização financeira.

## Tecnologias

- Node.js
- Express
- TypeScript
- PostgreSQL
- Axios
- CORS
- AbacatePay API v2

## Configuração

Instale as dependências:

```bash
npm install
```

Configure o arquivo `.env`:

```env
PORT=3000

USER_DB=postgres
HOST_DB=localhost
NAME_DB=pagament
PASS_DB=sua_senha
PORT_DB=5432

ABACATEPAY_API_KEY=sua_chave
ABACATEPAY_BASE_URL=https://api.abacatepay.com/v2

ABACATEPAY_WEBHOOK_SECRET=seu_secret
ABACATEPAY_WEBHOOK_PUBLIC_KEY=chave_hmac_da_abacatepay
```

O ambiente da AbacatePay é definido pela chave utilizada. Use uma chave de desenvolvimento para simular pagamentos PIX.

## Banco de dados

O projeto utiliza as tabelas `clients`, `payments` e `webhook_events`.

Execute as migrações disponíveis em `database/migrations`:

```bash
psql -U postgres -d pagament -f database/migrations/001_add_boleto_fields.sql
psql -U postgres -d pagament -f database/migrations/002_create_webhook_events.sql
```

A segunda migração é obrigatória para que o receptor de webhooks registre eventos com idempotência.

## Execução

Desenvolvimento:

```bash
npm run dev
```

Produção:

```bash
npm run build
npm start
```

A aplicação utiliza por padrão:

```text
http://localhost:3000
```

Health check:

```http
GET /
```

## Documentação local

A pasta `docs` contém exemplos de uso e uma Collection Postman para os fluxos implementados. Ela permanece no `.gitignore` e não faz parte dos commits atuais.

## Estado atual

O back-end cobre o fluxo funcional de clientes, produtos, checkout, PIX, boleto e webhooks. Antes de exposição pública em produção, ainda é recomendado adicionar autenticação, autorização, rate limiting, idempotência na criação de cobranças, testes automatizados, logs estruturados e tratamento global de erros.

## Referência

[Documentação oficial da AbacatePay](https://docs.abacatepay.com/pages/reference/introduction)

## Licença

ISC
