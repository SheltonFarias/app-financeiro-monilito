/**
 * gastosVariaveis.service.js — Lógica de negócio de Gastos Variáveis.
 */
const { GastosVariaveisRepository } = require('./gastosVariaveis.repository');
const { MetasRepository } = require('../metas/metas.repository');
const { AppError } = require('../../utils/AppError');

const GastosVariaveisService = {
  /**
   * Lista gastos variáveis de um mês.
   * @param {string} mes
   * @returns {Promise<import('./gastosVariaveis.repository').GastoVariavel[]>}
   */
  async listarPorMes(mes) {
    if (!mes) throw new AppError('Parâmetro "mes" é obrigatório.', 400);
    return await GastosVariaveisRepository.findByMes(mes);
  },

  /**
   * Cria um novo gasto variável.
   * Converte dataCompra (camelCase do frontend) para data_compra (snake_case do DB).
   * @param {Object} dados - Dados validados pelo schema
   */
  async criar(dados) {
    const NOMES_MESES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    
    // Helper para projetar meses
    const getNextMonths = (mesAtual, qtd) => {
      const match = mesAtual.match(/([A-Za-zÀ-ú]+)(\d+)/);
      if (!match) return [mesAtual];
      let mesNome = match[1];
      let ano = parseInt(match[2], 10);
      let idx = NOMES_MESES.indexOf(mesNome);
      if (idx === -1) return [mesAtual];
      
      const meses = [mesAtual];
      for (let i = 1; i < qtd; i++) {
        idx++;
        if (idx > 11) { idx = 0; ano++; }
        meses.push(NOMES_MESES[idx] + ano);
      }
      return meses;
    };

    const parcelas = dados.qtd_parcelas || 1;
    const valorTotal = dados.valor;
    const valorParcela = parcelas > 1 ? parseFloat((valorTotal / parcelas).toFixed(2)) : valorTotal;

    const meses = getNextMonths(dados.mes, parcelas);
    let primeiroId = null;

    // Gera um grupo_id compartilhado entre todas as parcelas da mesma compra.
    // Parcelas avulsas (qtd = 1) ficam com grupo_id = null.
    const grupoId = parcelas > 1
      ? `gv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      : null;

    for (let i = 0; i < parcelas; i++) {
      const desc = parcelas > 1 ? `${dados.descricao} (${i + 1}/${parcelas})` : dados.descricao;
      const situacao = i === 0 ? dados.situacao : 'Pendente'; // Apenas a 1a pode vir "Paga" do formulário
      
      const dbDados = {
        ...dados,
        descricao:  desc,
        valor:      valorParcela,
        situacao:   situacao,
        mes:        meses[i],
        data_compra: dados.dataCompra || null,
        grupo_id:   grupoId,
      };
      delete dbDados.dataCompra;
      delete dbDados.qtd_parcelas;
      delete dbDados.subcategoria;
      delete dbDados.tags;

      const { id } = await GastosVariaveisRepository.create(dbDados);
      if (i === 0) primeiroId = id;
    }

    return await GastosVariaveisRepository.findById(primeiroId);
  },

  /**
   * Atualiza um gasto variável existente.
   * @param {string} id
   * @param {Object} dados
   */
  async atualizar(id, dados) {
    const existe = await GastosVariaveisRepository.findById(id);
    if (!existe) throw new AppError(`Gasto variável com ID ${id} não encontrado.`, 404);

    const dbDados = {
      ...dados,
      data_compra: dados.dataCompra || null,
    };
    delete dbDados.dataCompra;
    delete dbDados.qtd_parcelas;
    delete dbDados.subcategoria;
    delete dbDados.tags;
    // template_id e grupo_id são gerenciados pelo sistema — nunca sobrescrever via edição manual
    delete dbDados.template_id;
    delete dbDados.grupo_id;

    await GastosVariaveisRepository.update(id, dbDados);
    return await GastosVariaveisRepository.findById(id);
  },

  /**
   * Atualiza apenas a situação.
   * Se o gasto estiver vinculado a uma meta via gasto_variavel_id, sincroniza o valor_atual:
   *  - "Pago"     → incrementa valor_atual da meta pelo valor do gasto
   *  - "Pendente" → decrementa valor_atual da meta pelo valor do gasto (mín. 0)
   * @param {string} id
   * @param {string} situacao
   */
  async atualizarStatus(id, situacao) {
    const existe = await GastosVariaveisRepository.findById(id);
    if (!existe) throw new AppError(`Gasto variável com ID ${id} não encontrado.`, 404);

    const statusAnterior = existe.situacao;
    await GastosVariaveisRepository.updateStatus(id, situacao);

    // ── Sincroniza valor_atual da meta vinculada ──────────────────────────────
    try {
      const meta = await MetasRepository.findByGastoVariavelId(id);
      if (meta) {
        const valor = existe.valor ?? 0;
        if (situacao === 'Pago' && statusAnterior !== 'Pago') {
          // Marcado como pago → contabiliza no arrecadado
          await MetasRepository.ajustarValorAtual(meta.id, valor);
        } else if (situacao === 'Pendente' && statusAnterior === 'Pago') {
          // Revertido para pendente → desconta do arrecadado
          await MetasRepository.ajustarValorAtual(meta.id, -valor);
        }
      }
    } catch (err) {
      // Falha na sincronização não deve derrubar o update de status
      console.error('[GastosVariaveisService] Erro ao sincronizar meta:', err.message);
    }

    return await GastosVariaveisRepository.findById(id);
  },

  async remover(id) {
    const existe = await GastosVariaveisRepository.findById(id);
    if (!existe) throw new AppError(`Gasto variável com ID ${id} não encontrado.`, 404);

    // Se este gasto for a contribuição ativa de alguma meta, precisamos desativá-la
    // para não deixar um gasto_variavel_id fantasma na tabela de metas.
    try {
      const meta = await MetasRepository.findByGastoVariavelId(id);
      if (meta) {
        await MetasRepository.desativarContribuicao(meta.id);
      }
    } catch (e) {
      console.error('[GastosVariaveisService] Erro ao desvincular meta na exclusão:', e.message);
    }

    await GastosVariaveisRepository.delete(id);
  },

  /**
   * Remove todas as parcelas do mesmo grupo (grupo_id) de um gasto variável.
   * Se o registro não tiver grupo_id, remove apenas ele (comportamento igual ao remover).
   * @param {string} id - ID de qualquer parcela do grupo
   * @returns {{ removidos: number }}
   */
  async removerSerie(id) {
    const existe = await GastosVariaveisRepository.findById(id);
    if (!existe) throw new AppError(`Gasto variável com ID ${id} não encontrado.`, 404);

    if (!existe.grupo_id) {
      // Sem grupo — remove só este
      await GastosVariaveisRepository.delete(id);
      return { removidos: 1 };
    }

    const removidos = await GastosVariaveisRepository.deleteByGrupoId(existe.grupo_id);
    return { removidos };
  },
};

module.exports = { GastosVariaveisService };
