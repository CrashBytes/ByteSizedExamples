namespace AiPrReviewer.Services;

public class TokenManager
{
    // Approximate tokens per character for code (conservative estimate)
    private const double TokensPerChar = 0.3;

    public int MaxTokens { get; }

    public TokenManager(int maxTokens = 100000)
    {
        MaxTokens = maxTokens;
    }

    public int EstimateTokens(string text)
    {
        if (string.IsNullOrEmpty(text))
            return 0;

        return (int)Math.Ceiling(text.Length * TokensPerChar);
    }

    public bool ExceedsLimit(string text)
    {
        return EstimateTokens(text) > MaxTokens;
    }

    public List<string> ChunkDiff(string diff, int maxChunkTokens = 40000)
    {
        var chunks = new List<string>();
        var files = diff.Split("diff --git", StringSplitOptions.RemoveEmptyEntries);

        var currentChunk = "";
        foreach (var file in files)
        {
            var fileContent = "diff --git" + file;
            var combinedTokens = EstimateTokens(currentChunk + fileContent);

            if (combinedTokens > maxChunkTokens && currentChunk.Length > 0)
            {
                chunks.Add(currentChunk);
                currentChunk = fileContent;
            }
            else
            {
                currentChunk += fileContent;
            }
        }

        if (currentChunk.Length > 0)
            chunks.Add(currentChunk);

        return chunks;
    }
}
