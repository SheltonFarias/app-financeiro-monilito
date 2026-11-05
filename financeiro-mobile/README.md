# Financeiro Mobile

Aplicativo Expo/React Native para o sistema Financeiro. Consome exclusivamente
a API independente em `../financeiro-api`.

## O que está disponível

- login com `POST /api/auth/login` e token protegido por `expo-secure-store`;
- dashboard mensal com atualização manual;
- navegação nas abas Início, Lançamentos e Ajustes;
- logout.

A aba **Lançamentos** ainda não possui CRUD de receitas e gastos. Os demais
módulos financeiros também não estão disponíveis no aplicativo móvel.

## Roadmap do mobile

Próxima entrega: concluir a aba **Lançamentos** com contratos tipados, listagem,
criação, edição, remoção e alteração de status para receitas e gastos. Após cada
mutação, o dashboard e as listas devem ser atualizados.

As etapas seguintes são validações de acessibilidade e fluxos críticos, depois
metas, cartões, investimentos, relatórios e financiamentos conforme prioridade.
Antes de publicar, serão necessários ícones, política de privacidade e uma
distribuição por EAS Build/TestFlight ou loja equivalente.

## Pré-requisitos

- Node.js LTS e npm;
- para iPhone: o aplicativo **Expo Go**;
- para Android: Expo Go ou Android Studio com um emulador aberto;
- uma API Financeiro configurada, com PostgreSQL e credenciais de autenticação.

## 1. Preparar e iniciar a API

Em um terminal, configure a API. Não use credenciais de produção para testes.

```powershell
cd ..\financeiro-api
Copy-Item .env.example .env
# Edite .env e defina DATABASE_URL, AUTH_PASSWORD_HASH e JWT_SECRET.
npm.cmd ci
npm.cmd run prisma:generate
npm.cmd start
```

O servidor inicia, por padrão, em `http://localhost:3001`. Confirme que está
ativo abrindo `http://localhost:3001/health`; a resposta esperada é um JSON com
`"success": true`.

> Para um iPhone físico, `localhost` não funciona: ele representa o próprio
> telefone. Publique a API em uma URL HTTPS de homologação ou exponha-a por um
> túnel HTTPS confiável antes de continuar. O túnel do Expo só expõe o bundle
> do aplicativo; ele não expõe a API.

## 2. Configurar o aplicativo móvel

Em outro terminal:

```powershell
cd ..\financeiro-mobile
Copy-Item .env.example .env
```

Edite `.env` conforme o destino do teste:

```env
# iPhone físico ou Expo Go em outra rede: URL HTTPS pública da API
EXPO_PUBLIC_API_URL=https://api-homologacao.exemplo.com
```

Para teste web no mesmo computador, `http://localhost:3001` funciona. Para
Android emulador, use uma URL que o emulador alcance (normalmente
`http://10.0.2.2:3001` no emulador padrão do Android Studio), caso a política
de rede da plataforma permita HTTP. Prefira HTTPS em aparelhos reais.

Instale as dependências e valide os tipos:

```powershell
npm.cmd ci
npm.cmd run typecheck
```

O projeto ainda não tem uma suíte automatizada de testes mobile; `typecheck`
é a verificação automatizada disponível. O roteiro manual abaixo valida os
fluxos existentes.

## 3. Executar

### iPhone físico (recomendado no Windows)

1. Instale o **Expo Go** pela App Store.
2. Confirme que `EXPO_PUBLIC_API_URL` usa uma URL HTTPS pública e acessível no
   iPhone.
3. Execute:

   ```powershell
   npm.cmd start -- --tunnel
   ```

4. Leia o QR code com a câmera do iPhone e abra o link no Expo Go.

### Android

Com Expo Go no aparelho ou um emulador Android aberto:

```powershell
npm.cmd run android
```

### Navegador

Útil para validar layout e fluxo básico no mesmo computador:

```powershell
npm.cmd run web
```

Se necessário, pressione `w` no terminal do Expo.

### Simulador iOS

Requer macOS e Xcode:

```bash
npm run ios
```

## 4. Roteiro de teste manual

1. Abra o app e informe a senha configurada em `financeiro-api/.env`.
2. Toque em **Entrar** e confirme que a aba **Início** aparece.
3. Confira o resumo do mês: saldo previsto, receitas, gastos e cartões.
4. Puxe a tela para baixo e confirme que o dashboard atualiza sem perder a
   sessão.
5. Abra **Lançamentos** e confirme a mensagem de funcionalidade em evolução.
6. Abra **Ajustes**, toque em **Sair da conta** e confirme o retorno à tela de
   login.
7. Feche e reabra o app após um login: a sessão deve permanecer enquanto o
   token for válido; após sair, o login deve ser solicitado novamente.

## Problemas comuns

| Sintoma | Correção |
| --- | --- |
| `Defina EXPO_PUBLIC_API_URL` | Crie ou ajuste `.env` e reinicie o Expo. |
| Erro de rede no iPhone | Use uma URL HTTPS pública; não use `localhost`. |
| Login falha | Confira a senha, `AUTH_PASSWORD_HASH`, `JWT_SECRET`, banco e a resposta de `/health` da API. |
| QR code não abre | Reinicie com `npm.cmd start -- --tunnel` e leia o novo código. |
| PowerShell bloqueia `npm` | Use `npm.cmd`, como nos exemplos. |

## Distribuição via TestFlight

Para instalar o app sem Expo Go, é necessário uma conta Expo e uma assinatura
Apple Developer. Confirme o `ios.bundleIdentifier` em `app.json`, depois use:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build --platform ios --profile production
npx.cmd eas-cli@latest submit --platform ios --latest
```
