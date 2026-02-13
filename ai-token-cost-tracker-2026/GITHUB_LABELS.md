# GitHub Repository Labels

This file defines labels for issues and pull requests. Use GitHub CLI or web interface to apply.

## Bug & Issue Labels

- **bug** - Something isn't working (color: #d73a4a)
- **critical** - Critical bug requiring immediate attention (color: #b60205)
- **security** - Security vulnerability (color: #ee0701)
- **regression** - Previously working feature now broken (color: #d93f0b)

## Feature & Enhancement Labels

- **enhancement** - New feature or request (color: #a2eeef)
- **feature** - Major new feature (color: #0075ca)
- **improvement** - Enhancement to existing feature (color: #84b6eb)
- **performance** - Performance improvements (color: #c5def5)

## Documentation Labels

- **documentation** - Documentation improvements (color: #0075ca)
- **tutorial** - Tutorial updates or additions (color: #1d76db)
- **examples** - Example code or demos (color: #5319e7)

## Testing Labels

- **testing** - Testing related changes (color: #bfd4f2)
- **unit-tests** - Unit test additions/fixes (color: #d4c5f9)
- **integration-tests** - Integration test work (color: #c2e0c6)
- **coverage** - Test coverage improvements (color: #0e8a16)

## Chrome Extension Specific

- **chrome-extension** - Chrome extension specific (color: #fbca04)
- **manifest-v3** - Manifest V3 related (color: #fef2c0)
- **popup** - Popup UI changes (color: #ff9800)
- **options-page** - Options/settings page (color: #ff6f00)
- **background** - Background script changes (color: #5c2d91)
- **storage** - Chrome storage related (color: #7057ff)
- **permissions** - Chrome permissions (color: #e99695)

## AI Provider Labels

- **openai** - OpenAI specific (color: #10a37f)
- **anthropic** - Anthropic/Claude specific (color: #d97757)
- **google-ai** - Google AI/Gemini specific (color: #4285f4)
- **pricing** - Pricing table updates (color: #fbca04)
- **token-counting** - Token counting logic (color: #bfdadc)

## Code Quality

- **refactor** - Code refactoring (color: #fbca04)
- **dependencies** - Dependency updates (color: #0366d6)
- **build** - Build system changes (color: #1d76db)
- **rollup** - Rollup bundler related (color: #ff6333)

## Community Labels

- **good-first-issue** - Good for newcomers (color: #7057ff)
- **help-wanted** - Extra attention needed (color: #008672)
- **question** - Further information requested (color: #d876e3)
- **duplicate** - Duplicate issue/PR (color: #cfd3d7)
- **wontfix** - Will not be worked on (color: #ffffff)
- **invalid** - Invalid issue (color: #e4e669)

## Priority Labels

- **priority-high** - High priority (color: #d93f0b)
- **priority-medium** - Medium priority (color: #fbca04)
- **priority-low** - Low priority (color: #bfdadc)

## Status Labels

- **in-progress** - Work in progress (color: #ededed)
- **blocked** - Blocked by another issue (color: #b60205)
- **ready-for-review** - Ready for code review (color: #0e8a16)
- **needs-testing** - Needs manual testing (color: #fef2c0)

---

## Quick Setup with GitHub CLI

```bash
# Install GitHub CLI if not installed
# brew install gh  # macOS
# winget install --id GitHub.cli  # Windows

# Create labels
gh label create "bug" --color "d73a4a" --description "Something isn't working"
gh label create "critical" --color "b60205" --description "Critical bug requiring immediate attention"
gh label create "security" --color "ee0701" --description "Security vulnerability"
gh label create "enhancement" --color "a2eeef" --description "New feature or request"
gh label create "feature" --color "0075ca" --description "Major new feature"
gh label create "documentation" --color "0075ca" --description "Documentation improvements"
gh label create "testing" --color "bfd4f2" --description "Testing related changes"
gh label create "coverage" --color "0e8a16" --description "Test coverage improvements"
gh label create "chrome-extension" --color "fbca04" --description "Chrome extension specific"
gh label create "openai" --color "10a37f" --description "OpenAI specific"
gh label create "anthropic" --color "d97757" --description "Anthropic/Claude specific"
gh label create "google-ai" --color "4285f4" --description "Google AI/Gemini specific"
gh label create "good-first-issue" --color "7057ff" --description "Good for newcomers"
gh label create "help-wanted" --color "008672" --description "Extra attention needed"

# List all labels
gh label list
```

## Manual Setup via GitHub Web Interface

1. Go to https://github.com/CrashBytes/ai-token-cost-tracker-2026/labels
2. Click "New label"
3. Add name, description, and color from the list above
4. Repeat for all desired labels

---

## Using Labels

### Issue Examples

```markdown
# Bug Report
Labels: bug, chrome-extension, priority-high

# Feature Request
Labels: enhancement, options-page, good-first-issue

# OpenAI Integration Issue
Labels: bug, openai, token-counting

# Documentation Update
Labels: documentation, tutorial
```

### Pull Request Examples

```markdown
# Add Anthropic Support
Labels: feature, anthropic, testing

# Fix Popup Display Bug
Labels: bug, popup, ready-for-review

# Update Pricing Tables
Labels: pricing, documentation
```
