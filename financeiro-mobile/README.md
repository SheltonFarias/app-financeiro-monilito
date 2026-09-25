# Financeiro Mobile

Aplicativo Expo/React Native que consome a API do `app-financeiro-monolito`.

## Executar

1. Instale Node.js (LTS) e npm.
2. Copie `.env.example` para `.env` e informe a URL HTTPS pública do monólito:

   ```env
   EXPO_PUBLIC_API_URL=https://api.exemplo.com
   ```

3. Instale dependências e inicie o Expo:

   ```bash
   npm install
   npm start
   ```

No desenvolvimento em aparelho físico, a API precisa estar acessível pela rede e usar HTTPS. `localhost` não aponta para o computador quando o aplicativo roda no celular.

## Primeiro incremento entregue

- Login usando `POST /api/auth/login`;
- JWT armazenado via `expo-secure-store`;
- Dashboard mensal usando `GET /api/dashboard?mes=...`;
- Atualização manual do dashboard e logout seguro.
