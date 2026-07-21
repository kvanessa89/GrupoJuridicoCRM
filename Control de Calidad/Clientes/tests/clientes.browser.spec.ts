import { expect, test, type Page } from '@playwright/test';
import cases from '../casos-de-prueba.json';
import { fillValidClient, openClients, openNewClient, credentials, type Role } from '../utils/fixtures';

type Case = (typeof cases)[number];
const browserCases = cases.filter((item) => !item.Tipo.toLowerCase().includes('seguridad'));
const roleFor = (item: Case): Role => item['Rol(es)'].includes('Asesor') ? 'ADVISOR' : item['Rol(es)'].includes('Supervisor') && !item['Rol(es)'].includes('Admin') ? 'SUPERVISOR' : item['Rol(es)'].includes('Editor') && !item['Rol(es)'].includes('Admin') ? 'EDITOR' : 'ADMIN';

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
      const header = item.ID === 'CP-73' ? 'Etapa' : item.ID === 'CP-74' ? 'Asesor' : 'Cliente';
      const column = page.locator('.clients-table-head').getByText(header, { exact: true });
      await column.click(); await expect(column).toContainText('▲');
      if (item.ID === 'CP-71') { await column.click(); await expect(column).toContainText('▼'); }
      if (item.ID === 'CP-72') { await column.click(); const other = page.locator('.clients-table-head').getByText('Origen', { exact: true }); await other.click(); await expect(other).toContainText('▲'); }
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
