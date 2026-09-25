import { DashboardService } from '../modules/dashboard/dashboard.service';
import { GastosVariaveisService } from '../modules/gastos-variaveis/gastosVariaveis.service';
import { ReceitasService } from '../modules/receitas/receitas.service';

const MES_ATUAL = 'Agosto2026'; // Pode ser dinâmico no futuro

export function setupBot(bot) {
  bot.start((ctx) => {
    ctx.reply(
      'Olá! Sou o seu bot financeiro. 🚀\n\n' +
      'Comandos disponíveis:\n' +
      '/resumo - Ver resumo do mês atual\n' +
      '/gasto <valor> <descricao> - Adicionar gasto variável\n' +
      '/receita <valor> <descricao> - Adicionar receita'
    );
  });

  bot.command('resumo', (ctx) => {
    try {
      const data = DashboardService.carregarDados(MES_ATUAL);
      const totalReceitas = data.receitas.reduce((acc, curr) => acc + curr.valor, 0);
      const totalFixos = data.gastosFixos.reduce((acc, curr) => acc + curr.valor, 0);
      const totalVariaveis = data.gastosVariaveis.reduce((acc, curr) => acc + curr.valor, 0);
      const saldo = totalReceitas - totalFixos - totalVariaveis;

      const format = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;

      ctx.reply(
        `📊 *Resumo de ${MES_ATUAL}*\n\n` +
        `🟢 Receitas: ${format(totalReceitas)}\n` +
        `🔴 Gastos Fixos: ${format(totalFixos)}\n` +
        `🟠 Gastos Variáveis: ${format(totalVariaveis)}\n\n` +
        `💰 *Saldo Atual:* ${format(saldo)}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      ctx.reply('❌ Erro ao buscar o resumo: ' + err.message);
    }
  });

  bot.command('gasto', (ctx) => {
    const text = ctx.message.text.replace('/gasto', '').trim();
    if (!text) {
      return ctx.reply('Formato incorreto. Use: /gasto <valor> <descricao>\nExemplo: /gasto 50.50 Supermercado');
    }

    const match = text.match(/^([\d.,]+)\s+(.+)$/);
    if (!match) {
      return ctx.reply('Formato incorreto. Use: /gasto <valor> <descricao>');
    }

    let valorStr = match[1].replace(',', '.');
    const valor = parseFloat(valorStr);
    const descricao = match[2].trim();

    if (isNaN(valor)) return ctx.reply('❌ Valor inválido.');

    try {
      GastosVariaveisService.criar({
        categoria: 'Outros',
        descricao,
        valor,
        mes: MES_ATUAL,
        situacao: 'Pago',
        qtd_parcelas: 1
      });
      ctx.reply(`✅ Gasto de R$ ${valor.toFixed(2)} (${descricao}) adicionado com sucesso!`);
    } catch (err) {
      ctx.reply('❌ Erro ao salvar gasto: ' + err.message);
    }
  });

  bot.command('receita', (ctx) => {
    const text = ctx.message.text.replace('/receita', '').trim();
    if (!text) {
      return ctx.reply('Formato incorreto. Use: /receita <valor> <descricao>\nExemplo: /receita 2000 Salário');
    }

    const match = text.match(/^([\d.,]+)\s+(.+)$/);
    if (!match) {
      return ctx.reply('Formato incorreto. Use: /receita <valor> <descricao>');
    }

    let valorStr = match[1].replace(',', '.');
    const valor = parseFloat(valorStr);
    const descricao = match[2].trim();

    if (isNaN(valor)) return ctx.reply('❌ Valor inválido.');

    try {
      ReceitasService.criar({
        categoria: 'Outros',
        descricao,
        valor,
        mes: MES_ATUAL,
        situacao: 'Recebido',
        recorrente: 0,
        mensal: 0,
        data_inicio: null,
        data_fim: null
      });
      ctx.reply(`✅ Receita de R$ ${valor.toFixed(2)} (${descricao}) adicionada com sucesso!`);
    } catch (err) {
      ctx.reply('❌ Erro ao salvar receita: ' + err.message);
    }
  });
}
