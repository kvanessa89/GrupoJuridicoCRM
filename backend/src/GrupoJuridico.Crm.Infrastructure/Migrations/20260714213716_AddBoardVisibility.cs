using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GrupoJuridico.Crm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HiddenFromBoard",
                table: "Clients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "HideableStages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StageId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HideableStages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HideableStages_Stages_StageId",
                        column: x => x.StageId,
                        principalTable: "Stages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HideableStages_StageId",
                table: "HideableStages",
                column: "StageId",
                unique: true);

            // Semilla: "Cerrado ganado" oculta del tablero por defecto. Se hace por SQL (no en
            // DbSeeder) porque DbSeeder no vuelve a correr en bases que ya tienen usuarios.
            migrationBuilder.Sql(
                """
                INSERT INTO "HideableStages" ("StageId")
                SELECT "Id" FROM "Stages" WHERE "Name" = 'Cerrado ganado'
                ON CONFLICT DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HideableStages");

            migrationBuilder.DropColumn(
                name: "HiddenFromBoard",
                table: "Clients");
        }
    }
}
