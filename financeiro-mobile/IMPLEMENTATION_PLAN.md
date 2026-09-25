# Plano de implementação — Financeiro Mobile

## Estado atual

- [x] Projeto Expo + React Native + TypeScript criado.
- [x] Navegação com Expo Router e abas de início, lançamentos e ajustes.
- [x] Autenticação por `POST /api/auth/login` e token protegido em `expo-secure-store`.
- [x] Dashboard mensal por `GET /api/dashboard` com cache do TanStack Query e atualização manual.
- [x] Dependências compatíveis com Expo SDK 54 instaladas e checagem TypeScript concluída.
- [ ] Definir `EXPO_PUBLIC_API_URL` com a URL HTTPS do ambiente de homologação.
- [ ] Validar login e dashboard em aparelho/emulador contra a API acessível pela rede.

## Próxima entrega: lançamentos (MVP)

1. Tipar contratos de receitas, gastos fixos, gastos variáveis e configurações.
2. Criar cliente para listar, criar, editar, remover e alternar status dos lançamentos.
3. Implementar a tela **Lançamentos** com filtro de mês, listas e estados vazio/erro/carregamento.
4. Criar formulário reutilizável com categoria e forma de pagamento obtidas de `/api/configuracoes`.
5. Invalidar dashboard e listas após cada mutação e confirmar os fluxos em Android e iOS.

## Dependências do backend

- API publicada em HTTPS e alcançável pelo dispositivo; `localhost` não funciona em celular físico.
- Respostas preservando o envelope `{ success, data, error }`.
- Retorno `401` consistente para token inválido ou expirado, permitindo encerrar a sessão no app.
- CORS restrito aos ambientes autorizados quando o monólito estiver em domínio separado.

## Fases seguintes

| Fase | Resultado |
| --- | --- |
| 2 — MVP financeiro | CRUD de receitas e gastos, mês, status e configurações. |
| 3 — Qualidade | Validações, acessibilidade, testes de fluxos críticos e monitoramento de erros. |
| 4 — Expansão | Metas, cartões, investimentos, relatórios e financiamentos por prioridade. |
| 5 — Publicação | Ícones, privacidade, EAS Build e distribuição nas lojas. |
