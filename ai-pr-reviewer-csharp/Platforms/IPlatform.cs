namespace AiPrReviewer.Platforms;

public interface IPlatform
{
    Task PostReviewCommentAsync(string file, int line, string comment);
    Task PostSummaryCommentAsync(string summary);
}
