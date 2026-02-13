#!/bin/bash
# GitHub Labels Setup Script
# Creates all repository labels for ai-token-cost-tracker-2026

echo "🏷️  Setting up GitHub labels..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "Install it first:"
    echo "  macOS:    brew install gh"
    echo "  Windows:  winget install --id GitHub.cli"
    echo "  Linux:    See https://cli.github.com/manual/installation"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"
echo ""

# Function to create label
create_label() {
    local name=$1
    local color=$2
    local description=$3
    
    # Check if label exists
    if gh label list | grep -q "^$name"; then
        echo "⏭️  Label '$name' already exists"
    else
        gh label create "$name" --color "$color" --description "$description"
        echo "✅ Created label: $name"
    fi
}

echo "Creating labels..."
echo ""

# Bug & Issue Labels
create_label "bug" "d73a4a" "Something isn't working"
create_label "critical" "b60205" "Critical bug requiring immediate attention"
create_label "security" "ee0701" "Security vulnerability"
create_label "regression" "d93f0b" "Previously working feature now broken"

# Feature & Enhancement Labels
create_label "enhancement" "a2eeef" "New feature or request"
create_label "feature" "0075ca" "Major new feature"
create_label "improvement" "84b6eb" "Enhancement to existing feature"
create_label "performance" "c5def5" "Performance improvements"

# Documentation Labels
create_label "documentation" "0075ca" "Documentation improvements"
create_label "tutorial" "1d76db" "Tutorial updates or additions"
create_label "examples" "5319e7" "Example code or demos"

# Testing Labels
create_label "testing" "bfd4f2" "Testing related changes"
create_label "unit-tests" "d4c5f9" "Unit test additions/fixes"
create_label "integration-tests" "c2e0c6" "Integration test work"
create_label "coverage" "0e8a16" "Test coverage improvements"

# Chrome Extension Specific
create_label "chrome-extension" "fbca04" "Chrome extension specific"
create_label "manifest-v3" "fef2c0" "Manifest V3 related"
create_label "popup" "ff9800" "Popup UI changes"
create_label "options-page" "ff6f00" "Options/settings page"
create_label "background" "5c2d91" "Background script changes"
create_label "storage" "7057ff" "Chrome storage related"
create_label "permissions" "e99695" "Chrome permissions"

# AI Provider Labels
create_label "openai" "10a37f" "OpenAI specific"
create_label "anthropic" "d97757" "Anthropic/Claude specific"
create_label "google-ai" "4285f4" "Google AI/Gemini specific"
create_label "pricing" "fbca04" "Pricing table updates"
create_label "token-counting" "bfdadc" "Token counting logic"

# Code Quality
create_label "refactor" "fbca04" "Code refactoring"
create_label "dependencies" "0366d6" "Dependency updates"
create_label "build" "1d76db" "Build system changes"
create_label "rollup" "ff6333" "Rollup bundler related"

# Community Labels
create_label "good-first-issue" "7057ff" "Good for newcomers"
create_label "help-wanted" "008672" "Extra attention needed"
create_label "question" "d876e3" "Further information requested"
create_label "duplicate" "cfd3d7" "Duplicate issue/PR"
create_label "wontfix" "ffffff" "Will not be worked on"
create_label "invalid" "e4e669" "Invalid issue"

# Priority Labels
create_label "priority-high" "d93f0b" "High priority"
create_label "priority-medium" "fbca04" "Medium priority"
create_label "priority-low" "bfdadc" "Low priority"

# Status Labels
create_label "in-progress" "ededed" "Work in progress"
create_label "blocked" "b60205" "Blocked by another issue"
create_label "ready-for-review" "0e8a16" "Ready for code review"
create_label "needs-testing" "fef2c0" "Needs manual testing"

echo ""
echo "✅ Label setup complete!"
echo ""
echo "View labels at: https://github.com/CrashBytes/ai-token-cost-tracker-2026/labels"
