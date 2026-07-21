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
  await page.locator('#login-email').fill(c.email);
  await page.locator('#login-password').fill(c.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/login/);
  return true;
}

export async function openClients(page: Page, role: Role = 'ADMIN') {
  if (!(await loginUi(page, role))) return false;
  await page.goto('/clientes');
  await expect(page.locator('.clients-page')).toBeVisible();
  return true;
}

export async function openNewClient(page: Page) {
  await page.getByRole('button', { name: 'Nuevo cliente' }).click();
  await expect(page.getByText('Nuevo cliente', { exact: true })).toBeVisible();
  await expect(page.locator('#client-nombre')).toBeVisible();
}

export async function fillValidClient(page: Page, suffix = Date.now().toString()) {
  await page.locator('#client-nombre').fill(`Auto ${suffix}`.slice(0, 25));
  await page.locator('#client-apellidos').fill('Playwright');
  await page.locator('#client-email').fill(`qa.${suffix}@example.com`.slice(-50));
  await page.locator('#client-whatsapp').fill('88881111');
}
