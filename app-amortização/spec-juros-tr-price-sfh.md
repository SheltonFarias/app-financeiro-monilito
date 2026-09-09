# Especificação: Juros, TR e Amortização — Financiamento CAIXA (Price/SFH)

> Baseado no contrato nº 8.7877.1271835-8 — CAIXA, Programa Casa Verde e Amarela,
> Sistema de Amortização PRICE, origem dos recursos FGTS/União.

Este documento descreve, com o nível de detalhe necessário para implementação,
como a CAIXA calcula juros, correção monetária (TR) e o valor da prestação
mensal ao longo da vida do contrato.

---

## 1. Dados fixos do contrato (inputs)

| Campo | Valor | Origem no contrato |
|---|---|---|
| Valor financiado (principal) | R$ 126.630,40 | B.4.1 / B.5.1 |
| Sistema de amortização | PRICE | B.3 |
| Taxa de juros nominal | 4,7500% a.a. | B.8 |
| Taxa de juros efetiva | 4,8547% a.a. | B.8 |
| Prazo total de amortização | 360 meses | B.7.3 |
| Carência | 0 meses | B.7.2 |
| Data do 1º vencimento | 10/12/2021 | B.10 |
| Prestação inicial (A+J) | R$ 660,56 | B.9.1.2 |
| Seguro (MIP+DFI) inicial | R$ 25,03 | B.9.1.4 |
| Encargo mensal inicial total | R$ 685,59 | B.9.1.5 |
| Valor do imóvel p/ garantia | R$ 158.288,00 | B.6 |
| Índice de correção do saldo devedor | Índice de atualização das contas vinculadas do FGTS (≈ TR) | Cláusula 9 |

---

## 2. Conceito central: ordem das operações (Cláusula 6.3 e 9 do contrato)

O ponto mais importante — e a fonte mais comum de erro em implementações — é a
**ordem em que TR e juros são aplicados**. O contrato deixa isso explícito:

> **Cláusula 9**: "Ocorre mensalmente, na data de vencimento do encargo mensal,
> [a atualização] pelo índice de atualização das contas vinculadas do FGTS."
>
> **Cláusula 6.3**: "As prestações (A+J) [...] são recalculadas mensalmente,
> atualizadas na forma do item 9, sendo que a parcela de juros é obtida pela
> aplicação da taxa de juros mensal vigente com base no saldo devedor
> **atualizado** e a parcela de amortização obtida pela diferença entre a
> prestação e a parcela de juros."

Ou seja, o fluxo mensal é sempre:

```
1. Saldo devedor do mês anterior (SD_{t-1})
2. Aplica-se a TR do mês → SD_corrigido = SD_{t-1} × (1 + TR_mes)
3. Sobre o SD_corrigido, calculam-se os juros do mês (taxa fixa contratual)
4. Amortização = Prestação(A+J) − Juros_do_mês
5. Novo saldo devedor: SD_t = SD_corrigido − Amortização
```

**A TR corrige o saldo ANTES do cálculo dos juros — nunca depois, e nunca
juntas numa taxa composta única.** Isso é diferente de simplesmente somar
"taxa de juros + TR" como se fosse uma taxa efetiva combinada.

---

## 3. Taxa de juros mensal

A taxa nominal contratual é 4,75% a.a. A CAIXA usa capitalização simples
mensal a partir da taxa nominal:

```
i_mensal = taxa_nominal_anual / 12
i_mensal = 0,0475 / 12 = 0,00395833... (≈ 0,395833% ao mês)
```

Isso é consistente com a taxa efetiva informada (4,8547% a.a.), pois:

```
(1 + i_mensal)^12 − 1 ≈ 4,8535% a.a.  (bate, com diferença residual de
                                        arredondamento/CET, com a 4,8547%
                                        informada no contrato)
```

> **Recomendação de implementação**: guarde `i_mensal` calculado a partir da
> taxa nominal (`taxa_nominal / 12`), não a partir da taxa efetiva. É esse o
> valor usado internamente pela CAIXA no recálculo mês a mês (cláusula 6.3
> menciona "taxa de juros mensal vigente").

---

## 4. A TR (Taxa Referencial)

### 4.1 O que corrige exatamente

O contrato não usa a "TR de mercado" diretamente — usa **o índice de
atualização das contas vinculadas do FGTS** (cláusula 9), que na prática
**é a TR** divulgada pelo Bacen, pois é o índice legal usado para corrigir
saldos de FGTS e poupança.

Para fins de implementação, use a série da TR mensal do Bacen (SGS):

```
Código da série SGS (Bacen): 226 — Taxa Referencial (TR) mensal
Endpoint (JSON):
https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados?formato=json

Endpoint (últimos N valores):
https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/{N}?formato=json
```

Cada registro retorna `{"data": "dd/mm/aaaa", "valor": "0.17"}` — o `valor` já
vem em **percentual** (ex.: `0.17` = 0,17% no mês). Divida por 100 para obter
a fração decimal (`0.0017`) antes de aplicar na fórmula.

### 4.2 Como aplicar

```
fator_TR = 1 + (TR_do_mes_em_percentual / 100)
SD_corrigido = SD_anterior × fator_TR
```

Se a TR do mês for 0% (o que já ocorreu em vários períodos entre 2017-2021),
`fator_TR = 1` e o saldo simplesmente não sofre correção monetária naquele
mês — só juros.

### 4.3 Qual data de TR usar em cada parcela

A cláusula 9.1 diz que a atualização é sempre mensal, na data de vencimento
do encargo. Na prática, use **a TR divulgada no mês de competência da
parcela** (mês de referência), não a TR do dia exato do vencimento — a
divulgação do Bacen já é consolidada mensalmente.

