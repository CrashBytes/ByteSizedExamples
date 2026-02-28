using Octokit;

namespace AiPrReviewer.Platforms;

public class GitHubPlatform : IPlatform
{
    private readonly GitHubClient _client;
    private readonly string _owner;
    private readonly string _repo;
    private readonly int _prNumber;
    private readonly string _commitSha;

    public GitHubPlatform()
    {
        var token = Environment.GetEnvironmentVariable("GITHUB_TOKEN")
            ?? throw new InvalidOperationException("GITHUB_TOKEN environment variable is required.");

        var repoSlug = Environment.GetEnvironmentVariable("GITHUB_REPOSITORY")
            ?? throw new InvalidOperationException("GITHUB_REPOSITORY environment variable is required.");

        var prRef = Environment.GetEnvironmentVariable("GITHUB_REF") ?? "";
        _commitSha = Environment.GetEnvironmentVariable("GITHUB_SHA") ?? "";

        var parts = repoSlug.Split('/');
        _owner = parts[0];
        _repo = parts[1];

        // Extract PR number from refs/pull/<number>/merge
        if (prRef.StartsWith("refs/pull/") && prRef.EndsWith("/merge"))
        {
            var numberStr = prRef.Replace("refs/pull/", "").Replace("/merge", "");
            _prNumber = int.Parse(numberStr);
        }

        _client = new GitHubClient(new ProductHeaderValue("ai-pr-reviewer"))
        {
            Credentials = new Credentials(token)
        };
    }

    public async Task PostReviewCommentAsync(string file, int line, string comment)
    {
        try
        {
            var reviewComment = new PullRequestReviewCommentCreate(comment, _commitSha, file, line);
            await _client.PullRequest.ReviewComment.Create(_owner, _repo, _prNumber, reviewComment);
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"Warning: Could not post inline comment on {file}:{line} — {ex.Message}");
            Console.ResetColor();
        }
    }

    public async Task PostSummaryCommentAsync(string summary)
    {
        await _client.Issue.Comment.Create(_owner, _repo, _prNumber, summary);
    }
}
