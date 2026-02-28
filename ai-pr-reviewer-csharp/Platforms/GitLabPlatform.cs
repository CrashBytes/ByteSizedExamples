using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AiPrReviewer.Platforms;

public class GitLabPlatform : IPlatform
{
    private readonly HttpClient _http;
    private readonly string _projectId;
    private readonly string _mrIid;
    private readonly string _commitSha;

    public GitLabPlatform()
    {
        var token = Environment.GetEnvironmentVariable("GITLAB_TOKEN")
            ?? throw new InvalidOperationException("GITLAB_TOKEN environment variable is required.");

        _projectId = Environment.GetEnvironmentVariable("CI_PROJECT_ID")
            ?? throw new InvalidOperationException("CI_PROJECT_ID environment variable is required.");

        _mrIid = Environment.GetEnvironmentVariable("CI_MERGE_REQUEST_IID")
            ?? throw new InvalidOperationException("CI_MERGE_REQUEST_IID environment variable is required.");

        _commitSha = Environment.GetEnvironmentVariable("CI_COMMIT_SHA") ?? "";

        var baseUrl = Environment.GetEnvironmentVariable("CI_SERVER_URL") ?? "https://gitlab.com";

        _http = new HttpClient
        {
            BaseAddress = new Uri($"{baseUrl}/api/v4/")
        };
        _http.DefaultRequestHeaders.Add("PRIVATE-TOKEN", token);
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task PostReviewCommentAsync(string file, int line, string comment)
    {
        try
        {
            var payload = new
            {
                body = comment,
                position = new
                {
                    base_sha = _commitSha,
                    start_sha = _commitSha,
                    head_sha = _commitSha,
                    position_type = "text",
                    new_path = file,
                    new_line = line
                }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync(
                $"projects/{_projectId}/merge_requests/{_mrIid}/discussions",
                content);

            response.EnsureSuccessStatusCode();
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
        var payload = new { body = summary };
        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _http.PostAsync(
            $"projects/{_projectId}/merge_requests/{_mrIid}/notes",
            content);

        response.EnsureSuccessStatusCode();
    }
}
