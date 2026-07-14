# GrupoJuridico CRM — Backend

Backend en .NET 8 (Clean Architecture) para el CRM diseñado en Claude Design
(`GrupoJuridico_CRM_dc.html`). Mismo patrón de capas que Oviq.

## Estructura

```
src/
  GrupoJuridico.Crm.Domain/         Entidades, enums. Sin dependencias externas.
  GrupoJuridico.Crm.Application/    CQRS con MediatR, DTOs, interfaces.
  GrupoJuridico.Crm.Infrastructure/ EF Core + PostgreSQL, configuraciones, seed.
  GrupoJuridico.Crm.Api/             Controllers REST, Program.cs.
```

## Modelo de datos

- **User**: admin / supervisor / editor / asesor. Un asesor pertenece a un supervisor (`SupervisorId`).
- **Stage**: etapa del pipeline (columna del tablero). Tiene `Order` para el orden en el tablero.
- **Source**: fuente/etiqueta de origen del cliente (P1, P2...).
- **Client**: cliente. Pertenece a una `Stage`, una `Source` y tiene un `Owner` (asesor dueño).
- **Comment**: comentarios sobre un cliente.
- **StageHistoryEntry**: cada vez que un cliente cambia de etapa se cierra el segmento anterior
  (`ExitedAt`) y se abre uno nuevo — esto es lo que te va a permitir armar reportes de "tiempo
  promedio por etapa" más adelante, igual que `stageHistory` en el diseño original.

## Cómo levantar el proyecto

Estos archivos `.csproj` los armé a mano (el sandbox donde trabajo no tiene el SDK de
.NET instalado), así que el primer paso es que tu máquina genere el `.sln`:

```bash
cd GrupoJuridico.Crm
dotnet new sln -n GrupoJuridico.Crm

dotnet sln add src/GrupoJuridico.Crm.Domain/GrupoJuridico.Crm.Domain.csproj
dotnet sln add src/GrupoJuridico.Crm.Application/GrupoJuridico.Crm.Application.csproj
dotnet sln add src/GrupoJuridico.Crm.Infrastructure/GrupoJuridico.Crm.Infrastructure.csproj
dotnet sln add src/GrupoJuridico.Crm.Api/GrupoJuridico.Crm.Api.csproj

dotnet restore
```

Después, configura tu cadena de conexión real en
`src/GrupoJuridico.Crm.Api/appsettings.json` (o mejor, en un `appsettings.Local.json`
o en User Secrets) y genera la migración inicial:

```bash
cd src/GrupoJuridico.Crm.Api
dotnet tool install --global dotnet-ef   # si no lo tienes
dotnet ef migrations add InitialCreate --project ../GrupoJuridico.Crm.Infrastructure --startup-project .
dotnet ef database update --project ../GrupoJuridico.Crm.Infrastructure --startup-project .
```

Al correr en modo `Development`, `Program.cs` ya aplica las migraciones y
siembra las etapas/fuentes/usuarios de ejemplo automáticamente (`DbSeeder`),
así que no necesitas correr `database update` a mano si solo quieres probar.

```bash
dotnet run --project src/GrupoJuridico.Crm.Api
```

Swagger queda en `https://localhost:7100/swagger`.

## Pendientes / decisiones abiertas

- **Auth**: el diseño original tiene login "demo" (elegís un perfil). Falta
  decidir si va JWT propio, cookie de sesión, o algo tipo Azure AD B2C —
  lo dejamos para cuando ataquemos el frontend.
- **Multi-tenant**: si GrupoJuridico CRM se va a vender a más de un despacho/empresa,
  conviene agregar un `TenantId` a las entidades desde ya, antes de tener datos
  reales. Avisame si aplica.
- **Hosting**: mismo dilema que Oviq (Azure App Service vs Hetzner VPS).
