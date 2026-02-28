# AI PR Reviewer — C# with AWS Bedrock

A 3-part YouTube tutorial series from [CrashBytes](https://crashbytes.com) that builds an AI-powered pull request reviewer using C#, AWS Bedrock, and Claude.

## Tutorial Series

| Part | Branch | What You'll Build |
|------|--------|-------------------|
| **Part 1** — Beginner | `main` | Console app that parses git diffs |
| **Part 2** — Intermediate | `intermediate` | AWS Bedrock integration with iterative prompt engineering |
| **Part 3** — Advanced | `advanced` | CI/CD pipelines for GitHub Actions & GitLab CI |

## Part 2 — AWS Bedrock Integration

This branch (`intermediate`) adds AI-powered code review using AWS Bedrock and Claude. You'll learn iterative prompt engineering by progressing through three prompt versions.

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Git
- AWS account with Bedrock access ([enable model access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) for Claude 3.5 Haiku)
- VS Code + [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit) (recommended)

**Install .NET 8 on macOS:**

```bash
brew install dotnet@8
```

### AWS Setup

1. Go to AWS Console → Bedrock → Model Access
2. Request access to **Anthropic Claude 3.5 Haiku**
3. Create an IAM user with `bedrock:InvokeModel` permissions
4. Note down your Access Key ID and Secret Access Key

### Quick Start

```bash
git clone https://github.com/CrashBytes/ByteSizedExamples.git
cd ByteSizedExamples/ai-pr-reviewer-csharp
git checkout intermediate

# Configure AWS credentials
cp .env.example .env
# Edit .env with your AWS credentials

# Build and run
dotnet restore
dotnet build
```

### Usage

```bash
# Review with default settings (V3 prompt, Claude 3.5 Haiku)
dotnet run -- --repo /path/to/your/repo --branch main

# Try different prompt versions
dotnet run -- --repo /path/to/repo --prompt v1    # Basic feedback
dotnet run -- --repo /path/to/repo --prompt v2    # Categorized markdown
dotnet run -- --repo /path/to/repo --prompt v3    # Structured JSON output

# Use a different model
dotnet run -- --model us.anthropic.claude-3-sonnet-20240229-v1:0
```

### CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `--repo <path>` | Path to the git repository | Current directory |
| `--branch <name>` | Base branch to diff against | `main` |
| `--prompt <version>` | Prompt version: `v1`, `v2`, or `v3` | `v3` |
| `--model <id>` | AWS Bedrock model ID | Claude 3.5 Haiku |
| `--help`, `-h` | Show help message | — |

### Prompt Versions

| Version | Style | Output Format |
|---------|-------|---------------|
| **V1** | Basic | Free-form text feedback |
| **V2** | Structured | Categorized markdown (Bugs, Security, Style, Performance) |
| **V3** | Production | JSON array with file, line, severity, category, message |

### Project Structure

```
ai-pr-reviewer-csharp/
├── AiPrReviewer.csproj    # Project file with NuGet dependencies
├── Program.cs             # CLI entry point and orchestration
├── DiffParser.cs          # Git diff capture and parsing
├── BedrockClient.cs       # AWS Bedrock Converse API wrapper
├── Models/
│   ├── DiffResult.cs      # Parsed diff data model
│   └── ReviewResult.cs    # AI review response model
└── Prompts/
    ├── V1-BasicPrompt.txt
    ├── V2-StructuredPrompt.txt
    └── V3-ProductionPrompt.txt
```

### What You'll Learn

- Integrating with AWS Bedrock using the .NET SDK
- Using the Converse API for model-agnostic AI calls
- Iterative prompt engineering (basic → structured → production)
- Loading environment variables with DotNetEnv
- Handling token limits and large diffs
- Structured JSON output from LLMs

### Next Steps

Ready for Part 3? Check out the `advanced` branch to add CI/CD integration:

```bash
git checkout advanced
```

## License

MIT — see [LICENSE](./LICENSE)
