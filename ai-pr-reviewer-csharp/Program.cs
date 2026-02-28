using DotNetEnv;

namespace AiPrReviewer;

class Program
{
    static async Task<int> Main(string[] args)
    {
        var repoPath = GetArgValue(args, "--repo") ?? Directory.GetCurrentDirectory();
        var branch = GetArgValue(args, "--branch") ?? "main";
        var promptVersion = GetArgValue(args, "--prompt") ?? "v3";
        var modelId = GetArgValue(args, "--model");

        if (args.Contains("--help") || args.Contains("-h"))
        {
            PrintUsage();
            return 0;
        }

        // Load .env file if present
        var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
        if (File.Exists(envPath))
            Env.Load(envPath);

        Console.WriteLine("=================================================");
        Console.WriteLine("  AI PR Reviewer — CrashBytes");
        Console.WriteLine("  Part 2: AWS Bedrock Integration");
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

        Console.WriteLine($"Repository:     {repoPath}");
        Console.WriteLine($"Base branch:    {branch}");
        Console.WriteLine($"Prompt version: {promptVersion}");
        Console.WriteLine($"Model:          {modelId ?? BedrockClient.DefaultModel}");
        Console.WriteLine();

        // Check if branch exists
        var branchCheck = DiffParser.RunGitCommand(repoPath, $"rev-parse --verify {branch}");
        if (!branchCheck.Success)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error: Branch '{branch}' does not exist.");
            Console.ResetColor();
            return 1;
        }

        // Get the diff
        var diffResult = DiffParser.RunGitCommand(repoPath, $"diff {branch}...HEAD");
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
        var parsed = DiffParser.Parse(diffResult.Output);

        // Print diff summary
        PrintSummary(parsed);

        // Send to Bedrock for AI review
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("-------------------------------------------------");
        Console.WriteLine("  AI CODE REVIEW");
        Console.WriteLine("-------------------------------------------------");
        Console.ResetColor();
        Console.WriteLine();
        Console.WriteLine("Sending diff to AWS Bedrock...");
        Console.WriteLine();

        try
        {
            var bedrock = new BedrockClient();
            var review = await bedrock.ReviewDiffAsync(parsed.RawDiff, promptVersion, modelId);

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("Review complete!");
            Console.ResetColor();
            Console.WriteLine($"  Model:         {review.ModelId}");
            Console.WriteLine($"  Prompt:        {review.PromptVersion}");
            Console.WriteLine($"  Input tokens:  {review.InputTokens:N0}");
            Console.WriteLine($"  Output tokens: {review.OutputTokens:N0}");
            Console.WriteLine();
            Console.WriteLine("-------------------------------------------------");
            Console.WriteLine();
            Console.WriteLine(review.RawResponse);
            Console.WriteLine();
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error calling AWS Bedrock: {ex.Message}");
            Console.ResetColor();
            Console.WriteLine();
            Console.WriteLine("Make sure you have configured your AWS credentials:");
            Console.WriteLine("  1. Copy .env.example to .env");
            Console.WriteLine("  2. Add your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
            Console.WriteLine("  3. Ensure your IAM user has bedrock:InvokeModel permissions");
            return 1;
        }

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
        Console.WriteLine("  --repo <path>       Path to the git repository (default: current directory)");
        Console.WriteLine("  --branch <name>     Base branch to diff against (default: main)");
        Console.WriteLine("  --prompt <version>  Prompt version: v1, v2, or v3 (default: v3)");
        Console.WriteLine("  --model <id>        Bedrock model ID (default: Claude 3.5 Haiku)");
        Console.WriteLine("  --help, -h          Show this help message");
    }

    static void PrintSummary(DiffResult parsed)
    {
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("-------------------------------------------------");
        Console.WriteLine("  DIFF SUMMARY");
        Console.WriteLine("-------------------------------------------------");
        Console.ResetColor();
        Console.WriteLine($"  Files changed:  {parsed.Files.Count}");
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"  Additions:      +{parsed.TotalAdditions}");
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"  Deletions:      -{parsed.TotalDeletions}");
        Console.ResetColor();
        Console.WriteLine($"  New files:      {parsed.NewFiles}");
        Console.WriteLine($"  Deleted files:  {parsed.DeletedFiles}");
        Console.WriteLine($"  Modified files: {parsed.ModifiedFiles}");
        Console.WriteLine();
    }
}
