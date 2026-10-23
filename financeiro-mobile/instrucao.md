# Simulação e uso do Financeiro Mobile

Este guia explica como executar o aplicativo, simular seu uso e testá-lo em um iPhone.

## 1. Pré-requisitos

Tenha instalado no computador:

- Node.js LTS;
- npm;
- as dependências do projeto (já instaladas se a pasta `node_modules` existir).

Para testar no iPhone, instale também o aplicativo **Expo Go** pela App Store.

## 2. Configurar a API

O aplicativo depende da API do projeto `app-financeiro-monolito`. Crie um arquivo chamado `.env` dentro desta pasta, copiando o conteúdo de `.env.example`:

```env
EXPO_PUBLIC_API_URL=https://seu-dominio.com
```

Substitua a URL pelo endereço HTTPS público onde o backend está rodando.

> Importante: não use `http://localhost:3000` para testar no iPhone. No celular, `localhost` representa o próprio iPhone, e não o computador. A API deve estar publicada em HTTPS ou exposta temporariamente por um túnel HTTPS.

## 3. Validar o projeto

Abra o PowerShell nesta pasta e execute:

```powershell
npm.cmd run typecheck
```

O comando deve finalizar sem erros.

## 4. Simular no navegador

Para abrir o app como uma aplicação web:

```powershell
npm.cmd run web
```

Quando o Expo iniciar, pressione `w` no terminal caso o navegador não abra automaticamente. A simulação permite conferir as telas, mas o teste no iPhone é o mais fiel ao aplicativo móvel.

## 5. Simular em emulador

### Android

Com um emulador Android aberto, execute:

```powershell
npm.cmd run android
```

### iOS

O simulador iOS exige macOS e Xcode. Em um Mac, execute:

```bash
npm run ios
```

No Windows, utilize o Expo Go no iPhone para testar iOS.

## 6. Testar no iPhone com Expo Go

Este é o caminho mais simples para testar o app em um aparelho real.

1. Confirme que a variável `EXPO_PUBLIC_API_URL` aponta para uma API HTTPS acessível pelo iPhone.
2. No PowerShell, dentro da pasta `financeiro-mobile`, execute:

   ```powershell
   npm.cmd start -- --tunnel
   ```

3. Aguarde o Expo exibir um QR code no terminal ou no navegador.
4. Abra a câmera do iPhone e leia o QR code.
5. Toque no link exibido e escolha abrir no Expo Go.
6. Aguarde o carregamento do aplicativo.

O parâmetro `--tunnel` permite abrir o Expo mesmo quando computador e iPhone não estão na mesma rede. Ele não publica o backend: a URL da API ainda precisa ser pública e HTTPS.

## 7. Roteiro de uso do aplicativo

Após abrir o app:

1. Na tela de login, informe a senha configurada no backend.
2. Toque em **Entrar**.
3. Na aba **Início**, confira o resumo mensal:
   - saldo previsto;
   - total de receitas;
   - total de gastos;
   - gastos fixos, gastos variáveis e receitas do mês.
4. Puxe a tela para baixo para atualizar os dados do dashboard.
5. Abra a aba **Lançamentos**. Nesta versão, ela informa que o cadastro e a edição de receitas e gastos ainda serão implementados.
6. Abra **Ajustes** e use **Sair da conta** para encerrar a sessão. O token é armazenado de forma segura no dispositivo.

## 8. Problemas comuns

| Sintoma | Causa provável | Como resolver |
| --- | --- | --- |
| Erro “Defina EXPO_PUBLIC_API_URL” | Arquivo `.env` ausente ou variável vazia | Crie/ajuste o `.env` e reinicie o Expo. |
| Erro de rede ao fazer login | API não está acessível pelo iPhone | Use uma URL HTTPS pública; não use `localhost`. |
| QR code não abre | Expo não está em execução ou o link expirou | Execute novamente `npm.cmd start -- --tunnel`. |
| Dados não aparecem no início | Login, API ou dados do mês atual não estão disponíveis | Confira a resposta de `/api/dashboard?mes=AAAA-MM` no backend. |
| Comando `npm` é bloqueado no PowerShell | Política de execução do Windows | Use `npm.cmd`, como nos exemplos deste guia. |

## 9. Instalação definitiva no iPhone

O Expo Go é apropriado para testes. Para instalar o Financeiro como app próprio, sem depender do Expo Go, gere uma versão iOS via EAS Build e distribua-a pelo TestFlight. Isso exige uma conta Expo e uma assinatura ativa no Apple Developer Program. Consulte o `README.md` para os comandos de build e envio ao TestFlight.
