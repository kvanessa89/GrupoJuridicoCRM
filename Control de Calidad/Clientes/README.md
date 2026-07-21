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
- `npm run report`: abre el reporte HTML de la última ejecución.
- `npx playwright test --grep "CP-27b"`: un caso por ID.

## Credenciales en CMD y casos omitidos

`findstr` únicamente demuestra que los valores existen dentro de `.env`; CMD no
convierte ese archivo en variables de entorno por sí mismo. La configuración actual
carga `.env` automáticamente antes de registrar las pruebas, tanto con los runners
como al ejecutar `npm test` directamente.

Si se usa una copia anterior y el resultado sigue siendo `87 skipped, 3 passed`, se
puede cargar el archivo manualmente en la ventana actual de CMD y volver a ejecutar:

```bat
for /f "usebackq eol=# tokens=1,* delims==" %A in (".env") do @set "%A=%B"
if defined CRM_ADMIN_EMAIL (echo Credenciales Admin cargadas) else (echo ERROR: credenciales no cargadas)
npx playwright test --reporter=list,html
npx playwright show-report playwright-report
```

Los tres casos que no necesitan autenticación pueden pasar aunque las credenciales
no estén cargadas; los casos que requieren un rol se omiten deliberadamente si sus
variables están ausentes. Los casos exclusivos de Asesor, Supervisor o Editor
seguirán omitidos hasta configurar las credenciales correspondientes de
`.env.example`.

En CMD se escribe `%A`; dentro de un archivo `.cmd` debe escribirse `%%A`. Para ver
la razón exacta de cada omisión, abra el reporte con `npm run report`.

El helper de navegador sí completa correo y contraseña y después hace clic en
**Iniciar sesión**. Además espera que la aplicación abandone `/login` antes de abrir
Clientes. Por tanto, un caso marcado `skipped` no fue omitido por faltar el clic:
Playwright muestra `skipped` antes de intentar el login cuando no encuentra las
credenciales del rol requerido. Si el clic o la autenticación fallan, el resultado
será `failed` (no `skipped`) y el reporte indicará si no encontró el botón o si la
aplicación permaneció en `/login`.

Las imágenes del login no determinan si la autenticación terminó. Después del clic,
la suite espera la respuesta `POST /api/auth/login`, comprueba que sea exitosa y
espera que `.app-shell` esté visible. Solo entonces navega a `/clientes` y espera la
página del módulo. Esto evita continuar mientras React todavía está montando la
interfaz autenticada. Para diagnosticar `CP-01` visualmente ejecute:

```bat
npx playwright test --grep "CP-01" --headed --trace on
```

Si falla, el mensaje distinguirá entre una respuesta HTTP de login no exitosa, la
aplicación autenticada que no llegó a montarse y la página de Clientes que no se
mostró.

La suite puede crear clientes o comentarios. Ejecútela en un ambiente de QA controlado; no ejecute pruebas destructivas contra producción sin autorización y respaldo.
