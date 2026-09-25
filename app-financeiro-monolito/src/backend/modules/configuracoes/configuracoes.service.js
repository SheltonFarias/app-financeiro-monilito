const { ConfiguracoesRepository } = require('./configuracoes.repository');
const { AppError } = require('../../utils/AppError');

const ConfiguracoesService = {
  /**
   * Retorna todas as configurações parseadas (JSON).
   */
  async getAllParsed() {
    const raw = await ConfiguracoesRepository.findAll();
    const result = {};
    for (const [key, value] of Object.entries(raw)) {
      try {
        result[key] = JSON.parse(value);
      } catch (e) {
        result[key] = value; // fallback se não for JSON
      }
    }
    return result;
  },

  /**
   * Atualiza uma chave de configuração. O valor deve ser um JSON válido se for uma lista.
   * @param {string} chave 
   * @param {any} valor 
   */
  async updateConfig(chave, valor) {
    if (!chave) throw new AppError('A chave é obrigatória.', 400);
    
    // Transforma arrays em strings JSON
    const stringValue = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
    
    await ConfiguracoesRepository.upsert(chave, stringValue);
    
    return { chave, valor };
  }
};

module.exports = { ConfiguracoesService };
