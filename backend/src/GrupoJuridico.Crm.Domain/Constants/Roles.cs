namespace GrupoJuridico.Crm.Domain.Constants;

// Admin: acceso total. Supervisor: gestiona a sus asesores. Editor: solo registra clientes.
// Asesor: dueño de sus propios clientes en el tablero.
public static class Roles
{
    public const string Admin = "Admin";
    public const string Supervisor = "Supervisor";
    public const string Editor = "Editor";
    public const string Asesor = "Asesor";
}
