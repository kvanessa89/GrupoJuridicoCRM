import { expect, test, type APIRequestContext } from '@playwright/test';
import cases from '../casos-de-prueba.json';
import { credentials, loginApi, type Role } from '../utils/fixtures';

const securityCases = cases.filter((item) => item.Tipo.toLowerCase().includes('seguridad'));
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const roleFor = (id: string): Role => ['CP-18b','CP-30','CP-37','CP-48'].includes(id) ? 'ADVISOR' : ['CP-18c','CP-27b','CP-30b','CP-37b','CP-41b','CP-48b','CP-67b'].includes(id) ? 'SUPERVISOR' : ['CP-41','CP-67'].includes(id) ? 'EDITOR' : 'ADMIN';
async function clientData(request: APIRequestContext, token: string) {
  const [stages, sources, users] = await Promise.all([
    request.get('/api/stages', { headers: auth(token) }), request.get('/api/sources', { headers: auth(token) }), request.get('/api/users', { headers: auth(token) }),
  ]);
  expect(stages.ok() && sources.ok() && users.ok()).toBeTruthy();
  return { stages: await stages.json(), sources: await sources.json(), users: await users.json() };
}

for (const item of securityCases) {
  test(`${item.ID} | ${item.Escenario}`, async ({ request }) => {
    test.info().annotations.push({ type: 'prioridad', description: item.Prioridad });
    if (item.ID === 'CP-60') { expect((await request.get('/api/clients')).status()).toBe(401); return; }
    if (item.ID === 'CP-61') { expect((await request.get('/api/clients', { headers: auth('jwt.manipulado.invalido') })).status()).toBe(401); return; }
    if (item.ID === 'CP-62') {
      for (const [method, path] of [['post','/api/clients'], ['put','/api/clients/1'], ['delete','/api/clients/1']] as const)
        expect((await request[method](path)).status()).toBe(401);
      return;
    }
    const role = roleFor(item.ID), c = credentials(role);
    test.skip(!c.email || !c.password, `Configure credenciales de ${role}`);
    const login = await loginApi(request, role); const token = login!.token;
    const foreignClient = Number(process.env.CRM_FOREIGN_CLIENT_ID);
    const foreignOwner = process.env.CRM_FOREIGN_OWNER_ID;

    if (item.ID === 'CP-15') {
      const data = await clientData(request, token); const owner = data.users.find((u: any) => u.role === 'Supervisor') ?? data.users[0];
      const response = await request.post('/api/clients', { headers: auth(token), data: { nombre: '<script>alert(1)</script>', apellidos: '', email: `xss.${Date.now()}@example.com`, whatsapp: '88881111', sourceId: data.sources[0].id, stageId: data.stages[0].id, ownerId: owner.id } });
      expect(response.ok()).toBeTruthy(); const id = await response.json();
      const clients = await request.get('/api/clients', { headers: auth(token) }); expect(JSON.stringify(await clients.json())).toContain('<script>alert(1)</script>');
      await request.delete(`/api/clients/${id}`, { headers: auth(token) }); return;
    }
    if (item.ID === 'CP-47') {
      const clients = await request.get('/api/clients', { headers: auth(token) }); const list = await clients.json(); test.skip(!list.length, 'Requiere un cliente accesible');
      const response = await request.post(`/api/clients/${list[0].id}/comments`, { headers: auth(token), data: { userId: login!.userId, text: '<img src=x onerror=alert(1)>' } });
      expect(response.ok()).toBeTruthy(); const comments = await request.get(`/api/clients/${list[0].id}/comments`, { headers: auth(token) }); expect(JSON.stringify(await comments.json())).toContain('onerror=alert(1)'); return;
    }
    if (item.ID === 'CP-07b') {
      const data = await clientData(request, token); const response = await request.post('/api/clients', { headers: auth(token), data: { nombre: 'Correo inválido', apellidos: '', email: 'no-es-correo', whatsapp: '88881111', sourceId: data.sources[0].id, stageId: data.stages[0].id, ownerId: data.users[0].id } });
      expect(response.status()).toBe(400); return;
    }
    if (item.ID === 'CP-18b') {
      const response = await request.post('/api/clients', { headers: auth(token), data: {} }); expect(response.status()).toBe(403); return;
    }
    if (['CP-30','CP-41','CP-67'].includes(item.ID)) {
      const path = item.ID === 'CP-30' ? '/api/clients/1' : item.ID === 'CP-41' ? '/api/clients/1' : '/api/clients/1/board-visibility';
      const response = item.ID === 'CP-30' ? await request.put(path, { headers: auth(token), data: { id: 1 } }) : item.ID === 'CP-41' ? await request.delete(path, { headers: auth(token) }) : await request.post(path, { headers: auth(token), data: { hidden: true } });
      expect(response.status()).toBe(403); return;
    }
    test.skip(!foreignClient, 'Configure CRM_FOREIGN_CLIENT_ID con un cliente fuera del alcance');
    let response;
    if (item.ID === 'CP-18c') { test.skip(!foreignOwner, 'Configure CRM_FOREIGN_OWNER_ID'); const data = await clientData(request, token); response = await request.post('/api/clients', { headers: auth(token), data: { nombre: 'Scope', apellidos: 'Test', email: `scope.${Date.now()}@example.com`, whatsapp: '88881111', sourceId: data.sources[0].id, stageId: data.stages[0].id, ownerId: foreignOwner } }); }
    else if (item.ID === 'CP-27b' || item.ID === 'CP-30b') { test.skip(!foreignOwner, 'Configure CRM_FOREIGN_OWNER_ID'); response = await request.put(`/api/clients/${foreignClient}`, { headers: auth(token), data: { id: foreignClient, nombre: 'Scope', apellidos: 'Test', email: 'scope@example.com', whatsapp: '88881111', sourceId: 1, ownerId: foreignOwner } }); }
    else if (item.ID === 'CP-37' || item.ID === 'CP-37b') response = await request.post(`/api/clients/${foreignClient}/move`, { headers: auth(token), data: { newStageId: 1 } });
    else if (item.ID === 'CP-41b') response = await request.delete(`/api/clients/${foreignClient}`, { headers: auth(token) });
    else if (item.ID === 'CP-67b') response = await request.post(`/api/clients/${foreignClient}/board-visibility`, { headers: auth(token), data: { hidden: true } });
    else response = await request.post(`/api/clients/${foreignClient}/comments`, { headers: auth(token), data: { userId: login!.userId, text: 'scope test' } });
    expect(response!.status()).toBe(403);
  });
}
