# Playwright — Módulo Clientes

Suite generada a partir de `Casos de Prueba Clientes.xlsx`. Cada uno de los 90 casos tiene un test con el mismo ID y escenario. Los casos cuyo **Tipo contiene “Seguridad”** viven en `clientes.request.spec.ts` y usan `APIRequestContext`; el resto vive en `clientes.browser.spec.ts` y usa Chromium.

## Preparación

```bash
cd "Control de Calidad/Clientes"
npm install
npx playwright install chromium
cp .env.example .env
set -a; source .env; set +a
./run-playwright.sh all
```

Las credenciales no se guardan en Git. `CRM_ADMIN_*` habilita el recorrido principal. Los casos de permisos/scope se omiten explícitamente hasta configurar las cuentas de cada rol y `CRM_FOREIGN_CLIENT_ID`/`CRM_FOREIGN_OWNER_ID`. El cliente foráneo debe estar fuera del equipo del Supervisor/Asesor utilizado.

## Ejecución guiada

El script `run-playwright.sh` carga `.env`, valida que Playwright y las credenciales Admin estén disponibles, y permite ejecutar toda la suite o una categoría:

```bash
./run-playwright.sh list
./run-playwright.sh browser
./run-playwright.sh request
./run-playwright.sh all --grep "CP-01"
```

## Windows

> ` .\run-playwright.ps1 ` es sintaxis de **PowerShell**. No funciona directamente en CMD. El archivo se encuentra en `Control de Calidad\Clientes\run-playwright.ps1`.

### CMD (Símbolo del sistema)

Desde la raíz del repositorio:

```bat
cd /d "Control de Calidad\Clientes"
npm install
npx playwright install chromium
copy .env.example .env
notepad .env
run-playwright.cmd list
run-playwright.cmd browser
run-playwright.cmd request
run-playwright.cmd all
```

También puede invocar PowerShell explícitamente desde CMD:

```bat
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-playwright.ps1 browser
```

### PowerShell

```powershell
cd "Control de Calidad\Clientes"
npm install
npx playwright install chromium
Copy-Item .env.example .env
notepad .env
.\run-playwright.ps1 list
.\run-playwright.ps1 browser
.\run-playwright.ps1 request
.\run-playwright.ps1 all
```

Para ejecutar un caso específico o abrir el navegador durante la prueba:

```powershell
.\run-playwright.ps1 all --grep "CP-01"
.\run-playwright.ps1 browser --headed
.\run-playwright.ps1 browser --ui
```

Si PowerShell bloquea scripts locales, habilite únicamente esta sesión y vuelva a ejecutar el comando:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Comandos npm

- `npm run test:browser`: casos browser.
- `npm run test:request`: casos request/seguridad.
- `npm run test:list`: inventario sin ejecutar.
- `npx playwright test --grep "CP-27b"`: un caso por ID.

La suite puede crear clientes o comentarios. Ejecútela en un ambiente de QA controlado; no ejecute pruebas destructivas contra producción sin autorización y respaldo.
