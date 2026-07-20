using System.Text.RegularExpressions;

namespace GrupoJuridico.Crm.Application.Common;

public static class EmailValidator
{
    private static readonly Regex Pattern = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    public static bool IsValid(string? email) => !string.IsNullOrWhiteSpace(email) && Pattern.IsMatch(email);
}
