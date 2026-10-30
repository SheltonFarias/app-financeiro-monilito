-- A faixa planejada é opcional: cartões existentes continuam usando o limite real.
ALTER TABLE "cartoes_credito"
  ADD COLUMN IF NOT EXISTS "limite_planejado" DOUBLE PRECISION;
