# Contrato HTTP atual da API

Este documento registra a superfície pública que deve permanecer compatível durante a separação frontend/API. A API responde, salvo onde indicado, no formato abaixo:

```json
{ "success": true, "data": {} }
```

Erros usam `{ "success": false, "error": "mensagem" }`. As rotas protegidas exigem `Authorization: Bearer <JWT>`; o token é emitido por `POST /api/auth/login` e mantém a validade configurada por `JWT_EXPIRES_IN`.

## Exceções de autenticação

| Método | Caminho | Uso |
| --- | --- | --- |
| POST | `/api/auth/login` | Recebe `{ senha }` e devolve token JWT. |
| POST | `/api/bot/webhook` | Webhook do Telegram, autenticado por seu segredo próprio. |

## Recursos financeiros

| Recurso | Operações preservadas |
| --- | --- |
| Dashboard | `GET /api/dashboard?mes={MesAno}`; `GET /api/dashboard/historico` |
| Gastos fixos | `GET, POST /api/gastos-fixos`; `PUT, DELETE /api/gastos-fixos/{id}`; `PATCH /api/gastos-fixos/{id}/status`; `DELETE /api/gastos-fixos/{id}/serie` |
| Gastos variáveis | `GET, POST /api/gastos-variaveis`; `PUT, DELETE /api/gastos-variaveis/{id}`; `PATCH /api/gastos-variaveis/{id}/status`; `DELETE /api/gastos-variaveis/{id}/serie` |
| Receitas | `GET, POST /api/receitas`; `PUT, DELETE /api/receitas/{id}`; `PATCH /api/receitas/{id}/status`; `DELETE /api/receitas/{id}/serie` |
| Metas | `GET, POST /api/metas`; `PUT, DELETE /api/metas/{id}`; `POST, DELETE /api/metas/{id}/ativar` |
| Orçamentos | `GET, POST /api/orcamentos`; `PUT, DELETE /api/orcamentos/{id}` |
| Cartões | `GET, POST /api/cartoes`; `PUT, DELETE /api/cartoes/{id}` |
| Investimentos | `GET, POST /api/investimentos`; `PUT, DELETE /api/investimentos/{id}`; `GET /api/investimentos/busca`; `GET /api/investimentos/cotacoes`, `/historico` e `/stats` |
| Configurações | `GET, PUT /api/configuracoes` |
| Relatórios | `GET /api/relatorios` |
| Exportação | `GET /api/exportar` |

## Financiamentos

| Método | Caminho |
| --- | --- |
| GET, POST | `/api/financiamentos` |
| GET, PUT, DELETE | `/api/financiamentos/{id}` |
| GET | `/api/financiamentos/{id}/tabela` |
| GET | `/api/financiamentos/{id}/indices` |
| POST | `/api/financiamentos/{id}/simulacoes` |
| POST | `/api/financiamentos/{id}/amortizacoes` |
| PUT, DELETE | `/api/financiamentos/{id}/amortizacoes/{amortizacaoId}` |
| POST | `/api/financiamentos/{id}/pagamentos` |
| DELETE | `/api/financiamentos/{id}/pagamentos/{pagamentoId}` |

## Regras de compatibilidade

1. Não renomear campos, métodos ou caminhos nesta fase.
2. Preservar os códigos HTTP atuais, especialmente `401` para token ausente, inválido ou expirado.
3. Preservar o formato de mês `NomeDoMesAAAA` (por exemplo, `Junho2026`).
4. Manter as regras de geração de recorrências, séries, parcelas e cálculos no domínio; controllers apenas adaptam HTTP para os serviços.
5. Qualquer mudança incompatível requer versão explícita (`/api/v2`) e plano de migração dos clientes.
