using Xunit;
using AiPrReviewer.Services;

namespace AiPrReviewer.Tests;

public class TokenManagerTests
{
    [Fact]
    public void EstimateTokens_EmptyString_ReturnsZero()
    {
        var tm = new TokenManager();
        Assert.Equal(0, tm.EstimateTokens(""));
    }

    [Fact]
    public void EstimateTokens_NullString_ReturnsZero()
    {
        var tm = new TokenManager();
        Assert.Equal(0, tm.EstimateTokens(null!));
    }

    [Fact]
    public void EstimateTokens_ReturnsPositiveValue()
    {
        var tm = new TokenManager();
        var tokens = tm.EstimateTokens("Hello, world! This is a test string.");
        Assert.True(tokens > 0);
    }

    [Fact]
    public void ExceedsLimit_ShortText_ReturnsFalse()
    {
        var tm = new TokenManager(100000);
        Assert.False(tm.ExceedsLimit("short text"));
    }

    [Fact]
    public void ExceedsLimit_VeryLongText_ReturnsTrue()
    {
        var tm = new TokenManager(10);
        var longText = new string('a', 1000);
        Assert.True(tm.ExceedsLimit(longText));
    }

    [Fact]
    public void ChunkDiff_SmallDiff_ReturnsSingleChunk()
    {
        var tm = new TokenManager();
        var diff = "diff --git a/file.cs b/file.cs\n+hello\n";
        var chunks = tm.ChunkDiff(diff);
        Assert.Single(chunks);
    }

    [Fact]
    public void ChunkDiff_LargeDiff_ReturnsMultipleChunks()
    {
        var tm = new TokenManager();
        var fileDiff = "diff --git a/file{0}.cs b/file{0}.cs\n" + new string('+', 50000) + "\n";

        var largeDiff = "";
        for (int i = 0; i < 5; i++)
            largeDiff += string.Format(fileDiff, i);

        var chunks = tm.ChunkDiff(largeDiff, 40000);
        Assert.True(chunks.Count > 1);
    }

    [Fact]
    public void ChunkDiff_EmptyDiff_ReturnsSingleEmptyChunk()
    {
        var tm = new TokenManager();
        var chunks = tm.ChunkDiff("");
        Assert.Empty(chunks);
    }
}
