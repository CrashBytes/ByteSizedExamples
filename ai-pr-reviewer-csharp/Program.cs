using System.Text.Json;
using DotNetEnv;
using AiPrReviewer.Platforms;
using AiPrReviewer.Services;

namespace AiPrReviewer;

class Program
{
    static async Task<int> Main(string[] args)
    {
        var repoPath = GetArgValue(args, "--repo") ?? Directory.GetCurrentDirectory();
        var branch = GetArgValue(args, "--branch") ?? "main";
        var promptVersion = GetArgValue(args, "--prompt") ?? "v3";
        var modelId = GetArgValue(args, "--model");
        var platform = GetArgValue(args, "--platform");

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
        Console.WriteLine("  Part 3: CI/CD Integration");
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
        Console.WriteLine($"Platform:       {platform ?? "console"}");
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

        // Chunk large diffs
        var tokenManager = new TokenManager();
        var rateLimiter = new RateLimiter();
        var chunks = tokenManager.ChunkDiff(parsed.RawDiff);

        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("-------------------------------------------------");
        Console.WriteLine("  AI CODE REVIEW");
        Console.WriteLine("-------------------------------------------------");
        Console.ResetColor();
        Console.WriteLine();

        if (chunks.Count > 1)
            Console.WriteLine($"Large diff detected — split into {chunks.Count} chunks.");

        Console.WriteLine("Sending diff to AWS Bedrock...");
        Console.WriteLine();

        try
        {
            var bedrock = new BedrockClient();
            var allResponses = new List<string>();

            for (int i = 0; i < chunks.Count; i++)
            {
                if (chunks.Count > 1)
                    Console.WriteLine($"Processing chunk {i + 1}/{chunks.Count}...");

                await rateLimiter.WaitAsync();
                var review = await bedrock.ReviewDiffAsync(chunks[i], promptVersion, modelId);

                Console.WriteLine($"  Input tokens:  {review.InputTokens:N0}");
                Console.WriteLine($"  Output tokens: {review.OutputTokens:N0}");
                allResponses.Add(review.RawResponse);
            }

            var fullReview = string.Join("\n\n", allResponses);

            // Post to platform if specified
            if (platform != null)
            {
                await PostToPlatform(platform, fullReview, promptVersion);
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine();
                Console.WriteLine("Review complete!");
                Console.ResetColor();
                Console.WriteLine();
                Console.WriteLine("-------------------------------------------------");
                Console.WriteLine();
                Console.WriteLine(fullReview);
                Console.WriteLine();
            }
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"Error: {ex.Message}");
            Console.ResetColor();
            return 1;
        }

        return 0;
    }

    static async Task PostToPlatform(string platformName, string review, string promptVersion)
    {
        IPlatform target = platformName.ToLower() switch
        {
            "github" => new GitHubPlatform(),
            "gitlab" => new GitLabPlatform(),
            _ => throw new ArgumentException($"Unknown platform: {platformName}. Use 'github' or 'gitlab'.")
        };

        Console.WriteLine($"Posting review to {platformName}...");

        // For V3 (JSON), try to post inline comments
        if (promptVersion == "v3")
        {
            try
            {
                var items = JsonSerializer.Deserialize<List<ReviewItem>>(review);
                if (items != null && items.Count > 0)
                {
                    foreach (var item in items)
                    {
                        if (item.Line > 0 && !string.IsNullOrEmpty(item.File))
                        {
                            var comment = $"**[{item.Severity?.ToUpper()}]** {item.Category}\n\n{item.Message}";
                            if (!string.IsNullOrEmpty(item.Suggestion))
                                comment += $"\n\n**Suggestion:** {item.Suggestion}";

                            await target.PostReviewCommentAsync(item.File, item.Line, comment);
                        }
                    }

                    // Also post a summary
                    var criticalCount = items.Count(i => i.Severity == "critical");
                    var warningCount = items.Count(i => i.Severity == "warning");
                    var infoCount = items.Count(i => i.Severity == "info");

                    var summary = "## AI PR Review — CrashBytes\n\n"
                        + $"Found **{items.Count}** items: "
                        + $"🔴 {criticalCount} critical, ⚠️ {warningCount} warnings, ℹ️ {infoCount} info\n\n"
                        + "*Powered by AWS Bedrock + Claude*";

                    await target.PostSummaryCommentAsync(summary);
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine($"Posted {items.Count} inline comments and summary to {platformName}.");
                    Console.ResetColor();
                    return;
                }
            }
            catch (JsonException)
            {
                // Fall through to summary comment
            }
        }

        // Fallback: post as summary comment
        var fallbackSummary = $"## AI PR Review — CrashBytes\n\n{review}\n\n*Powered by AWS Bedrock + Claude*";
        await target.PostSummaryCommentAsync(fallbackSummary);
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"Posted review summary to {platformName}.");
        Console.ResetColor();
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
        Console.WriteLine("  --repo <path>          Path to the git repository (default: current directory)");
        Console.WriteLine("  --branch <name>        Base branch to diff against (default: main)");
        Console.WriteLine("  --prompt <version>     Prompt version: v1, v2, or v3 (default: v3)");
        Console.WriteLine("  --model <id>           Bedrock model ID (default: Claude 3.5 Haiku)");
        Console.WriteLine("  --platform <name>      Post to platform: github or gitlab (default: console)");
        Console.WriteLine("  --help, -h             Show this help message");
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

// Internal model for deserializing V3 JSON review items
file class ReviewItem
{
    public string? File { get; set; }
    public int Line { get; set; }
    public string? Severity { get; set; }
    public string? Category { get; set; }
    public string? Message { get; set; }
    public string? Suggestion { get; set; }
}
