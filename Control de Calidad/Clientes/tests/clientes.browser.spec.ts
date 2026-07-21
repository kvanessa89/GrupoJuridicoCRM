import { expect, test, type Page } from '@playwright/test';
import cases from '../casos-de-prueba.json';
import { fillValidClient, openClients, openNewClient, credentials, type Role } from '../utils/fixtures';

type Case = (typeof cases)[number];
type RowSnapshot = { client: string; email: string; phone: string; origin: string; stage: string; advisor: string };
const browserCases = cases.filter((item) => !item.Tipo.toLowerCase().includes('seguridad'));
const roleFor = (item: Case): Role => item['Rol(es)'].includes('Asesor') ? 'ADVISOR' : item['Rol(es)'].includes('Supervisor') && !item['Rol(es)'].includes('Admin') ? 'SUPERVISOR' : item['Rol(es)'].includes('Editor') && !item['Rol(es)'].includes('Admin') ? 'EDITOR' : 'ADMIN';

const normalized = (value: string) => value.trim().replace(/\s+/g, ' ');
const compareText = (left: string, right: string) => left.localeCompare(right);

async function rowsSnapshot(page: Page): Promise<RowSnapshot[]> {
  return page.locator('.clients-row').evaluateAll((rows) => rows.map((row) => ({
    client: row.querySelector('.clients-row-name')?.textContent?.trim() ?? '',
    email: row.querySelector('.clients-row-email')?.textContent?.trim() ?? '',
    phone: row.querySelector('.clients-row-phone')?.textContent?.trim() ?? '',
    origin: row.querySelector('.col-origen')?.textContent?.trim() ?? '',
    stage: row.querySelector('.col-etapa')?.textContent?.replace('Oculto del tablero', '').trim() ?? '',
    advisor: row.querySelector('.clients-row-owner span')?.textContent?.trim() ?? '',
  })));
}

function expectSameRows(before: RowSnapshot[], after: RowSnapshot[]) {
  const canonical = (rows: RowSnapshot[]) => rows.map((row) => JSON.stringify(row)).sort();
  expect(canonical(after), 'ordenar debe conservar toda la data visible de cada fila').toEqual(canonical(before));
}

function expectOrdered<T>(values: T[], compare: (left: T, right: T) => number, direction: 'asc' | 'desc') {
  const multiplier = direction === 'asc' ? 1 : -1;
  for (let index = 1; index < values.length; index += 1) {
    expect(compare(values[index - 1], values[index]) * multiplier, `orden ${direction} entre posiciones ${index} y ${index + 1}`).toBeLessThanOrEqual(0);
  }
}

