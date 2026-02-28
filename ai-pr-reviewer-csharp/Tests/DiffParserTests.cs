using Xunit;

namespace AiPrReviewer.Tests;

public class DiffParserTests
{
    private const string SampleDiff = @"diff --git a/src/Program.cs b/src/Program.cs
--- a/src/Program.cs
+++ b/src/Program.cs
@@ -1,5 +1,7 @@
 using System;
+using System.Collections.Generic;

 namespace MyApp
 {
+    // Added a new class
     class Program
@@ -10,3 +12,4 @@
         Console.WriteLine(""Hello"");
+        Console.WriteLine(""World"");
     }
 }
diff --git a/src/NewFile.cs b/src/NewFile.cs
--- /dev/null
+++ b/src/NewFile.cs
@@ -0,0 +1,5 @@
+namespace MyApp;
+
+public class NewFile
+{
+}
diff --git a/src/Deleted.cs b/src/Deleted.cs
--- a/src/Deleted.cs
+++ /dev/null
@@ -1,3 +0,0 @@
-namespace MyApp;
-
-public class Deleted { }";

    [Fact]
    public void Parse_ExtractsCorrectFileCount()
    {
        var result = DiffParser.Parse(SampleDiff);
        Assert.Equal(3, result.Files.Count);
    }

    [Fact]
    public void Parse_IdentifiesNewFile()
    {
        var result = DiffParser.Parse(SampleDiff);
        var newFile = result.Files.First(f => f.NewPath == "src/NewFile.cs");
        Assert.True(newFile.IsNew);
        Assert.False(newFile.IsDeleted);
    }

    [Fact]
    public void Parse_IdentifiesDeletedFile()
    {
        var result = DiffParser.Parse(SampleDiff);
        var deleted = result.Files.First(f => f.OldPath == "src/Deleted.cs");
        Assert.True(deleted.IsDeleted);
        Assert.False(deleted.IsNew);
    }

    [Fact]
    public void Parse_CountsAdditionsAndDeletions()
    {
        var result = DiffParser.Parse(SampleDiff);
        var modified = result.Files.First(f => f.NewPath == "src/Program.cs");
        Assert.Equal(3, modified.Additions);
        Assert.Equal(0, modified.Deletions);
    }

    [Fact]
    public void Parse_CountsHunks()
    {
        var result = DiffParser.Parse(SampleDiff);
        var modified = result.Files.First(f => f.NewPath == "src/Program.cs");
        Assert.Equal(2, modified.HunkCount);
    }

    [Fact]
    public void Parse_CalculatesTotals()
    {
        var result = DiffParser.Parse(SampleDiff);
        Assert.Equal(8, result.TotalAdditions);
        Assert.Equal(3, result.TotalDeletions);
        Assert.Equal(1, result.NewFiles);
        Assert.Equal(1, result.DeletedFiles);
        Assert.Equal(1, result.ModifiedFiles);
    }

    [Fact]
    public void Parse_EmptyDiff_ReturnsEmptyResult()
    {
        var result = DiffParser.Parse("");
        Assert.Empty(result.Files);
        Assert.Equal(0, result.TotalAdditions);
    }

    [Fact]
    public void TruncateDiff_ShortDiff_ReturnsUnchanged()
    {
        var shortDiff = "some short diff";
        Assert.Equal(shortDiff, DiffParser.TruncateDiff(shortDiff));
    }

    [Fact]
    public void TruncateDiff_LongDiff_Truncates()
    {
        var longDiff = new string('x', 60000) + "\nmore content";
        var truncated = DiffParser.TruncateDiff(longDiff, 50000);
        Assert.True(truncated.Length <= 50100); // Allow for the truncation message
        Assert.Contains("[... diff truncated due to size ...]", truncated);
    }
}
