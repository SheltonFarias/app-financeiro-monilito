/**
 * receitas.service.js — Lógica de negócio do módulo Receitas.
 */
const { ReceitasRepository } = require('./receitas.repository');
const { AppError } = require('../../utils/AppError');

// ─── Helpers de mês ──────────────────────────────────────────────────────────

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Converte "Julho2026" em um número absoluto (ano * 12 + mesIdx) para facilitar comparações de < ou >.
 * Retorna null se o formato for inválido.
 */
function mesParaNumero(mesStr) {
  if (!mesStr) return null;
  for (let i = 0; i < MESES_PT.length; i++) {
    if (mesStr.startsWith(MESES_PT[i])) {
      const ano = parseInt(mesStr.slice(MESES_PT[i].length), 10);
      if (!isNaN(ano)) return ano * 12 + i;
    }
  }
  return null;
}

/**
 * Converte o número absoluto de volta para a string "Julho2026".
 */
function numeroParaMes(num) {
  const ano = Math.floor(num / 12);
  const mesIdx = num % 12;
  return `${MESES_PT[mesIdx]}${ano}`;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const ReceitasService = {
  /**
   * Lista receitas de um mês.
   * Antes de retornar, propaga automaticamente as receitas recorrentes
   * do mês anterior que ainda não existam no mês solicitado.
   * @param {string} mes
   */
  listarPorMes(mes) {
    if (!mes) throw new AppError('Parâmetro "mes" é obrigatório.', 400);

    // Propaga recorrentes do mês anterior antes de buscar
    this._propagarRecorrentes(mes);

    return ReceitasRepository.findByMes(mes);
  },

  /**
   * Propaga automaticamente receitas recorrentes do passado
   * para o mês solicitado, preenchendo todos os meses que o usuário possa ter pulado.
   * @param {string} mesDestino - Ex: "Julho2026"
   */
  _propagarRecorrentes(mesDestino) {
    const destinoNum = mesParaNumero(mesDestino);
    if (!destinoNum) return;

    // Busca TODAS as receitas recorrentes
    const todas = ReceitasRepository.findAllRecorrentes();

    // Encontra a ocorrência mais recente de cada receita recorrente (antes de mesDestino)
    const mapa = {};
    for (const r of todas) {
      const num = mesParaNumero(r.mes);
      if (!num || num >= destinoNum) continue; // Ignora se do futuro ou mesmo mês
      
      const chave = `${r.categoria}|${r.descricao}|${r.cartao}`;
      if (!mapa[chave] || num > mapa[chave].num) {
         mapa[chave] = { r, num };
      }
    }

    // Para cada receita do passado, cria as cópias em todos os meses entre ela e o mesDestino
    for (const chave in mapa) {
      const { r, num } = mapa[chave];
      
      for (let i = num + 1; i <= destinoNum; i++) {
        const mesAlvo = numeroParaMes(i);
        const existe = ReceitasRepository.existeIgual(mesAlvo, r.categoria, r.descricao, r.cartao);
        
        if (!existe) {
          ReceitasRepository.create({
            categoria:  r.categoria,
            descricao:  r.descricao,
            valor:      r.valor,
            situacao:   'Pendente', // Novas parcelas sempre nascem Pendentes
            cartao:     r.cartao || '—',
            mes:        mesAlvo,
            recorrente: 1,
          });
        }
      }
    }
  },

  /**
   * Cria uma nova receita.
   * @param {Object} dados
   */
  criar(dados) {
    const { id } = ReceitasRepository.create(dados);
    return ReceitasRepository.findById(id);
  },

  /**
   * Atualiza uma receita existente.
   * @param {number} id
   * @param {Object} dados
   */
  atualizar(id, dados) {
    const existe = ReceitasRepository.findById(id);
    if (!existe) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    ReceitasRepository.update(id, dados);
    return ReceitasRepository.findById(id);
  },

  /**
   * Atualiza apenas a situação de uma receita.
   * @param {number} id
   * @param {string} situacao
   */
  atualizarStatus(id, situacao) {
    const existe = ReceitasRepository.findById(id);
    if (!existe) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    ReceitasRepository.updateStatus(id, situacao);
    return ReceitasRepository.findById(id);
  },

  /**
   * Remove uma receita.
   * @param {number} id
   */
  remover(id) {
    const existe = ReceitasRepository.findById(id);
    if (!existe) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    ReceitasRepository.delete(id);
  },
};

module.exports = { ReceitasService };
