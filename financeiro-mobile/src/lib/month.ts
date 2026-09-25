const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export function mesDaApi(date = new Date()) { return `${MESES[date.getMonth()]}${date.getFullYear()}`; }
export function labelMes(date = new Date()) { return `${MESES[date.getMonth()]} de ${date.getFullYear()}`; }
