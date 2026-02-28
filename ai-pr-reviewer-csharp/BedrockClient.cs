using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Amazon;

namespace AiPrReviewer;

public class BedrockClient
{
    private readonly AmazonBedrockRuntimeClient _client;
    private readonly string _promptsDir;

    public const string DefaultModel = "us.anthropic.claude-3-5-haiku-20241022-v1:0";

    public BedrockClient(string? region = null)
    {
        var awsRegion = region ?? Environment.GetEnvironmentVariable("AWS_REGION") ?? "us-east-1";
        _client = new AmazonBedrockRuntimeClient(RegionEndpoint.GetBySystemName(awsRegion));

        // Locate Prompts directory relative to the source file
        _promptsDir = FindPromptsDirectory();
    }

    public async Task<ReviewResult> ReviewDiffAsync(string diff, string promptVersion = "v3", string? modelId = null)
    {
        var model = modelId ?? DefaultModel;
        var systemPrompt = LoadPrompt(promptVersion);
        var truncatedDiff = DiffParser.TruncateDiff(diff);

        var wasTruncated = truncatedDiff.Length < diff.Length;
        var userMessage = wasTruncated
            ? $"⚠️ Note: This diff was truncated from {diff.Length:N0} to {truncatedDiff.Length:N0} characters due to size limits.\n\n{truncatedDiff}"
            : truncatedDiff;

        var request = new ConverseRequest
        {
            ModelId = model,
            System = new List<SystemContentBlock>
            {
                new() { Text = systemPrompt }
            },
            Messages = new List<Message>
            {
                new()
                {
                    Role = ConversationRole.User,
                    Content = new List<ContentBlock>
                    {
                        new() { Text = userMessage }
                    }
                }
            },
            InferenceConfig = new InferenceConfiguration
            {
                MaxTokens = 4096,
                Temperature = 0.2F
            }
        };

        var response = await _client.ConverseAsync(request);

        var responseText = "";
        if (response.Output?.Message?.Content != null)
        {
            responseText = string.Join("\n", response.Output.Message.Content
                .Where(c => c.Text != null)
                .Select(c => c.Text));
        }

        return new ReviewResult
        {
            RawResponse = responseText,
            ModelId = model,
            PromptVersion = promptVersion,
            InputTokens = response.Usage?.InputTokens ?? 0,
            OutputTokens = response.Usage?.OutputTokens ?? 0
        };
    }

    private string LoadPrompt(string version)
    {
        var fileName = version.ToLower() switch
        {
            "v1" => "V1-BasicPrompt.txt",
            "v2" => "V2-StructuredPrompt.txt",
            "v3" => "V3-ProductionPrompt.txt",
            _ => throw new ArgumentException($"Unknown prompt version: {version}. Use v1, v2, or v3.")
        };

        var path = Path.Combine(_promptsDir, fileName);
        if (!File.Exists(path))
            throw new FileNotFoundException($"Prompt file not found: {path}");

        return File.ReadAllText(path);
    }

    private static string FindPromptsDirectory()
    {
        // Walk up from the current directory looking for the Prompts folder
        var dir = AppContext.BaseDirectory;
        for (int i = 0; i < 6; i++)
        {
            var candidate = Path.Combine(dir, "Prompts");
            if (Directory.Exists(candidate))
                return candidate;
            dir = Path.GetDirectoryName(dir) ?? dir;
        }

        // Fallback: try current working directory
        var cwdCandidate = Path.Combine(Directory.GetCurrentDirectory(), "Prompts");
        if (Directory.Exists(cwdCandidate))
            return cwdCandidate;

        throw new DirectoryNotFoundException("Could not find Prompts directory.");
    }
}
