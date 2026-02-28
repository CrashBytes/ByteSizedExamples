# AI PR Reviewer — C# with AWS Bedrock

A 3-part YouTube tutorial series from [CrashBytes](https://crashbytes.com) that builds an AI-powered pull request reviewer using C#, AWS Bedrock, and Claude.

## Tutorial Series

| Part | Branch | What You'll Build |
|------|--------|-------------------|
| **Part 1** — Beginner | `main` | Console app that parses git diffs |
| **Part 2** — Intermediate | `intermediate` | AWS Bedrock integration with iterative prompt engineering |
| **Part 3** — Advanced | `advanced` | CI/CD pipelines for GitHub Actions & GitLab CI |

## Part 3 — CI/CD Integration

This branch (`advanced`) adds automated PR review pipelines. Reviews run automatically when pull requests are opened, posting inline comments directly on your code.

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Git
- AWS account with Bedrock access for Claude 3.5 Haiku
- GitHub or GitLab repository
- VS Code + [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit) (recommended)

### Quick Start

```bash
git clone https://github.com/CrashBytes/ByteSizedExamples.git
cd ByteSizedExamples/ai-pr-reviewer-csharp
git checkout advanced

# Configure credentials
cp .env.example .env
# Edit .env with your AWS credentials

# Build and test
dotnet restore
dotnet build
dotnet test Tests/
```

### Usage

```bash
# Console output (default)
dotnet run -- --repo /path/to/repo --branch main

# Post to GitHub PR
dotnet run -- --branch main --platform github

# Post to GitLab MR
dotnet run -- --branch main --platform gitlab
```

### CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `--repo <path>` | Path to the git repository | Current directory |
| `--branch <name>` | Base branch to diff against | `main` |
| `--prompt <version>` | Prompt version: `v1`, `v2`, or `v3` | `v3` |
| `--model <id>` | AWS Bedrock model ID | Claude 3.5 Haiku |
| `--platform <name>` | Post to: `github` or `gitlab` | Console output |
| `--help`, `-h` | Show help message | — |

### GitHub Actions Setup

1. Go to your repo → Settings → Secrets and Variables → Actions
2. Add these secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
3. Copy `.github/workflows/ai-pr-review.yml` to your repo
4. Open a PR — the review runs automatically

### GitLab CI Setup

1. Go to your project → Settings → CI/CD → Variables
2. Add these variables:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `GITLAB_TOKEN` (Project Access Token with `api` scope)
3. Copy `.gitlab-ci.yml` to your repo root
4. Open a merge request — the review runs automatically

### Project Structure

```
ai-pr-reviewer-csharp/
├── AiPrReviewer.csproj          # Project file with NuGet deps
├── Program.cs                   # CLI entry point + orchestration
├── DiffParser.cs                # Git diff capture and parsing
├── BedrockClient.cs             # AWS Bedrock Converse API wrapper
├── Models/
│   ├── DiffResult.cs            # Parsed diff data model
│   └── ReviewResult.cs          # AI review response model
├── Platforms/
│   ├── IPlatform.cs             # Platform interface
│   ├── GitHubPlatform.cs        # GitHub PR comments via Octokit
│   └── GitLabPlatform.cs        # GitLab MR comments via REST API
├── Services/
│   ├── TokenManager.cs          # Token estimation and diff chunking
│   └── RateLimiter.cs           # API rate limiting
├── Prompts/
│   ├── V1-BasicPrompt.txt
│   ├── V2-StructuredPrompt.txt
│   └── V3-ProductionPrompt.txt
├── Tests/
│   ├── Tests.csproj             # xUnit test project
│   ├── DiffParserTests.cs       # Diff parsing unit tests
│   └── TokenManagerTests.cs     # Token management unit tests
├── .github/workflows/
│   └── ai-pr-review.yml         # GitHub Actions workflow
└── .gitlab-ci.yml               # GitLab CI pipeline
```

### Running Tests

```bash
dotnet test Tests/
```

### What You'll Learn

- Building platform abstractions with interfaces
- GitHub API integration with Octokit
- GitLab API integration with HttpClient
- Token counting and diff chunking for large PRs
- Rate limiting for API calls
- GitHub Actions and GitLab CI pipeline configuration
- Unit testing with xUnit

## License

MIT — see [LICENSE](./LICENSE)
