using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GrupoJuridico.Crm.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class StageHideableColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HideableStage",
                table: "Stages",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Migra los datos existentes antes de borrar la tabla vieja.
            migrationBuilder.Sql(
                """
                UPDATE "Stages" SET "HideableStage" = true
                WHERE "Id" IN (SELECT "StageId" FROM "HideableStages");
                """);

            migrationBuilder.DropTable(
                name: "HideableStages");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.Sql(
                """
                INSERT INTO "HideableStages" ("StageId")
                SELECT "Id" FROM "Stages" WHERE "HideableStage" = true;
                """);

            migrationBuilder.DropColumn(
                name: "HideableStage",
                table: "Stages");
        }
    }
}
