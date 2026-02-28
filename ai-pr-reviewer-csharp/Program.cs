using System.Diagnostics;
using System.Text.RegularExpressions;

namespace AiPrReviewer;

class Program
{
    static int Main(string[] args)
    {
        var repoPath = GetArgValue(args, "--repo") ?? Directory.GetCurrentDirectory();
        var branch = GetArgValue(args, "--branch") ?? "main";

        if (args.Contains("--help") || args.Contains("-h"))
        {
            PrintUsage();
            return 0;
        }

        Console.WriteLine("=================================================");
        Console.WriteLine("  AI PR Reviewer — CrashBytes");
        Console.WriteLine("  Part 1: Git Diff Analysis");
        Console.WriteLine("=================================================");
        Console.WriteLine();

        // Validate repo path
        if (!Directory.Exists(Path.Combine(repoPath, ".git")))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error: '{repoPath}' is not a git repository.");
            Console.ResetColor();
            return 1;
        }

        Console.WriteLine($"Repository: {repoPath}");
        Console.WriteLine($"Base branch: {branch}");
        Console.WriteLine();

        // Check if branch exists
        var branchCheck = RunGitCommand(repoPath, $"rev-parse --verify {branch}");
        if (!branchCheck.Success)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error: Branch '{branch}' does not exist.");
            Console.ResetColor();
            return 1;
        }

        // Get the diff
        var diffResult = RunGitCommand(repoPath, $"diff {branch}...HEAD");
        if (!diffResult.Success)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error running git diff: {diffResult.Error}");
            Console.ResetColor();
            return 1;
        }

        if (string.IsNullOrWhiteSpace(diffResult.Output))
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("No changes found between HEAD and the base branch.");
            Console.ResetColor();
            return 0;
        }

        // Parse the diff
        var files = ParseDiff(diffResult.Output);

        // Print summary
        PrintSummary(files);

        // Print per-file breakdown
        PrintFileBreakdown(files);

        return 0;
    }

    static string? GetArgValue(string[] args, string flag)
    {
        for (int i = 0; i < args.Length - 1; i++)
        {
            if (args[i] == flag)
                return args[i + 1];
        }
        return null;
    }

    static void PrintUsage()
    {
        Console.WriteLine("AI PR Reviewer — CrashBytes");
        Console.WriteLine();
        Console.WriteLine("Usage: dotnet run -- [options]");
        Console.WriteLine();
        Console.WriteLine("Options:");
        Console.WriteLine("  --repo <path>     Path to the git repository (default: current directory)");
        Console.WriteLine("  --branch <name>   Base branch to diff against (default: main)");
        Console.WriteLine("  --help, -h        Show this help message");
    }

    static (bool Success, string Output, string Error) RunGitCommand(string workingDir, string arguments)
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

    static List<FileDiff> ParseDiff(string diffOutput)
    {
        var files = new List<FileDiff>();
        FileDiff? current = null;

        foreach (var line in diffOutput.Split('\n'))
        {
            // New file header
            if (line.StartsWith("diff --git"))
            {
                current = new FileDiff();
                files.Add(current);
                continue;
            }

            if (current == null)
                continue;

            // File paths
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
            // Hunk header
            else if (line.StartsWith("@@"))
            {
                current.HunkCount++;
            }
            // Added line
            else if (line.StartsWith("+") && !line.StartsWith("+++"))
            {
                current.Additions++;
            }
            // Removed line
            else if (line.StartsWith("-") && !line.StartsWith("---"))
            {
                current.Deletions++;
            }
        }

        return files;
    }

    static void PrintSummary(List<FileDiff> files)
    {
        var totalAdditions = files.Sum(f => f.Additions);
        var totalDeletions = files.Sum(f => f.Deletions);
        var newFiles = files.Count(f => f.IsNew);
        var deletedFiles = files.Count(f => f.IsDeleted);
        var modifiedFiles = files.Count - newFiles - deletedFiles;

        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("-------------------------------------------------");
        Console.WriteLine("  DIFF SUMMARY");
        Console.WriteLine("-------------------------------------------------");
        Console.ResetColor();
        Console.WriteLine($"  Files changed:  {files.Count}");
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"  Additions:      +{totalAdditions}");
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"  Deletions:      -{totalDeletions}");
        Console.ResetColor();
        Console.WriteLine($"  New files:      {newFiles}");
        Console.WriteLine($"  Deleted files:  {deletedFiles}");
        Console.WriteLine($"  Modified files: {modifiedFiles}");
        Console.WriteLine();
    }

    static void PrintFileBreakdown(List<FileDiff> files)
    {
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("-------------------------------------------------");
        Console.WriteLine("  PER-FILE BREAKDOWN");
        Console.WriteLine("-------------------------------------------------");
        Console.ResetColor();
        Console.WriteLine();

        Console.WriteLine($"  {"File",-45} {"Status",-10} {"+",-8} {"-",-8} {"Hunks",-6}");
        Console.WriteLine($"  {new string('-', 45)} {new string('-', 10)} {new string('-', 8)} {new string('-', 8)} {new string('-', 6)}");

        foreach (var file in files.OrderByDescending(f => f.Additions + f.Deletions))
        {
            var name = file.DisplayName;
            if (name.Length > 44)
                name = "..." + name[^41..];

            var status = file.IsNew ? "NEW" : file.IsDeleted ? "DELETED" : "MODIFIED";

            Console.Write($"  {name,-45} ");

            Console.ForegroundColor = file.IsNew ? ConsoleColor.Green
                : file.IsDeleted ? ConsoleColor.Red
                : ConsoleColor.Yellow;
            Console.Write($"{status,-10} ");
            Console.ResetColor();

            Console.ForegroundColor = ConsoleColor.Green;
            Console.Write($"+{file.Additions,-7} ");
            Console.ForegroundColor = ConsoleColor.Red;
            Console.Write($"-{file.Deletions,-7} ");
            Console.ResetColor();
            Console.WriteLine($"{file.HunkCount,-6}");
        }

        Console.WriteLine();
    }
}

class FileDiff
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
