namespace GrupoJuridico.Crm.Application.BoardSnapshots;

public class BoardSnapshotDto
{
    public int Id { get; set; }
    public DateTime GeneratedAt { get; set; }
    public string GeneratedByName { get; set; } = string.Empty;
    public List<BoardSnapshotEntryDto> Entries { get; set; } = new();
}

public class BoardSnapshotEntryDto
{
    public int StageId { get; set; }
    public string StageName { get; set; } = string.Empty;
    public string StageColor { get; set; } = string.Empty;
    public int Count { get; set; }
}
