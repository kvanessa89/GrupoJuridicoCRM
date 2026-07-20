# Arma el paquete de despliegue para SmarterASP.NET: compila el frontend, lo copia
# al wwwroot de la API, y publica el backend. El resultado queda listo para subir
# por FTP/Web Deploy en backend/publish/.
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$api = Join-Path $root "backend\src\GrupoJuridico.Crm.Api"
$wwwroot = Join-Path $api "wwwroot"
$publishDir = Join-Path $root "backend\publish"

Write-Host "== 1/4 Instalando dependencias del frontend ==" -ForegroundColor Cyan
Push-Location $frontend
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install falló" }

Write-Host "== 2/4 Compilando frontend (modo production) ==" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build falló" }
Pop-Location

Write-Host "== 3/4 Copiando frontend/dist a wwwroot de la API ==" -ForegroundColor Cyan
if (Test-Path $wwwroot) { Remove-Item -Recurse -Force $wwwroot }
New-Item -ItemType Directory -Path $wwwroot | Out-Null
Copy-Item -Path (Join-Path $frontend "dist\*") -Destination $wwwroot -Recurse

Write-Host "== 4/4 Publicando backend (Release) ==" -ForegroundColor Cyan
if (Test-Path $publishDir) { Remove-Item -Recurse -Force $publishDir }
dotnet publish $api -c Release -o $publishDir
if ($LASTEXITCODE -ne 0) { throw "dotnet publish falló" }

Write-Host ""
Write-Host "Listo. Sube TODO el contenido de esta carpeta por FTP/Web Deploy:" -ForegroundColor Green
Write-Host $publishDir -ForegroundColor Yellow
