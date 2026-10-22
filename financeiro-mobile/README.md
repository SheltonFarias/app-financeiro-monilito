# Financeiro Mobile

Aplicativo Expo/React Native que consome a API do `app-financeiro-monolito`.

## Estado atual

O primeiro incremento está funcional: login, sessão segura no dispositivo, dashboard mensal, atualização manual e logout. As telas de lançamentos e ajustes ainda não possuem o CRUD financeiro completo.

Antes de testar, crie `.env` a partir de `.env.example` e informe uma URL HTTPS pública da API:

```env
EXPO_PUBLIC_API_URL=https://api.exemplo.com
```

`localhost` não funciona no iPhone: a URL deve ser acessível pelo aparelho. Para um teste local, publique temporariamente o backend por um túnel HTTPS; para uso contínuo, hospede a API em um domínio HTTPS.

## Testar agora no iPhone — Expo Go

Este é o caminho mais rápido e não exige Mac nem conta Apple Developer.

1. Instale o **Expo Go** pela App Store no iPhone.
2. No computador, abra esta pasta e execute:

   ```powershell
   npm.cmd start -- --tunnel
   ```

3. Escaneie, com a câmera do iPhone, o QR code mostrado pelo Expo.
4. O app abrirá no Expo Go. Faça login depois de configurar a URL da API.

O modo `--tunnel` ajuda quando computador e iPhone não estão na mesma rede. Ele não torna a API local acessível por si só.

## Instalar como app próprio — TestFlight

O projeto está preparado para build remoto pelo EAS, sem precisar de Mac. Para distribuir pelo TestFlight você precisa de uma conta Expo e de uma assinatura ativa do **Apple Developer Program**.

1. Confirme que `ios.bundleIdentifier` em `app.json` é um identificador que pertence à sua conta Apple. O valor inicial é `com.farias.financeiro`.
2. Autentique-se na Expo e gere o build de produção:

   ```powershell
   npx.cmd eas-cli@latest login
   npx.cmd eas-cli@latest build --platform ios --profile production
   ```

3. No primeiro build, autorize a criação ou o uso das credenciais Apple quando solicitado.
4. Envie o build ao App Store Connect:

   ```powershell
   npx.cmd eas-cli@latest submit --platform ios --latest
   ```

5. No App Store Connect, adicione seu Apple ID como testador interno e aceite o convite do TestFlight no iPhone. Depois, instale o app pelo TestFlight.

Para uma instalação interna fora do TestFlight, use `--profile preview`; a Apple pedirá que o UDID do iPhone seja registrado. O TestFlight costuma ser o fluxo mais simples para uso pessoal e atualizações.

## Verificações locais

```powershell
npm.cmd run typecheck
```
