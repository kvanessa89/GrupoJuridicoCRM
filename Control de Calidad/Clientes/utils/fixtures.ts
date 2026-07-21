import { expect, type APIRequestContext, type Page } from '@playwright/test';

export type Role = 'ADMIN' | 'EDITOR' | 'SUPERVISOR' | 'ADVISOR';
export const credentials = (role: Role) => {
  const prefix = `CRM_${role}`;
  return { email: process.env[`${prefix}_EMAIL`], password: process.env[`${prefix}_PASSWORD`] };
};

export async function loginApi(request: APIRequestContext, role: Role) {
  const c = credentials(role);
  if (!c.email || !c.password) return null;
  const response = await request.post('/api/auth/login', { data: c });
  expect(response.ok(), `login API de ${role}`).toBeTruthy();
  return (await response.json()) as { token: string; userId: string; role: string };
}

export async function loginUi(page: Page, role: Role) {
  const c = credentials(role);
  if (!c.email || !c.password) return false;
  await page.goto('/login');
  const email = page.locator('#login-email');
  const password = page.locator('#login-password');
  const submit = page.getByRole('button', { name: /iniciar sesi[oó]n/i });

  await expect(email, 'campo de correo del login').toBeVisible();
  await expect(password, 'campo de contraseña del login').toBeVisible();
  await email.fill(c.email);
  await password.fill(c.password);
  await expect(submit, 'botón Iniciar sesión').toBeVisible();
  await expect(submit, 'botón Iniciar sesión').toBeEnabled();

  const loginResponsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return request.method() === 'POST' && new URL(response.url()).pathname.endsWith('/api/auth/login');
  });
  await submit.click();
  await expect(page, `login UI de ${role}`).not.toHaveURL(/\/login(?:[/?#]|$)/i, { timeout: 30_000 });
  return true;
}

export async function openClients(page: Page, role: Role = 'ADMIN') {
  if (!(await loginUi(page, role))) return false;
  await page.goto('/clientes', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.clients-page')).toBeVisible();
  return true;
}

export async function openNewClient(page: Page) {
  await page.getByRole('button', { name: 'Nuevo cliente' }).click();
  await expect(page.locator('.modal-title', { hasText: 'Nuevo cliente' })).toBeVisible();
  await expect(page.locator('#client-nombre')).toBeVisible();
}

export async function fillValidClient(page: Page, suffix = Date.now().toString()) {
  await page.locator('#client-nombre').fill(`Auto ${suffix}`.slice(0, 25));
  await page.locator('#client-apellidos').fill('Playwright');
  await page.locator('#client-email').fill(`qa.${suffix}@example.com`.slice(-50));
  await page.locator('#client-whatsapp').fill('88881111');
}
