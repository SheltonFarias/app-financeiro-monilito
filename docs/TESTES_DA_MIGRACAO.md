# Padrão de testes para a migração

O objetivo é permitir mover uma rota ou regra por vez sem alterar a experiência de web e mobile. Todo módulo migrado deve ser protegido pelos três níveis abaixo.

## 1. Unitário: regras de domínio

Serviços devem expor uma fábrica com dependências injetáveis, no padrão `createXService(dependencies)`. O export público existente (`XService`) continua sendo a instância real para não quebrar os handlers atuais.

```js
const service = createXService({ repository: fakeRepository });
const resultado = await service.executar(entrada);
assert.deepEqual(resultado, esperado);
```

- Não acessar PostgreSQL, rede, relógio ou ambiente real.
- Cobrir sucesso, validação, regra de negócio e idempotência/duplicação quando aplicável.
- Usar `node:test` e `node:assert/strict`; não requer biblioteca adicional.
- Nomear o teste pelo comportamento de negócio, não pelo método interno.

O exemplo de referência está em `app-financeiro-monolito/test/dashboard.service.test.js`.

## Inventário obrigatório da migração

`financeiro-api/src/migration-manifest.js` lista todos os métodos e caminhos legados com um estado: `proxy` ou `native`. Quando uma rota se torna nativa, deve indicar ao menos um arquivo de teste. O teste do manifesto falha para rota ausente, duplicada, com estado inválido ou nativa sem teste declarado.

## 2. Contrato: legado versus candidato

Antes de substituir um proxy por controller nativo, incluir cenário no arquivo `financeiro-api/test/contract/compatibility.test.js`.

O teste compara status, `content-type` e corpo completo entre as duas origens. Por padrão, ele fica **skipado** no computador/CI porque depende de ambientes executando. Em homologação, execute:

```powershell
$env:CONTRACT_LEGACY_ORIGIN = 'https://legado-hml.exemplo.com'
$env:CONTRACT_CANDIDATE_ORIGIN = 'https://api-hml.exemplo.com'
$env:CONTRACT_INVALID_PASSWORD = 'uma-senha-que-certamente-nao-e-valida'
$env:CONTRACT_BEARER_TOKEN = 'jwt-de-uma-conta-de-homologacao'
npm --prefix financeiro-api test
```

Use apenas cenários de leitura, de erro seguro ou dados descartáveis. Operações de escrita devem usar uma base isolada e limpar os dados por API/fixture controlada, nunca por produção.

O cenário de senha inválida é opcional e só é ativado quando `CONTRACT_INVALID_PASSWORD` estiver definida; ele confirma que a rota de login já migrada preserva o erro HTTP e o corpo do legado. `CONTRACT_BEARER_TOKEN` habilita a matriz de leituras autenticadas, sem executar escrita.

## 3. Transporte: API independente

Cada nova rota local da API precisa de teste no servidor para verificar:

- caminho, query, status e envelope `{ success, data/error }`;
- autenticação e ausência de vazamento de segredos;
- CORS, timeout e propagação de headers quando o proxy ainda existir;
- respostas de erro equivalentes ao legado.

Os exemplos estão em `financeiro-api/test/server.test.js` e `financeiro-api/test/auth.test.js`.

## Regra de aceite por rota

Uma rota só deixa o proxy quando todos forem verdadeiros:

1. Regras de domínio possuem testes unitários relevantes.
2. O controller possui teste de transporte.
3. O contrato comparativo passa em homologação contra o legado.
4. `npm test` na raiz e `npm run lint` passam.
5. O dashboard/web e o app mobile são verificados contra a API candidata.

## Comandos

| Comando | Cobertura |
| --- | --- |
| `npm test` (raiz) | Testes unitários do monólito, API e typecheck mobile. |
| `npm run lint` (raiz) | Lint do monólito. |
| `npm --prefix financeiro-api test` | Testes da API e, se configuradas, comparações de contrato. |
| `npm --prefix financeiro-api run test:database` | Teste de integração do dashboard contra PostgreSQL; só executa com `RUN_DATABASE_TESTS=true`. |

Para uma homologação, configure `RUN_DATABASE_TESTS=true` e execute o último comando. O teste roda em transação e força rollback; ainda assim, nunca o aponte para produção.

O workflow `quality.yml` executa a suíte em todo push e pull request. A comparação ao vivo deve ser adicionada como etapa de deploy/homologação com as duas origens explicitamente configuradas.
