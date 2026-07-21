param(
    [ValidateSet('all', 'browser', 'request', 'list')]
    [string]$Mode = 'all',
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$PlaywrightArgs
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (Test-Path '.env') {
    Get-Content '.env' | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#')) {
            $name, $value = $line -split '=', 2
            if ($name -and $null -ne $value) {
                [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
            }
        }
    }
}

if (-not (Test-Path 'node_modules/.bin/playwright.cmd')) {
    throw "No se encontró Playwright. Ejecute: npm install; npx playwright install chromium"
}

if (-not $env:CRM_ADMIN_EMAIL -or -not $env:CRM_ADMIN_PASSWORD) {
    throw 'Faltan CRM_ADMIN_EMAIL o CRM_ADMIN_PASSWORD. Copie .env.example a .env y configure las credenciales.'
}

$arguments = switch ($Mode) {
    'all'     { @('playwright', 'test') }
    'browser' { @('playwright', 'test', 'tests/clientes.browser.spec.ts') }
    'request' { @('playwright', 'test', 'tests/clientes.request.spec.ts') }
    'list'    { @('playwright', 'test', '--list') }
}

& npx @arguments @PlaywrightArgs
exit $LASTEXITCODE
