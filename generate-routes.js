const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, 'src/app/api');

// Cria pasta se não existir
function mkdir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeRoute(routePath, content) {
  const dir = path.join(API_DIR, routePath);
  mkdir(dir);
  fs.writeFileSync(path.join(dir, 'route.js'), content);
}

// === AUTH ===
writeRoute('auth/login', `
import { NextResponse } from 'next/server';
import { AuthService } from '@/backend/modules/auth/auth.service';

export async function POST(req) {
  try {
    const body = await req.json();
    const data = AuthService.login(body.senha);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
}
`);

// === DASHBOARD ===
writeRoute('dashboard', `
import { NextResponse } from 'next/server';
import { DashboardService } from '@/backend/modules/dashboard/dashboard.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const data = DashboardService.carregarDados(mes);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
`);

writeRoute('dashboard/historico', `
import { NextResponse } from 'next/server';
import { DashboardService } from '@/backend/modules/dashboard/dashboard.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (req) => {
  try {
    const data = DashboardService.carregarHistorico();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
`);

// === CRUD MODULES ===
const modules = [
  { path: 'gastos-fixos', service: 'GastosFixosService', file: 'gastosFixos' },
  { path: 'gastos-variaveis', service: 'GastosVariaveisService', file: 'gastosVariaveis' },
  { path: 'receitas', service: 'ReceitasService', file: 'receitas' },
  { path: 'investimentos', service: 'InvestimentosService', file: 'investimentos' },
  { path: 'orcamentos', service: 'OrcamentosService', file: 'orcamentos' },
  { path: 'metas', service: 'MetasService', file: 'metas' },
  { path: 'cartoes', service: 'CartoesService', file: 'cartoes' },
];

modules.forEach(m => {
  // GET e POST na raiz
  writeRoute(m.path, `
import { NextResponse } from 'next/server';
import { ${m.service} } from '@/backend/modules/${m.path}/${m.file}.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const data = ${m.service}.listar(mes);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const data = ${m.service}.criar(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
`);

  // PUT e DELETE com [id]
  writeRoute(`${m.path}/[id]`, `
import { NextResponse } from 'next/server';
import { ${m.service} } from '@/backend/modules/${m.path}/${m.file}.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PUT = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const data = ${m.service}.atualizar(id, body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    ${m.service}.deletar(id);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
`);

  // PATCH status com [id]/status (exceto onde não tem situacao)
  if (!['investimentos', 'orcamentos', 'metas', 'cartoes'].includes(m.path)) {
    writeRoute(`${m.path}/[id]/status`, `
import { NextResponse } from 'next/server';
import { ${m.service} } from '@/backend/modules/${m.path}/${m.file}.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PATCH = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const data = ${m.service}.atualizarStatus(id, body.situacao);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
`);
  }
});

console.log("Rotas Next.js geradas com sucesso!");
