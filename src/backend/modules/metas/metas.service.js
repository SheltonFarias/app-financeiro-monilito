/**
 * metas.service.js — Regras de negócio para Metas.
 */
const { MetasRepository } = require('./metas.repository');
const { metaSchema } = require('./metas.schema');
const { AppError } = require('../../utils/AppError');
const { GastosVariaveisRepository } = require('../gastos-variaveis/gastosVariaveis.repository');

// ─── Helpers de data ──────────────────────────────────────────────────────────

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Calcula quantos meses restam entre hoje e uma data limite "YYYY-MM-DD".
 * Retorna null se não houver data ou se já passou.
 */
function calcularMesesRestantes(dataLimite) {
  if (!dataLimite) return null;
  const limite = new Date(dataLimite);
  const hoje   = new Date();

  const diffAnos  = limite.getFullYear() - hoje.getFullYear();
  const diffMeses = limite.getMonth()    - hoje.getMonth();
  const total = diffAnos * 12 + diffMeses;

  return total > 0 ? total : null;
}

/**
 * Retorna a string do mês atual no formato "Julho2026".
 */
function getMesAtual() {
  const agora = new Date();
  return MESES_PT[agora.getMonth()] + agora.getFullYear();
}

// ─── Service ─────────────────────────────────────────────────────────────────

const MetasService = {
  listar() {
    return MetasRepository.findAll();
  },

  criar(dadosRaw) {
    const validacao = metaSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const { id } = MetasRepository.create(validacao.data);
    return MetasRepository.findById(id);
  },

  atualizar(id, dadosRaw) {
    const validacao = metaSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const meta = MetasRepository.findById(id);
    if (!meta) throw new AppError('Meta não encontrada', 404);

    MetasRepository.update(id, validacao.data);
    return MetasRepository.findById(id);
  },

  deletar(id) {
    const meta = MetasRepository.findById(id);
    if (!meta) throw new AppError('Meta não encontrada', 404);
    MetasRepository.delete(id);
    return { id };
  },

  /**
   * Ativa a contribuição mensal automática para uma meta.
   * Cria um Gasto Variável mensal recorrente com o valor calculado e
   * vincula o ID deste gasto à meta.
   *
   * Fórmula: contribuição = (valor_alvo - valor_atual) / meses_restantes
   *
   * @param {number} id - ID da meta
   * @param {string} [mesAtual] - Mês de referência no formato "Julho2026" (opcional, usa o atual)
   */
  ativarContribuicao(id, mesAtual) {
    const meta = MetasRepository.findById(id);
    if (!meta) throw new AppError('Meta não encontrada', 404);

    if (meta.contribuicao_ativa === 1) {
      throw new AppError('Contribuição já está ativa para esta meta.', 400);
    }

    // Calcula quantos meses restam
    const mesesRestantes = calcularMesesRestantes(meta.data_limite);
    if (!mesesRestantes) {
      throw new AppError(
        'Não é possível ativar a contribuição: data limite não definida ou já passou.',
        400
      );
    }

    const falta = (meta.valor_alvo || 0) - (meta.valor_atual || 0);
    if (falta <= 0) {
      throw new AppError('Meta já atingida — valor atual é igual ou superior ao alvo.', 400);
    }

    const contribuicaoMensal = Math.ceil((falta / mesesRestantes) * 100) / 100; // arredonda para cima em centavos

    const mes = mesAtual || getMesAtual();

    // Cria o gasto variável mensal recorrente
    const { id: gastoId } = GastosVariaveisRepository.create({
      categoria:   'Outros',
      descricao:   `Meta: ${meta.titulo}`,
      valor:       contribuicaoMensal,
      pagamento:   'Pix',
      qtd_parcelas: 1,
      situacao:    'Pendente',
      mes,
      recorrente:  1,
    });

    // Vincula à meta
    MetasRepository.ativarContribuicao(id, gastoId);

    return {
      ...MetasRepository.findById(id),
      contribuicao_mensal: contribuicaoMensal,
      meses_restantes: mesesRestantes,
    };
  },

  /**
   * Desativa a contribuição mensal de uma meta.
   * NÃO remove o gasto variável criado — apenas desfaz o vínculo.
   * @param {number} id - ID da meta
   */
  desativarContribuicao(id) {
    const meta = MetasRepository.findById(id);
    if (!meta) throw new AppError('Meta não encontrada', 404);

    MetasRepository.desativarContribuicao(id);
    return MetasRepository.findById(id);
  },
};

module.exports = { MetasService };
