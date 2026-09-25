-- CreateTable
CREATE TABLE "financiamentos" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "agencia" TEXT,
    "numero_contrato" TEXT,
    "programa" TEXT,
    "valor_imovel" DOUBLE PRECISION NOT NULL,
    "valor_financiado" DOUBLE PRECISION NOT NULL,
    "recursos_proprios" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "desconto_fgts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxa_juros_nominal_anual" DOUBLE PRECISION NOT NULL,
    "taxa_efetiva_anual" DOUBLE PRECISION,
    "sistema_amort" TEXT NOT NULL DEFAULT 'PRICE',
    "indice_correcao" TEXT NOT NULL DEFAULT 'TR',
    "prazo_meses" INTEGER NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "parcela_atual" INTEGER NOT NULL DEFAULT 1,
    "prestacao_inicial_aj" DOUBLE PRECISION NOT NULL,
    "seguro_mensal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_mensal_inicial" DOUBLE PRECISION NOT NULL,
    "tarifa_administracao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "garantia_fiduciaria" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financiamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelas_pagas" (
    "id" TEXT NOT NULL,
    "financiamento_id" TEXT NOT NULL,
    "numero_parcela" INTEGER NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "data_pagamento_real" TIMESTAMP(3),
    "valor_pago" DOUBLE PRECISION NOT NULL,
    "seguro_pago" DOUBLE PRECISION,
    "observacao" TEXT,

    CONSTRAINT "parcelas_pagas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amortizacoes_extras" (
    "id" TEXT NOT NULL,
    "financiamento_id" TEXT NOT NULL,
    "data_pagamento" TIMESTAMP(3) NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "modalidade" TEXT NOT NULL,
    "parcela_referencia" INTEGER,
    "economia_juros" DOUBLE PRECISION,
    "meses_economizados" INTEGER,
    "novo_saldo_devedor" DOUBLE PRECISION,
    "observacao" TEXT,

    CONSTRAINT "amortizacoes_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indices_bcb_cache" (
    "id" TEXT NOT NULL,
    "financiamento_id" TEXT NOT NULL,
    "serie" INTEGER NOT NULL,
    "competencia" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indices_bcb_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parcelas_pagas_financiamento_id_numero_parcela_key" ON "parcelas_pagas"("financiamento_id", "numero_parcela");

-- CreateIndex
CREATE INDEX "amortizacoes_extras_financiamento_id_idx" ON "amortizacoes_extras"("financiamento_id");

-- CreateIndex
CREATE INDEX "indices_bcb_cache_financiamento_id_serie_idx" ON "indices_bcb_cache"("financiamento_id", "serie");

-- CreateIndex
CREATE UNIQUE INDEX "indices_bcb_cache_financiamento_id_serie_competencia_key" ON "indices_bcb_cache"("financiamento_id", "serie", "competencia");

-- AddForeignKey
ALTER TABLE "parcelas_pagas" ADD CONSTRAINT "parcelas_pagas_financiamento_id_fkey" FOREIGN KEY ("financiamento_id") REFERENCES "financiamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amortizacoes_extras" ADD CONSTRAINT "amortizacoes_extras_financiamento_id_fkey" FOREIGN KEY ("financiamento_id") REFERENCES "financiamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indices_bcb_cache" ADD CONSTRAINT "indices_bcb_cache_financiamento_id_fkey" FOREIGN KEY ("financiamento_id") REFERENCES "financiamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