async function catalog<T>(page: Page, path: string): Promise<T[]> {
  return page.evaluate(async (apiPath) => {
    const token = localStorage.getItem('gjcrm.token');
    const response = await fetch(apiPath, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error(`No se pudo cargar ${apiPath}: ${response.status}`);
    return response.json();
  }, path);
}

async function firstRow(page: Page) {
  const row = page.locator('.clients-row').first();
  test.skip((await row.count()) === 0, 'Requiere al menos un cliente visible para la cuenta');
  return row;
}

for (const item of browserCases) {
  test(`${item.ID} | ${item.Escenario}`, async ({ page }) => {
    test.info().annotations.push({ type: 'módulo', description: item['Módulo'] }, { type: 'prioridad', description: item.Prioridad });
    const role = roleFor(item);
    const creds = credentials(role);
    test.skip(!creds.email || !creds.password, `Configure CRM_${role}_EMAIL y CRM_${role}_PASSWORD`);
    await openClients(page, role);

    if (['CP-18', 'CP-40', 'CP-54', 'CP-66'].includes(item.ID)) {
      if (item.ID === 'CP-18') await expect(page.getByRole('button', { name: 'Nuevo cliente' })).toHaveCount(0);
      if (item.ID === 'CP-40') await expect(page.locator('[title="Eliminar cliente"]')).toHaveCount(0);
      if (item.ID === 'CP-66') await expect(page.locator('[title="Restaurar al tablero"]')).toHaveCount(0);
      if (item.ID === 'CP-54') await expect(page.locator('.clients-table-head')).not.toContainText('Asesor');
      return;
    }

    if (/^CP-(0[1-9]|1[0-7]|19|20b)$/.test(item.ID)) {
      await openNewClient(page);
      const save = page.getByRole('button', { name: 'Guardar cliente' });
      if (item.ID === 'CP-02') { await fillValidClient(page); await page.locator('#client-nombre').fill(''); await expect(save).toBeDisabled(); }
      else if (item.ID === 'CP-03' || item.ID === 'CP-07') { await fillValidClient(page); await page.locator('#client-email').fill('asdf-no-es-correo'); await expect(save).toBeDisabled(); await expect(page.getByText('Ingresa un correo electrónico válido.')).toBeVisible(); }
      else if (item.ID === 'CP-04') { await fillValidClient(page); await page.locator('#client-whatsapp').fill(''); await expect(save).toBeDisabled(); }
      else if (item.ID === 'CP-05') { await fillValidClient(page); await page.locator('#client-nombre').fill('   '); await expect(save).toBeDisabled(); }
      else if (item.ID === 'CP-09') { await fillValidClient(page); await page.locator('#client-nombre').fill('N'.repeat(25)); await expect(page.locator('#client-nombre')).toHaveValue('N'.repeat(25)); }
      else if (item.ID === 'CP-10' || item.ID === 'CP-11' || item.ID === 'CP-12' || item.ID === 'CP-13') {
        const selector = item.ID === 'CP-10' ? '#client-nombre' : item.ID === 'CP-11' ? '#client-apellidos' : item.ID === 'CP-12' ? '#client-email' : '#client-telefono';
        const limit = item.ID === 'CP-12' ? 50 : item.ID === 'CP-13' ? 20 : 25;
        await page.locator(selector).fill('x'.repeat(limit + 10)); await expect(page.locator(selector)).toHaveValue('x'.repeat(limit));
      } else if (item.ID === 'CP-16') { await expect(page.locator('#client-source')).not.toHaveValue(''); }
      else if (item.ID === 'CP-19' || item.ID === 'CP-20b') { await expect(page.locator('#client-owner option')).not.toHaveCount(0); }
      else if (item.ID === 'CP-22') { await fillValidClient(page); await page.getByRole('button', { name: 'Cancelar' }).click(); await expect(page.locator('#client-nombre')).toHaveCount(0); }
      else { await fillValidClient(page); await expect(save).toBeEnabled(); }
      return;
    }

    if (['CP-50', 'CP-51', 'CP-52', 'CP-53', 'CP-75'].includes(item.ID)) {
      const search = page.getByPlaceholder('Buscar por nombre o correo...');
      await search.fill(item.ID === 'CP-52' ? `zzzz-${Date.now()}` : 'a');
      if (item.ID === 'CP-52') await expect(page.getByText('No se encontraron clientes.')).toBeVisible();
      else {
        const count = await page.locator('.clients-row').count();
        await expect(page.locator('.clients-count')).toHaveText(`${count} clientes`);
      }
      return;
    }

    if (['CP-70', 'CP-71', 'CP-72', 'CP-73', 'CP-74'].includes(item.ID)) {
      const tableHead = page.locator('.clients-table-head');
      const clientHeader = tableHead.locator('.col-cliente');
      await expect(page.locator('.clients-row').first(), 'se requieren filas cargadas para validar el orden').toBeVisible();
      const before = await rowsSnapshot(page);
      test.skip(before.length < 2, 'Se requieren al menos dos clientes para validar el orden');

      if (item.ID === 'CP-70') {
        await clientHeader.click();
        await expect(clientHeader.locator('.th-sort-arrow')).toHaveText('▲');
        const ascending = await rowsSnapshot(page);
        expectSameRows(before, ascending);
        expectOrdered(ascending.map((row) => normalized(row.client)), compareText, 'asc');
      }

      if (item.ID === 'CP-71') {
        await clientHeader.click();
        const ascending = await rowsSnapshot(page);
        expectOrdered(ascending.map((row) => normalized(row.client)), compareText, 'asc');
        await clientHeader.click();
        await expect(clientHeader.locator('.th-sort-arrow')).toHaveText('▼');
        const descending = await rowsSnapshot(page);
        expectSameRows(before, descending);
        expectOrdered(descending.map((row) => normalized(row.client)), compareText, 'desc');
      }

      if (item.ID === 'CP-72') {
        await clientHeader.click();
        await clientHeader.click();
        await expect(clientHeader.locator('.th-sort-arrow')).toHaveText('▼');
        const sourceCatalog = await catalog<{ code: string; label: string }>(page, '/api/sources');
        const sourceLabels = new Map(sourceCatalog.map((source) => [source.code, source.label]));
        const originHeader = tableHead.locator('.col-origen');
        await originHeader.click();
        await expect(originHeader.locator('.th-sort-arrow')).toHaveText('▲');
        await expect(clientHeader.locator('.th-sort-arrow')).toHaveCount(0);
        const byOrigin = await rowsSnapshot(page);
        expectSameRows(before, byOrigin);
        expectOrdered(byOrigin.map((row) => normalized(sourceLabels.get(row.origin) ?? '')), compareText, 'asc');
      }

      if (item.ID === 'CP-73') {
        const stageCatalog = await catalog<{ name: string; order: number }>(page, '/api/stages');
        const stageOrders = new Map(stageCatalog.map((stage) => [stage.name, stage.order]));
        const stageHeader = tableHead.locator('.col-etapa');
        await stageHeader.click();
        await expect(stageHeader.locator('.th-sort-arrow')).toHaveText('▲');
        const byStage = await rowsSnapshot(page);
        expectSameRows(before, byStage);
        expectOrdered(byStage.map((row) => stageOrders.get(normalized(row.stage)) ?? Number.NEGATIVE_INFINITY), (left, right) => left - right, 'asc');
      }

      if (item.ID === 'CP-74') {
        const advisorHeader = tableHead.locator('.col-asesor');
        await expect(advisorHeader).toBeVisible();
        await advisorHeader.click();
        await expect(advisorHeader.locator('.th-sort-arrow')).toHaveText('▲');
        const byAdvisor = await rowsSnapshot(page);
        expectSameRows(before, byAdvisor);
        expectOrdered(byAdvisor.map((row) => normalized(row.advisor)), compareText, 'asc');

        await page.evaluate(() => {
          const storedUser = localStorage.getItem('gjcrm.user');
          if (!storedUser) throw new Error('No existe el usuario autenticado en localStorage');
          localStorage.setItem('gjcrm.user', JSON.stringify({ ...JSON.parse(storedUser), role: 'Editor' }));
        });
        await page.reload();
        await expect(page.locator('.clients-page')).toBeVisible();
        await expect(page.locator('.clients-table-head .col-asesor')).toHaveCount(0);
        await expect(page.locator('.clients-row .col-asesor')).toHaveCount(0);
      }
      return;
    }

    const row = await firstRow(page);
    if (['CP-38', 'CP-39', 'CP-43'].includes(item.ID)) {
      const name = (await row.locator('.clients-row-name').textContent())?.trim() ?? '';
      await row.locator('[title="Eliminar cliente"]').click();
      await expect(page.getByText(name, { exact: false })).toBeVisible();
      await page.getByRole('button', { name: 'Cancelar' }).click();
      await expect(page.locator('.clients-row-name', { hasText: name })).toBeVisible();
      return;
    }

    await row.click();
    await expect(page.locator('#client-stage')).toBeVisible();
    if (item.ID === 'CP-25') await expect(page.locator('#client-nombre')).toHaveAttribute('readonly', '');
    else if (item.ID === 'CP-28') await expect(page.locator('#client-stage')).toBeEnabled();
    else if (item.ID === 'CP-45') { await page.getByPlaceholder('Escribe un comentario...').fill('   '); await expect(page.getByRole('button', { name: 'Comentar' })).toBeDisabled(); }
    else if (item.ID === 'CP-46') await expect(page.getByText(/Todavía no hay comentarios|Comentarios/)).toBeVisible();
    else await expect(page.locator('.modal-title')).toBeVisible();
  });
}
