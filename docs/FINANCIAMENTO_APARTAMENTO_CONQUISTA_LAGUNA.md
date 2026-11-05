# Cadastro - Financiamento Apartamento Conquista Laguna

## Fonte e escopo

Os dados abaixo foram conferidos no contrato CAIXA no 8.7877.1271835-8. O cadastro representa o contrato original; o saldo e o prazo remanescentes informados pelo banco devem ser usados como referencia operacional para as proximas simulacoes.

## Dados do contrato

| Campo | Valor |
| --- | --- |
| Descricao | Apartamento Conquista Laguna - ap. 203, bloco 31 |
| Banco | Caixa Economica Federal |
| Numero do contrato | 8.7877.1271835-8 |
| Programa | Casa Verde e Amarela - FGTS/Uniao |
| Modalidade | Aquisicao de terreno e construcao de imovel residencial urbano |
| Sistema de amortizacao | PRICE |
| Indice de correcao | TR |
| Valor do imovel | R$ 163.640,00 |
| Valor financiado | R$ 126.630,40 |
| Recursos proprios | R$ 28.138,60 |
| Desconto complementar FGTS/Uniao | R$ 8.871,00 |
| Garantia fiduciaria | R$ 158.288,00 |
| Taxa nominal | 4,7500% a.a. |
| Taxa efetiva | 4,8547% a.a. |
| Prazo de amortizacao | 360 meses |
| Primeiro encargo mensal | 10/12/2021 |
| Prestacao inicial (amortizacao + juros) | R$ 660,56 |
| Seguro inicial | R$ 25,03 |
| Total mensal inicial | R$ 685,59 |
| Tarifa administrativa | R$ 0,00 |

## Posicao informada em 10/10/2026

| Indicador | Valor |
| --- | --- |
| Saldo devedor informado | R$ 126.177,71 |
| Meses restantes informados | 321 |
| Proxima parcela de amortizacao no sistema | 40 de 360 |

O contrato teve fase de construcao. Por isso, os 58 pagamentos informados entre janeiro de 2022 e outubro de 2026 nao devem ser cadastrados automaticamente como 58 parcelas PRICE: os encargos de obra nao equivalem necessariamente a parcelas de amortizacao. A referencia de 321 meses restantes e a fonte usada para definir a proxima parcela como 40.

## Como cadastrar pelo formulario

1. Abra **Financiamentos** e selecione **Novo financiamento**.
2. Informe os campos abaixo:

   - Descricao: `Apartamento Conquista Laguna - ap. 203, bloco 31`
   - Banco: `Caixa Economica Federal`
   - Valor do imovel: `163640.00`
   - Valor financiado: `126630.40`
   - Juros anual: `4.7500`
   - CET anual: `4.8547`
   - Prazo: `360`
   - Inicio do contrato: `2021-12-10`
   - Prestacao inicial: `660.56`
   - Total mensal inicial: `685.59`
   - Sistema de amortizacao: `PRICE`
   - Indice de correcao: `TR`
   - Seguro mensal: `25.03`
   - Tarifa administrativa: `0`
   - Recursos proprios: `28138.60`
   - FGTS utilizado: `8871.00`

3. Salve o contrato.
4. Para uma atualizacao exata de um cadastro existente, mantenha tambem estes campos no registro da API: `numeroContrato` com `8.7877.1271835-8`, `programa` com `Casa Verde e Amarela - FGTS/Uniao`, `garantiaFiduciaria` com `158288` e `parcelaAtual` com `40`.

## TR e conferencias futuras

O sistema usa a serie 226 do Banco Central para TR. Os valores diarios publicados no mes sao compostos para formar a correcao mensal do saldo devedor. Ao abrir a tabela do financiamento, o sistema consulta e atualiza esse cache; se o Banco Central estiver indisponivel, utiliza o ultimo valor armazenado.

Confirme periodicamente no app da CAIXA ou no boleto:

- saldo devedor;
- quantidade de meses restantes;
- premio de seguro MIP/DFI, que pode variar;
- valor total da proxima prestacao; e
- eventual amortizacao extraordinaria ou renegociacao.

O cadastro guarda os parametros contratuais. A projecao do sistema e estimativa: ela nao reproduz automaticamente os encargos da fase de obra nem substitui o demonstrativo oficial da CAIXA.
