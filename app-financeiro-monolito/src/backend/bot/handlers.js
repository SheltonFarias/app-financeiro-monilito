import { DashboardService } from '../modules/dashboard/dashboard.service';
import { GastosFixosService } from '../modules/gastos-fixos/gastosFixos.service';
import { GastosVariaveisService } from '../modules/gastos-variaveis/gastosVariaveis.service';
import { ReceitasService } from '../modules/receitas/receitas.service';
import { gastoFixoSchema } from '../modules/gastos-fixos/gastosFixos.schema';
import { gastoVariavelSchema } from '../modules/gastos-variaveis/gastosVariaveis.schema';
import { receitaSchema } from '../modules/receitas/receitas.schema';

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

let handlersConfigurados = false;

function getMesAtual() {
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(new Date());
  const mes = Number(partes.find((parte) => parte.type === 'month')?.value);
  const ano = partes.find((parte) => parte.type === 'year')?.value;
  return `${MESES_PT[mes - 1]}${ano}`;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function parseValorBrasileiro(texto) {
  const valorInformado = texto.trim();
  let valorNormalizado;

  // Aceita 50,90 e 1.250,00 (formato brasileiro), além de 50.90.
  if (valorInformado.includes(',')) {
    const formatoBrasileiro = /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/;
    if (!formatoBrasileiro.test(valorInformado)) return null;
    valorNormalizado = valorInformado.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(valorInformado)) {
    valorNormalizado = valorInformado.replace(/\./g, '');
  } else if (/^\d+(?:\.\d{1,2})?$/.test(valorInformado)) {
    valorNormalizado = valorInformado;
  } else {
    return null;
  }

  const valor = Number(valorNormalizado);
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

function extrairLancamento(ctx, comando) {
  const texto = ctx.payload || ctx.message?.text?.replace(new RegExp(`^/${comando}(?:@\\w+)?`), '').trim();
  const match = texto?.match(/^(\S+)\s+(.+)$/);
  if (!match) return null;

  const valor = parseValorBrasileiro(match[1]);
  const descricao = match[2].trim();
  return valor && descricao ? { valor, descricao } : null;
}

function extrairCampos(ctx, quantidadeMinima) {
  const campos = (ctx.payload || '').split('|').map((campo) => campo.trim());
  return campos.length >= quantidadeMinima && campos.every(Boolean) ? campos : null;
}

function normalizar(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function opcaoValida(texto, opcoes) {
  return opcoes.find((opcao) => normalizar(opcao) === normalizar(texto));
}

function resumoItem(item) {
  return `[${item.id}] ${item.descricao} — ${formatarMoeda(item.valor)} (${item.situacao})`;
}

function escaparHtml(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function responderCartao(ctx, titulo, linhas) {
  const conteudo = linhas
    .map(([rotulo, valor]) => `${rotulo} <b>${escaparHtml(valor)}</b>`)
    .join('\n');
  await ctx.reply(`💰 <b>${titulo}</b>\n━━━━━━━━━━━━━━━━\n${conteudo}`, { parse_mode: 'HTML' });
}

const TIPOS_LISTA = {
  fixo: { chave: 'f', titulo: 'Gastos fixos', icone: '🏠' },
  gasto: { chave: 'g', titulo: 'Gastos variáveis', icone: '🛒' },
  receita: { chave: 'r', titulo: 'Receitas', icone: '💰' },
};

async function resolverReferenciaDoLancamento(tipo, referencia) {
  if (!/^\d+$/.test(String(referencia))) return referencia;
  const indice = Number(referencia) - 1;
  if (indice < 0) return referencia;

  const mes = getMesAtual();
  let itens;
  if (tipo === 'fixo' || tipo === 'fixos') itens = await GastosFixosService.listarPorMes(mes);
  else if (tipo === 'receita' || tipo === 'receitas') itens = await ReceitasService.listarPorMes(mes);
  else itens = await GastosVariaveisService.listarPorMes(mes);
  return itens[indice]?.id ?? referencia;
}

async function responderErro(ctx, contexto, erro) {
  console.error(`[Telegram Bot] ${contexto}:`, erro.message);
  await ctx.reply(`❌ Não foi possível concluir a operação. ${erro.message || 'Tente novamente.'}`);
}

function chatAutorizado(ctx) {
  const chatIdPermitido = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  return Boolean(chatIdPermitido) && String(ctx.chat?.id) === chatIdPermitido;
}

async function exigirChatAutorizado(ctx) {
  if (chatAutorizado(ctx)) return true;
  await ctx.reply('Este chat ainda não está autorizado. Envie /start para ver o ID necessário para configuração.');
  return false;
}

export function setupBot(bot) {
  if (handlersConfigurados) return;
  handlersConfigurados = true;

  bot.start(async (ctx) => {
    const textoBase =
      '👋 <b>Olá! Sou o seu bot financeiro.</b>\n' +
      '━━━━━━━━━━━━━━━━\n\n' +
      '<b>⚡ Ações rápidas</b>\n' +
      '📊 <code>/resumo</code> — visão do mês\n' +
      '🟡 <code>/pendentes</code> — contas a pagar\n' +
      '➖ <code>/gasto valor descrição</code> — registrar despesa\n' +
      '➕ <code>/receita valor descrição</code> — registrar receita\n' +
      '🏠 <code>/fixo categoria | valor | descrição</code>\n\n' +
      '<b>📋 Organização</b>\n' +
      '🔎 <code>/listar gastos</code>, <code>/listar fixos</code> ou <code>/listar receitas</code>\n' +
      '⚙️ <code>/editar</code>, <code>/status</code>, <code>/excluir</code>\n\n' +
      '💡 Use <code>/ajuda</code> para ver exemplos completos.';

    if (!chatAutorizado(ctx)) {
      await ctx.reply(`${textoBase}\n\n🔐 <b>Chat ainda não autorizado</b>\nID deste chat: <code>${ctx.chat.id}</code>`, { parse_mode: 'HTML' });
      return;
    }
    await ctx.reply(textoBase, { parse_mode: 'HTML' });
  });

  bot.command('ajuda', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    await ctx.reply(
      '🧭 <b>Guia rápido</b>\n━━━━━━━━━━━━━━━━\n\n' +
      '<b>➖ Despesas</b>\n' +
      '<code>/gasto 50,90 Supermercado</code>\n' +
      '<code>/gasto Alimentação | Pix | 50,90 | Mercado</code>\n' +
      '<code>/fixo Casa | 1200,00 | Aluguel</code>\n\n' +
      '<b>➕ Receitas</b>\n' +
      '<code>/receita 2500 Salário</code>\n\n' +
      '<b>📋 Consultar e gerenciar</b>\n' +
      '<code>/listar gastos</code>\n' +
      '<code>/pendentes</code> — todas as contas em aberto\n' +
      '<code>/pago 1</code> — confirma o gasto nº 1\n' +
      '<code>/recebido 1</code> — confirma a receita nº 1\n' +
      '<code>/editar gasto | id | Alimentação | 65,00 | Mercado | Pix</code>\n' +
      '<code>/status gasto | id | Pago</code>\n' +
      '<code>/excluir receita | id</code>\n' +
      '<code>/excluirserie fixo | id</code>',
      { parse_mode: 'HTML' }
    );
  });

  bot.command('resumo', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    try {
      const mesAtual = getMesAtual();
      const data = await DashboardService.carregarDados(mesAtual);
      const totalReceitas = data.receitas.reduce((acc, curr) => acc + curr.valor, 0);
      const totalFixos = data.gastosFixos.reduce((acc, curr) => acc + curr.valor, 0);
      const totalVariaveis = data.gastosVariaveis.reduce((acc, curr) => acc + curr.valor, 0);
      const saldo = totalReceitas - totalFixos - totalVariaveis;

      await ctx.reply(
        `📊 *Resumo de ${mesAtual}*\n\n` +
        `🟢 Receitas: ${formatarMoeda(totalReceitas)}\n` +
        `🔴 Gastos Fixos: ${formatarMoeda(totalFixos)}\n` +
        `🟡 Gastos Variáveis: ${formatarMoeda(totalVariaveis)}\n\n` +
        `💰 *Saldo Atual:* ${formatarMoeda(saldo)}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('[Telegram Bot] Erro ao buscar resumo:', err.message);
      await ctx.reply('❌ Não foi possível buscar o resumo agora. Tente novamente em instantes.');
    }
  });

  bot.command('pendentes', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    try {
      const mes = getMesAtual();
      const [fixos, variaveis] = await Promise.all([
        GastosFixosService.listarPorMes(mes),
        GastosVariaveisService.listarPorMes(mes),
      ]);
      const itens = [
        ...fixos.filter((item) => item.situacao === 'Pendente').map((item) => ({ ...item, tipo: '🏠 Fixo' })),
        ...variaveis.filter((item) => item.situacao === 'Pendente').map((item) => ({ ...item, tipo: '🛒 Variável' })),
      ].sort((a, b) => Number(b.valor) - Number(a.valor));

      if (!itens.length) {
        await ctx.reply(`✅ <b>Nenhuma conta pendente</b>\n━━━━━━━━━━━━━━━━\nTodos os gastos de <b>${mes}</b> estão marcados como pagos.`, { parse_mode: 'HTML' });
        return;
      }

      const total = itens.reduce((soma, item) => soma + Number(item.valor || 0), 0);
      const linhas = itens.slice(0, 30).map((item, indice) =>
        `<b>${indice + 1}. ${escaparHtml(item.descricao)}</b>\n` +
        `🟡 ${item.tipo}  •  <b>${formatarMoeda(item.valor)}</b>  •  ${escaparHtml(item.categoria)}`
      );
      await ctx.reply(
        `🟡 <b>Contas pendentes</b>\n` +
        `📅 ${mes}  •  ${itens.length} conta(s)\n` +
        `━━━━━━━━━━━━━━━━\n\n${linhas.join('\n\n')}\n\n` +
        `━━━━━━━━━━━━━━━━\n💸 <b>Total a pagar: ${formatarMoeda(total)}</b>${itens.length > 30 ? '\n\n<i>Mostrando as primeiras 30 contas.</i>' : ''}`,
        { parse_mode: 'HTML' }
      );
    } catch (erro) {
      await responderErro(ctx, 'Erro ao listar contas pendentes', erro);
    }
  });

  bot.command('gasto', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;

    if ((ctx.payload || '').includes('|')) {
      const campos = extrairCampos(ctx, 4);
      if (!campos) {
        await ctx.reply('Use: /gasto categoria | pagamento | valor | descrição');
        return;
      }
      const [categoriaInformada, pagamentoInformado, valorInformado, ...descricaoCampos] = campos;
      const categoria = opcaoValida(categoriaInformada, ['Casa', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Vestuário', 'Outros', 'Mãe']);
      const pagamento = opcaoValida(pagamentoInformado, ['Cartão Inter', 'Cartão Nubank', 'Débito', 'Pix']);
      const valor = parseValorBrasileiro(valorInformado);
      if (!categoria || !pagamento || !valor) {
        await ctx.reply('Categoria, pagamento ou valor inválido. Exemplo: /gasto Alimentação | Pix | 50,90 | Mercado');
        return;
      }
      try {
        const dados = gastoVariavelSchema.parse({
          categoria, pagamento, valor, descricao: descricaoCampos.join(' | '), mes: getMesAtual(),
          situacao: 'Pago', qtd_parcelas: 1,
        });
        await GastosVariaveisService.criar(dados);
        await responderCartao(ctx, 'Gasto registrado', [
          ['📝 Descrição:', dados.descricao], ['💵 Valor:', formatarMoeda(dados.valor)],
          ['🏷️ Categoria:', dados.categoria], ['💳 Pagamento:', dados.pagamento], ['📅 Mês:', dados.mes],
        ]);
      } catch (err) {
        await responderErro(ctx, 'Erro ao salvar gasto', err);
      }
      return;
    }

    const lancamento = extrairLancamento(ctx, 'gasto');
    if (!lancamento) {
      await ctx.reply('Formato incorreto. Use: /gasto <valor> <descrição>\nExemplo: /gasto 50,50 Supermercado');
      return;
    }

    try {
      const dados = gastoVariavelSchema.parse({
        categoria: 'Outros',
        descricao: lancamento.descricao,
        valor: lancamento.valor,
        mes: getMesAtual(),
        pagamento: 'Pix',
        situacao: 'Pago',
        qtd_parcelas: 1,
      });
      await GastosVariaveisService.criar(dados);
      await responderCartao(ctx, 'Gasto registrado', [
        ['📝 Descrição:', lancamento.descricao], ['💵 Valor:', formatarMoeda(lancamento.valor)],
        ['🏷️ Categoria:', dados.categoria], ['💳 Pagamento:', dados.pagamento], ['📅 Mês:', dados.mes],
      ]);
    } catch (err) {
      console.error('[Telegram Bot] Erro ao salvar gasto:', err.message);
      await ctx.reply('❌ Não foi possível salvar o gasto. Verifique os dados e tente novamente.');
    }
  });

  bot.command('receita', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const lancamento = extrairLancamento(ctx, 'receita');
    if (!lancamento) {
      await ctx.reply('Formato incorreto. Use: /receita <valor> <descrição>\nExemplo: /receita 2000 Salário');
      return;
    }

    try {
      const dados = receitaSchema.parse({
        categoria: 'Outros',
        descricao: lancamento.descricao,
        valor: lancamento.valor,
        mes: getMesAtual(),
        situacao: 'Recebido',
        recorrente: 0,
        mensal: 0,
        data_inicio: null,
        data_fim: null,
      });
      await ReceitasService.criar(dados);
      await responderCartao(ctx, 'Receita registrada', [
        ['📝 Descrição:', lancamento.descricao], ['💵 Valor:', formatarMoeda(lancamento.valor)],
        ['🏷️ Categoria:', dados.categoria], ['📅 Mês:', dados.mes],
      ]);
    } catch (err) {
      console.error('[Telegram Bot] Erro ao salvar receita:', err.message);
      await ctx.reply('❌ Não foi possível salvar a receita. Verifique os dados e tente novamente.');
    }
  });

  bot.command('fixo', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const campos = extrairCampos(ctx, 3);
    if (!campos) {
      await ctx.reply('Use: /fixo categoria | valor | descrição\nExemplo: /fixo Casa | 1200,00 | Aluguel');
      return;
    }
    const [categoriaInformada, valorInformado, ...descricaoCampos] = campos;
    const categoria = opcaoValida(categoriaInformada, ['Educação', 'Veiculo', 'Casa', 'Apartamento', 'Lazer', 'Outros', 'Saúde', 'Mãe']);
    const valor = parseValorBrasileiro(valorInformado);
    if (!categoria || !valor) {
      await ctx.reply('Categoria ou valor inválido. Categorias: Educação, Veiculo, Casa, Apartamento, Lazer, Outros, Saúde, Mãe.');
      return;
    }
    try {
      const dados = gastoFixoSchema.parse({
        categoria, valor, descricao: descricaoCampos.join(' | '), mes: getMesAtual(),
        vencimento: '', cartao: '—', situacao: 'Pendente', mensal: 0, data_inicio: null, data_fim: null,
      });
      const criado = await GastosFixosService.criar(dados);
      await responderCartao(ctx, 'Gasto fixo registrado', [
        ['📝 Descrição:', criado.descricao], ['💵 Valor:', formatarMoeda(criado.valor)],
        ['🏷️ Categoria:', criado.categoria], ['📅 Mês:', criado.mes], ['🆔 ID:', criado.id],
      ]);
    } catch (erro) {
      await responderErro(ctx, 'Erro ao criar gasto fixo', erro);
    }
  });

  bot.command('variavel', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const campos = extrairCampos(ctx, 4);
    if (!campos) {
      await ctx.reply('Use: /variavel categoria | pagamento | valor | descrição\nExemplo: /variavel Alimentação | Pix | 50,90 | Mercado');
      return;
    }
    const [categoriaInformada, pagamentoInformado, valorInformado, ...descricaoCampos] = campos;
    const categoria = opcaoValida(categoriaInformada, ['Casa', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Vestuário', 'Outros', 'Mãe']);
    const pagamento = opcaoValida(pagamentoInformado, ['Cartão Inter', 'Cartão Nubank', 'Débito', 'Pix']);
    const valor = parseValorBrasileiro(valorInformado);
    if (!categoria || !pagamento || !valor) {
      await ctx.reply('Categoria, pagamento ou valor inválido. Pagamentos: Cartão Inter, Cartão Nubank, Débito ou Pix.');
      return;
    }
    try {
      const dados = gastoVariavelSchema.parse({
        categoria, pagamento, valor, descricao: descricaoCampos.join(' | '), mes: getMesAtual(),
        situacao: 'Pago', qtd_parcelas: 1,
      });
      const criado = await GastosVariaveisService.criar(dados);
      await ctx.reply(`✅ Gasto variável adicionado!\nID: ${criado.id}\n${resumoItem(criado)}`);
    } catch (erro) {
      await responderErro(ctx, 'Erro ao criar gasto variável', erro);
    }
  });

  bot.command('listar', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const tipo = normalizar(ctx.payload || '');
    const mes = getMesAtual();
    try {
      let tipoLista;
      let itens;
      if (tipo === 'fixos' || tipo === 'fixo') {
        tipoLista = TIPOS_LISTA.fixo;
        itens = await GastosFixosService.listarPorMes(mes);
      } else if (tipo === 'variaveis' || tipo === 'variavel' || tipo === 'gastos') {
        tipoLista = TIPOS_LISTA.gasto;
        itens = await GastosVariaveisService.listarPorMes(mes);
      } else if (tipo === 'receitas' || tipo === 'receita') {
        tipoLista = TIPOS_LISTA.receita;
        itens = await ReceitasService.listarPorMes(mes);
      } else {
        await ctx.reply('Use: /listar fixos, /listar variaveis ou /listar receitas');
        return;
      }
      if (!itens.length) {
        await ctx.reply(`${tipoLista.icone} <b>${tipoLista.titulo}</b>\n━━━━━━━━━━━━━━━━\n\nNenhum lançamento em <b>${mes}</b>.`, { parse_mode: 'HTML' });
        return;
      }
      const exibidos = itens.slice(0, 20);
      const total = exibidos.reduce((soma, item) => soma + Number(item.valor || 0), 0);
      const comandoTipo = tipoLista.chave === 'f' ? 'fixo' : tipoLista.chave === 'r' ? 'receita' : 'gasto';
      const situacaoConcluida = tipoLista.chave === 'r' ? 'Recebido' : 'Pago';
      const comandoRapidoStatus = tipoLista.chave === 'r' ? '/recebido 1' : tipoLista.chave === 'g' ? '/pago 1' : `/status ${comandoTipo} | 1 | ${situacaoConcluida}`;
      const linhas = exibidos.map((item, indice) => {
        const situacao = item.situacao === 'Pago' || item.situacao === 'Recebido' ? '🟢' : '🟡';
        return `<b>${indice + 1}. ${escaparHtml(item.descricao)}</b>\n${situacao} ${escaparHtml(item.situacao)}  •  <b>${formatarMoeda(item.valor)}</b>${item.categoria ? `  •  ${escaparHtml(item.categoria)}` : ''}`;
      });
      await ctx.reply(
        `${tipoLista.icone} <b>${tipoLista.titulo}</b>\n` +
        `📅 ${mes}  •  ${exibidos.length} lançamento(s)\n` +
        `━━━━━━━━━━━━━━━━\n\n${linhas.join('\n\n')}\n\n` +
        `━━━━━━━━━━━━━━━━\n💵 <b>Total: ${formatarMoeda(total)}</b>\n\n` +
        `<i>Para gerenciar um item, use o número exibido:</i>\n` +
        `<code>${comandoRapidoStatus}</code>\n` +
        `<code>/editar ${comandoTipo} | 1 | ...</code>\n` +
        `<code>/excluir ${comandoTipo} | 1</code>${itens.length > 20 ? '\n\n<i>Mostrando os primeiros 20 lançamentos.</i>' : ''}`,
        { parse_mode: 'HTML' }
      );
    } catch (erro) {
      await responderErro(ctx, 'Erro ao listar registros', erro);
    }
  });

  bot.command('status', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const campos = extrairCampos(ctx, 3);
    if (!campos) {
      await ctx.reply('Use: /status tipo | id | situação\nExemplo: /status variavel | <id> | pago');
      return;
    }
    const [tipoInformado, id, situacaoInformada] = campos;
    const tipo = normalizar(tipoInformado);
    const idResolvido = await resolverReferenciaDoLancamento(tipo, id);
    const situacaoGasto = opcaoValida(situacaoInformada, ['Pendente', 'Pago']);
    const situacaoReceita = opcaoValida(situacaoInformada, ['Pendente', 'Recebido']);
    try {
      if ((tipo === 'fixo' || tipo === 'fixos') && situacaoGasto) {
        await GastosFixosService.atualizarStatus(idResolvido, situacaoGasto);
      } else if ((tipo === 'variavel' || tipo === 'variaveis' || tipo === 'gasto' || tipo === 'gastos') && situacaoGasto) {
        await GastosVariaveisService.atualizarStatus(idResolvido, situacaoGasto);
      } else if ((tipo === 'receita' || tipo === 'receitas') && situacaoReceita) {
        await ReceitasService.atualizarStatus(idResolvido, situacaoReceita);
      } else {
        await ctx.reply('Situação inválida. Gastos: Pendente/Pago. Receitas: Pendente/Recebido.');
        return;
      }
      await ctx.reply('✅ Situação atualizada com sucesso!');
    } catch (erro) {
      await responderErro(ctx, 'Erro ao atualizar situação', erro);
    }
  });

  bot.command('recebido', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const numero = (ctx.payload || '').trim();
    if (!/^\d+$/.test(numero)) {
      await ctx.reply('Use: /recebido número\nExemplo: /recebido 1\n\nO número é o exibido em /listar receitas.');
      return;
    }
    try {
      const id = await resolverReferenciaDoLancamento('receita', numero);
      const receitas = await ReceitasService.listarPorMes(getMesAtual());
      const receita = receitas.find((item) => item.id === id);
      if (!receita) throw new Error('Receita não encontrada no mês atual.');
      await ReceitasService.atualizarStatus(id, 'Recebido');
      await responderCartao(ctx, 'Receita confirmada', [
        ['📝 Descrição:', receita.descricao], ['💵 Valor:', formatarMoeda(receita.valor)], ['✅ Situação:', 'Recebido'],
      ]);
    } catch (erro) {
      await responderErro(ctx, 'Erro ao confirmar receita', erro);
    }
  });

  bot.command('pago', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const numero = (ctx.payload || '').trim();
    if (!/^\d+$/.test(numero)) {
      await ctx.reply('Use: /pago número\nExemplo: /pago 1\n\nO número é o exibido em /listar gastos.');
      return;
    }
    try {
      const id = await resolverReferenciaDoLancamento('gasto', numero);
      const gastos = await GastosVariaveisService.listarPorMes(getMesAtual());
      const gasto = gastos.find((item) => item.id === id);
      if (!gasto) throw new Error('Gasto não encontrado no mês atual.');
      await GastosVariaveisService.atualizarStatus(id, 'Pago');
      await responderCartao(ctx, 'Gasto confirmado', [
        ['📝 Descrição:', gasto.descricao], ['💵 Valor:', formatarMoeda(gasto.valor)], ['✅ Situação:', 'Pago'],
      ]);
    } catch (erro) {
      await responderErro(ctx, 'Erro ao confirmar gasto', erro);
    }
  });

  bot.command('excluir', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const campos = extrairCampos(ctx, 2);
    if (!campos) {
      await ctx.reply('Use: /excluir tipo | id\nExemplo: /excluir variavel | <id>');
      return;
    }
    const [tipoInformado, id] = campos;
    const tipo = normalizar(tipoInformado);
    const idResolvido = await resolverReferenciaDoLancamento(tipo, id);
    try {
      if (tipo === 'fixo' || tipo === 'fixos') await GastosFixosService.remover(idResolvido);
      else if (tipo === 'variavel' || tipo === 'variaveis' || tipo === 'gasto' || tipo === 'gastos') await GastosVariaveisService.remover(idResolvido);
      else if (tipo === 'receita' || tipo === 'receitas') await ReceitasService.remover(idResolvido);
      else {
        await ctx.reply('Tipo inválido. Use fixo, variavel ou receita.');
        return;
      }
      await ctx.reply('✅ Registro excluído com sucesso.');
    } catch (erro) {
      await responderErro(ctx, 'Erro ao excluir registro', erro);
    }
  });

  bot.command('excluirserie', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const campos = extrairCampos(ctx, 2);
    if (!campos) {
      await ctx.reply('Use: /excluirserie tipo | id\nIsso remove o template e os lançamentos vinculados.');
      return;
    }
    const [tipoInformado, id] = campos;
    const tipo = normalizar(tipoInformado);
    const idResolvido = await resolverReferenciaDoLancamento(tipo, id);
    try {
      if (tipo === 'fixo' || tipo === 'fixos') await GastosFixosService.removerSerie(idResolvido);
      else if (tipo === 'variavel' || tipo === 'variaveis' || tipo === 'gasto' || tipo === 'gastos') await GastosVariaveisService.removerSerie(idResolvido);
      else if (tipo === 'receita' || tipo === 'receitas') await ReceitasService.removerSerie(idResolvido);
      else {
        await ctx.reply('Tipo inválido. Use fixo, variavel ou receita.');
        return;
      }
      await ctx.reply('✅ Série excluída com sucesso.');
    } catch (erro) {
      await responderErro(ctx, 'Erro ao excluir série', erro);
    }
  });

  bot.command('editar', async (ctx) => {
    if (!await exigirChatAutorizado(ctx)) return;
    const campos = extrairCampos(ctx, 5);
    if (!campos) {
      await ctx.reply('Use: /editar tipo | id | categoria | valor | descrição | pagamento(opcional para variável)\nExemplo: /editar variavel | <id> | Alimentação | 65,00 | Mercado | Pix');
      return;
    }
    const [tipoInformado, id, categoriaInformada, valorInformado, descricaoInformada, pagamentoInformado] = campos;
    const tipo = normalizar(tipoInformado);
    const idResolvido = await resolverReferenciaDoLancamento(tipo, id);
    const valor = parseValorBrasileiro(valorInformado);
    if (!valor) {
      await ctx.reply('Valor inválido. Use, por exemplo, 50,90 ou 1.250,00.');
      return;
    }
    try {
      if (tipo === 'fixo' || tipo === 'fixos') {
        const categoria = opcaoValida(categoriaInformada, ['Educação', 'Veiculo', 'Casa', 'Apartamento', 'Lazer', 'Outros', 'Saúde', 'Mãe']);
        if (!categoria) throw new Error('Categoria de gasto fixo inválida.');
        const existente = await GastosFixosService.listarPorMes(getMesAtual()).then((itens) => itens.find((item) => item.id === idResolvido));
        if (!existente) throw new Error('Gasto fixo não encontrado no mês atual.');
        const dados = gastoFixoSchema.parse({
          ...existente, categoria, valor, descricao: descricaoInformada,
          mensal: Number(existente.mensal), template_id: existente.template_id ?? null,
        });
        await GastosFixosService.atualizar(idResolvido, dados);
      } else if (tipo === 'variavel' || tipo === 'variaveis' || tipo === 'gasto' || tipo === 'gastos') {
        const categoria = opcaoValida(categoriaInformada, ['Casa', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Vestuário', 'Outros', 'Mãe']);
        const pagamento = opcaoValida(pagamentoInformado || '', ['Cartão Inter', 'Cartão Nubank', 'Débito', 'Pix']);
        if (!categoria || !pagamento) throw new Error('Informe categoria e pagamento válidos para o gasto variável.');
        const existente = await GastosVariaveisService.listarPorMes(getMesAtual()).then((itens) => itens.find((item) => item.id === idResolvido));
        if (!existente) throw new Error('Gasto variável não encontrado no mês atual.');
        const dados = gastoVariavelSchema.parse({
          ...existente, categoria, pagamento, valor, descricao: descricaoInformada,
          dataCompra: existente.data_compra ?? null, qtd_parcelas: 1,
        });
        await GastosVariaveisService.atualizar(idResolvido, dados);
      } else if (tipo === 'receita' || tipo === 'receitas') {
        const categoria = opcaoValida(categoriaInformada, ['Trabalho', 'Apartamento', 'Outros', 'Mãe']);
        if (!categoria) throw new Error('Categoria de receita inválida.');
        const existente = await ReceitasService.listarPorMes(getMesAtual()).then((itens) => itens.find((item) => item.id === idResolvido));
        if (!existente) throw new Error('Receita não encontrada no mês atual.');
        const dados = receitaSchema.parse({
          ...existente, categoria, valor, descricao: descricaoInformada,
          recorrente: Number(existente.recorrente), mensal: Number(existente.mensal),
        });
        await ReceitasService.atualizar(idResolvido, dados);
      } else {
        await ctx.reply('Tipo inválido. Use fixo, variavel ou receita.');
        return;
      }
      await ctx.reply('✅ Registro atualizado com sucesso.');
    } catch (erro) {
      await responderErro(ctx, 'Erro ao editar registro', erro);
    }
  });

}
