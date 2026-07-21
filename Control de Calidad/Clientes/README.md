# Playwright — Módulo Clientes

Suite generada a partir de `Casos de Prueba Clientes.xlsx`. Cada uno de los 90 casos tiene un test con el mismo ID y escenario. Los casos cuyo **Tipo contiene “Seguridad”** viven en `clientes.request.spec.ts` y usan `APIRequestContext`; el resto vive en `clientes.browser.spec.ts` y usa Chromium.

## Preparación

```bash
cd "Control de Calidad/Clientes"
npm install
npx playwright install chromium
cp .env.example .env
set -a; source .env; set +a
npm test
```

Las credenciales no se guardan en Git. `CRM_ADMIN_*` habilita el recorrido principal. Los casos de permisos/scope se omiten explícitamente hasta configurar las cuentas de cada rol y `CRM_FOREIGN_CLIENT_ID`/`CRM_FOREIGN_OWNER_ID`. El cliente foráneo debe estar fuera del equipo del Supervisor/Asesor utilizado.

## Comandos

- `npm run test:browser`: casos browser.
- `npm run test:request`: casos request/seguridad.
- `npm run test:list`: inventario sin ejecutar.
- `npx playwright test --grep "CP-27b"`: un caso por ID.

La suite puede crear clientes o comentarios. Ejecútela en un ambiente de QA controlado; no ejecute pruebas destructivas contra producción sin autorización y respaldo.
