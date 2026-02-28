using System.Diagnostics;

namespace AiPrReviewer;

public static class DiffParser
{
    public static (bool Success, string Output, string Error) RunGitCommand(string workingDir, string arguments)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "git",
            Arguments = arguments,
            WorkingDirectory = workingDir,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        try
        {
            using var process = Process.Start(psi);
            if (process == null)
                return (false, "", "Failed to start git process.");

            var output = process.StandardOutput.ReadToEnd();
            var error = process.StandardError.ReadToEnd();
            process.WaitForExit();

            return (process.ExitCode == 0, output, error);
        }
        catch (Exception ex)
        {
            return (false, "", $"Failed to run git: {ex.Message}");
        }
    }

    public static DiffResult Parse(string diffOutput)
    {
        var files = new List<FileDiff>();
        FileDiff? current = null;

        foreach (var line in diffOutput.Split('\n'))
        {
            if (line.StartsWith("diff --git"))
            {
                current = new FileDiff();
                files.Add(current);
                continue;
            }

            if (current == null)
                continue;

            if (line.StartsWith("--- a/"))
            {
                current.OldPath = line[6..];
            }
            else if (line.StartsWith("--- /dev/null"))
            {
                current.IsNew = true;
            }
            else if (line.StartsWith("+++ b/"))
            {
                current.NewPath = line[6..];
            }
            else if (line.StartsWith("+++ /dev/null"))
            {
                current.IsDeleted = true;
            }
            else if (line.StartsWith("@@"))
            {
                current.HunkCount++;
            }
            else if (line.StartsWith("+") && !line.StartsWith("+++"))
            {
                current.Additions++;
            }
            else if (line.StartsWith("-") && !line.StartsWith("---"))
            {
                current.Deletions++;
            }
        }

        return new DiffResult
        {
            Files = files,
            RawDiff = diffOutput
        };
    }

    public static string TruncateDiff(string diff, int maxChars = 50000)
    {
        if (diff.Length <= maxChars)
            return diff;

        var truncated = diff[..maxChars];
        var lastNewline = truncated.LastIndexOf('\n');
        if (lastNewline > 0)
            truncated = truncated[..lastNewline];

        return truncated + "\n\n[... diff truncated due to size ...]";
    }
}