---

## 5. Algoritmo completo (pseudocódigo)

```python
def gerar_tabela_price_tr(
    principal: float,        # 126630.40
    taxa_nominal_anual: float,  # 0.0475
    prazo_meses: int,        # 360
    serie_tr: list[float],   # TR mensal em fração decimal, um valor por mês
                              # (ex.: 0.0017 para 0,17%)
):
    i_mensal = taxa_nominal_anual / 12
    saldo_devedor = principal

    # Prestação (A+J) inicial pela fórmula Price, sobre o saldo original
    prestacao = principal * (i_mensal * (1 + i_mensal) ** prazo_meses) / \
                ((1 + i_mensal) ** prazo_meses - 1)

    tabela = []
    for mes in range(1, prazo_meses + 1):
        tr_mes = serie_tr[mes - 1]

        # 1. Corrige o saldo pela TR ANTES de calcular juros
        saldo_corrigido = saldo_devedor * (1 + tr_mes)

        # 2. Juros do mês incidem sobre o saldo já corrigido
        juros = saldo_corrigido * i_mensal

        # 3. Recalcula a prestação (Price) sobre o saldo corrigido e o
        #    prazo remanescente — necessário porque o saldo mudou com a TR
        meses_restantes = prazo_meses - mes + 1
        prestacao = saldo_corrigido * (i_mensal * (1 + i_mensal) ** meses_restantes) / \
                    ((1 + i_mensal) ** meses_restantes - 1)

        # 4. Amortização = prestação menos juros
        amortizacao = prestacao - juros

        # 5. Novo saldo devedor
        saldo_devedor = saldo_corrigido - amortizacao

        tabela.append({
            "mes": mes,
            "tr_aplicada": tr_mes,
            "saldo_antes_tr": saldo_devedor,       # ver nota abaixo
            "saldo_corrigido_tr": saldo_corrigido,
            "juros": juros,
            "amortizacao": amortizacao,
            "prestacao_A_J": prestacao,
            "saldo_devedor_final": saldo_devedor,
        })

    return tabela
```

> **Nota**: a variável `saldo_antes_tr` no pseudocódigo acima deve ser lida
> *antes* de sobrescrever `saldo_devedor` no passo 5 — ajuste a ordem das
> atribuições na sua implementação real para não perder o valor.

### 5.1 Por que recalcular a prestação todo mês (passo 3)?

Porque, ao contrário do Price "puro" (sem TR), aqui o saldo devedor muda por
um motivo que não é a amortização contratual — muda pela correção monetária.
Se você mantivesse a prestação fixa do mês 1 durante todo o contrato, o saldo
nunca chegaria a zero exatamente no mês 360 quando a TR for diferente de
zero. Por isso a cláusula 6.3 exige recálculo mensal da prestação com base
no saldo corrigido e no prazo remanescente — é assim que a CAIXA garante que
a dívida se extingue exatamente no último mês, mesmo com TR variável.

---

## 6. Seguros (MIP e DFI) — não confundir com juros/TR

O encargo mensal total pago pelo mutuário **não é só a prestação (A+J)**:

```
Encargo mensal = Prestação (A+J) + Tarifa de Administração (se houver) + Seguro MIP + Seguro DFI
```

No seu contrato (item B.9.1): Prestação R$ 660,56 + Seguro R$ 25,03 = Encargo
R$ 685,59 (Tarifa de Administração = R$ 0,00 nesse contrato).

- **MIP** (Morte e Invalidez Permanente): recalculado mensalmente sobre o
  **saldo devedor atualizado**, com base na faixa etária do mutuário
  (cláusula 24.1.1 e Anexo I). Muda de faixa quando o mutuário completa
  aniversário.
- **DFI** (Danos Físicos ao Imóvel): recalculado sobre o **valor de garantia
  atualizado** do imóvel (item B.6, R$ 158.288,00), não sobre o saldo
  devedor.

Se sua aplicação quiser refletir o encargo mensal completo (não só a
amortização Price), esses dois componentes precisam de tabelas de prêmio por
faixa etária/CESH que **não constam no contrato em si** — dependem da
apólice vigente (cláusula 24.6). Para fins de simulação de amortização pura,
é comum modelar só a Prestação (A+J) e tratar o seguro como um valor
aproximado à parte.

---

## 7. Resumo das regras de negócio para o código

1. **Nunca** aplique juros e TR na mesma operação combinada — são sequenciais
   (TR primeiro, juros depois, sobre o saldo já corrigido).
2. A taxa de juros mensal é fixa em `taxa_nominal_anual / 12` durante toda a
   vida do contrato (Price com taxa prefixada).
3. A TR é o único componente variável mês a mês — busque na série SGS 226 do
   Bacen.
4. A prestação (A+J) **não é fixa**: é recalculada todo mês pela fórmula
   Price, usando o saldo corrigido pela TR e o número de parcelas restantes.
   Isso garante amortização total no mês 360.
5. Se TR = 0 no mês, o comportamento se reduz ao Price tradicional naquele
   mês específico.
6. Seguros (MIP/DFI) são componentes separados do encargo mensal, calculados
   sobre saldo devedor e valor de garantia respectivamente — não fazem parte
   do cálculo de amortização Price em si.

---

## 8. Fonte dos dados de TR (Bacen SGS)

```
GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados?formato=json&dataInicial=DD/MM/AAAA&dataFinal=DD/MM/AAAA
```

Resposta:
```json
[
  {"data": "01/07/2026", "valor": "0.17"},
  {"data": "01/06/2026", "valor": "0.17"}
]
```

Converta `valor` (string, percentual) para fração decimal antes de usar na
fórmula: `tr_fracao = float(valor) / 100`.
