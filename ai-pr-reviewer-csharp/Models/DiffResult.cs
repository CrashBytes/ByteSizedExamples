namespace AiPrReviewer;

public class DiffResult
{
    public List<FileDiff> Files { get; set; } = new();
    public string RawDiff { get; set; } = "";

    public int TotalAdditions => Files.Sum(f => f.Additions);
    public int TotalDeletions => Files.Sum(f => f.Deletions);
    public int NewFiles => Files.Count(f => f.IsNew);
    public int DeletedFiles => Files.Count(f => f.IsDeleted);
    public int ModifiedFiles => Files.Count - NewFiles - DeletedFiles;
}

public class FileDiff
{
    public string? OldPath { get; set; }
    public string? NewPath { get; set; }
    public bool IsNew { get; set; }
    public bool IsDeleted { get; set; }
    public int Additions { get; set; }
    public int Deletions { get; set; }
    public int HunkCount { get; set; }

    public string DisplayName => NewPath ?? OldPath ?? "(unknown)";
}
