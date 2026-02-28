namespace AiPrReviewer;

public class ReviewResult
{
    public string RawResponse { get; set; } = "";
    public string ModelId { get; set; } = "";
    public string PromptVersion { get; set; } = "";
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
}
