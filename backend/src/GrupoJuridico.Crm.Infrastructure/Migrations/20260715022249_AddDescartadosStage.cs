using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GrupoJuridico.Crm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDescartadosStage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Solo corre en bases ya sembradas (con etapas existentes) que no tengan
            // "Descartados" todavía. En una base nueva, Stages está vacía en este punto
            // de la migración (DbSeeder corre después) — DbSeeder.cs ya incluye la
            // etapa, así que dejamos que él la cree ahí para no duplicarla.
            migrationBuilder.Sql(
                """
                INSERT INTO "Stages" ("Name", "Color", "Order", "HideableStage")
                SELECT 'Descartados', '#E11D48', (SELECT COALESCE(MAX("Order"), -1) + 1 FROM "Stages"), true
                WHERE EXISTS (SELECT 1 FROM "Stages")
                  AND NOT EXISTS (SELECT 1 FROM "Stages" WHERE "Name" = 'Descartados');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM "Stages" WHERE "Name" = 'Descartados';
                """);
        }
    }
}
