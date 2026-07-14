using GrupoJuridico.Crm.Domain.Constants;
using GrupoJuridico.Crm.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GrupoJuridico.Crm.Infrastructure.Persistence.Seed;

// Datos iniciales de desarrollo: mismas etapas y fuentes del diseño original en Claude Design.
// Se ejecuta una sola vez si la base está vacía (ver Program.cs).
public static class DbSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, RoleManager<IdentityRole<Guid>> roleManager, UserManager<User> userManager)
    {
        foreach (var roleName in new[] { Roles.Admin, Roles.Supervisor, Roles.Editor, Roles.Asesor })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new IdentityRole<Guid>(roleName) { Id = Guid.NewGuid() });
        }

        if (await context.Users.AnyAsync()) return;

        var supervisor = new User { UserName = "roberto.vidal@grupojuridico.com", Email = "roberto.vidal@grupojuridico.com", EmailConfirmed = true, Name = "Roberto Vidal", Title = "Supervisor de equipo", Color = "#DB2777" };
        await CreateSeedUserAsync(userManager, supervisor, "Supervisor123!", Roles.Supervisor);

        var admin = new User { UserName = "laura.mendez@grupojuridico.com", Email = "laura.mendez@grupojuridico.com", EmailConfirmed = true, Name = "Laura Méndez", Title = "Gerente comercial", Color = "#2563EB" };
        await CreateSeedUserAsync(userManager, admin, "Admin123!", Roles.Admin);

        var editor = new User { UserName = "paula.soto@grupojuridico.com", Email = "paula.soto@grupojuridico.com", EmailConfirmed = true, Name = "Paula Soto", Title = "Registro de clientes", Color = "#D97706" };
        await CreateSeedUserAsync(userManager, editor, "Editor123!", Roles.Editor);

        var asesor = new User { UserName = "carlos.ruiz@grupojuridico.com", Email = "carlos.ruiz@grupojuridico.com", EmailConfirmed = true, Name = "Carlos Ruiz", Title = "Asesor inmobiliario", Color = "#0891B2", SupervisorId = supervisor.Id };
        await CreateSeedUserAsync(userManager, asesor, "Asesor123!", Roles.Asesor);

        var stages = new[]
        {
            new Stage { Name = "Nuevo cliente",   Color = "#2563EB", Order = 0 },
            new Stage { Name = "Contactado",      Color = "#0891B2", Order = 1 },
            new Stage { Name = "Visita agendada", Color = "#D97706", Order = 2 },
            new Stage { Name = "Propuesta",       Color = "#7C3AED", Order = 3 },
            new Stage { Name = "Negociación",     Color = "#EA580C", Order = 4 },
            new Stage { Name = "Cerrado ganado",  Color = "#16A34A", Order = 5 },
        };
        context.Stages.AddRange(stages);

        var sources = new[]
        {
            new Source { Code = "P1",  Label = "Propiedades con demanda inscrita", Color = "#2563EB", Order = 0 },
            new Source { Code = "P2",  Label = "Con edictos anunciados",           Color = "#0891B2", Order = 1 },
            new Source { Code = "P3",  Label = "Fideicomiso",                      Color = "#7C3AED", Order = 2 },
            new Source { Code = "P4",  Label = "Proceso concursal",                Color = "#D97706", Order = 3 },
            new Source { Code = "P5",  Label = "Estrellitas activas",              Color = "#EA580C", Order = 4 },
            new Source { Code = "P6",  Label = "Procesos en abandono",             Color = "#16A34A", Order = 5 },
            new Source { Code = "P7",  Label = "Sin prima pagada",                 Color = "#E11D48", Order = 6 },
            new Source { Code = "P8",  Label = "Citas fallidas",                   Color = "#0F766E", Order = 7 },
            new Source { Code = "P9",  Label = "Citas en abandono",                Color = "#9333EA", Order = 8 },
            new Source { Code = "P10", Label = "Redes sociales",                   Color = "#0284C7", Order = 9 },
            new Source { Code = "P11", Label = "Remate en 24 horas",               Color = "#DC2626", Order = 10 },
            new Source { Code = "P12", Label = "Después del remate",               Color = "#65A30D", Order = 11 },
        };
        context.Sources.AddRange(sources);

        await context.SaveChangesAsync();
    }

    private static async Task CreateSeedUserAsync(UserManager<User> userManager, User user, string password, string role)
    {
        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            throw new InvalidOperationException($"No se pudo crear el usuario semilla '{user.Email}': {string.Join("; ", result.Errors.Select(e => e.Description))}");

        await userManager.AddToRoleAsync(user, role);
    }
}
