# AI PR Reviewer — C# with AWS Bedrock

A 3-part YouTube tutorial series from [CrashBytes](https://crashbytes.com) that builds an AI-powered pull request reviewer using C#, AWS Bedrock, and Claude.

## Tutorial Series

| Part | Branch | What You'll Build |
|------|--------|-------------------|
| **Part 1** — Beginner | `main` | Console app that parses git diffs |
| **Part 2** — Intermediate | `intermediate` | AWS Bedrock integration with iterative prompt engineering |
| **Part 3** — Advanced | `advanced` | CI/CD pipelines for GitHub Actions & GitLab CI |

## Part 1 — Getting Started

This branch (`main`) contains the beginner tutorial. You'll build a C# console app that captures and parses git diffs — no external packages required.

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Git
- VS Code + [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit) (recommended)

**Install .NET 8 on macOS:**

```bash
brew install dotnet@8
```

**Verify installation:**

```bash
dotnet --version
```

### Quick Start

```bash
git clone https://github.com/CrashBytes/ByteSizedExamples.git
cd ByteSizedExamples/ai-pr-reviewer-csharp
dotnet build
```

### Usage

Run from inside any git repository:

```bash
# Analyze current repo against main branch
dotnet run

# Specify a different repo and branch
dotnet run -- --repo /path/to/your/repo --branch develop

# Show help
dotnet run -- --help
```

### CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `--repo <path>` | Path to the git repository | Current directory |
| `--branch <name>` | Base branch to diff against | `main` |
| `--help`, `-h` | Show help message | — |

### Example Output

```
=================================================
  AI PR Reviewer — CrashBytes
  Part 1: Git Diff Analysis
=================================================

Repository: /Users/you/your-project
Base branch: main

-------------------------------------------------
  DIFF SUMMARY
-------------------------------------------------
  Files changed:  3
  Additions:      +47
  Deletions:      -12
  New files:      1
  Deleted files:  0
  Modified files: 2

-------------------------------------------------
  PER-FILE BREAKDOWN
-------------------------------------------------

  File                                          Status     +        -        Hunks
  --------------------------------------------- ---------- -------- -------- ------
  src/Services/UserService.cs                   MODIFIED   +28      -8       2
  src/Models/User.cs                            MODIFIED   +12      -4       1
  tests/UserServiceTests.cs                     NEW        +7       -0       1
```

### What You'll Learn

- Setting up a C# console application with .NET 8
- Running shell commands from C# using `System.Diagnostics.Process`
- Parsing unified diff format (hunks, additions, deletions)
- Building CLI tools with argument parsing
- Structured console output with color formatting

### Next Steps

Ready for Part 2? Check out the `intermediate` branch to add AI-powered code review with AWS Bedrock:

```bash
git checkout intermediate
```

## License

MIT — see [LICENSE](./LICENSE)
