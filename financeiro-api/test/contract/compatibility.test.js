import test from 'node:test';
import assert from 'node:assert/strict';

const legacyOrigin = process.env.CONTRACT_LEGACY_ORIGIN?.replace(/\/$/, '');
const candidateOrigin = process.env.CONTRACT_CANDIDATE_ORIGIN?.replace(/\/$/, '');
const shouldRun = Boolean(legacyOrigin && candidateOrigin);

const readResponse = async (origin, scenario) => {
  const response = await fetch(`${origin}${scenario.path}`, {
    method: scenario.method,
    headers: scenario.headers,
    body: scenario.body,
  });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  return { status: response.status, contentType: contentType.split(';')[0], body };
};

const safeScenarios = [
  {
    name: 'dashboard sem token',
    method: 'GET',
    path: '/api/dashboard?mes=Junho2026',
    headers: {},
  },
  {
    name: 'configurações sem token',
    method: 'GET',
    path: '/api/configuracoes',
    headers: {},
  },
  ...(process.env.CONTRACT_INVALID_PASSWORD ? [{
    name: 'login com senha inválida',
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha: process.env.CONTRACT_INVALID_PASSWORD }),
  }] : []),
  ...(process.env.CONTRACT_BEARER_TOKEN ? [
    '/api/dashboard?mes=Junho2026',
    '/api/dashboard/historico',
    '/api/configuracoes',
    '/api/relatorios?mes=Junho2026',
    '/api/cartoes',
    '/api/metas',
    '/api/orcamentos?mes=Junho2026',
    '/api/investimentos',
    '/api/financiamentos',
  ].map((path) => ({
    name: `leitura autenticada ${path}`,
    method: 'GET',
    path,
    headers: { Authorization: `Bearer ${process.env.CONTRACT_BEARER_TOKEN}` },
  })) : []),
];

for (const scenario of safeScenarios) {
  test(`contrato: ${scenario.name}`, { skip: !shouldRun && 'Defina CONTRACT_LEGACY_ORIGIN e CONTRACT_CANDIDATE_ORIGIN.' }, async () => {
    const [legacy, candidate] = await Promise.all([
      readResponse(legacyOrigin, scenario),
      readResponse(candidateOrigin, scenario),
    ]);

    assert.deepEqual(candidate, legacy);
  });
}
