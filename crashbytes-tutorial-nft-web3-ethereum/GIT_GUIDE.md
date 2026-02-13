# Git Quick Reference

Quick reference for common Git operations with this repository.

## Initial Setup

### 1. Run the Setup Script

```bash
cd /Users/blackholesoftware/github/crashbytes-tutorial-nft-web3-ethereum
chmod +x git-setup.sh
./git-setup.sh
```

This will:
- Initialize git repository
- Add all files
- Create initial commit with detailed message

### 2. Create GitHub Repository

Go to https://github.com/new and create a new repository named:
```
crashbytes-tutorial-nft-web3-ethereum
```

**Important**: Do NOT initialize with README, .gitignore, or license (we already have these)

### 3. Connect to GitHub

```bash
# Rename branch to main (if needed)
git branch -M main

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/crashbytes-tutorial-nft-web3-ethereum.git

# Push to GitHub
git push -u origin main
```

## Common Git Operations

### Check Status

```bash
git status
```

### Add Files

```bash
# Add specific file
git add path/to/file

# Add all changes
git add .

# Add only modified files (not new files)
git add -u
```

### Commit Changes

```bash
# Commit with message
git commit -m "Your commit message"

# Commit all modified files with message
git commit -am "Your commit message"

# Amend last commit
git commit --amend
```

### View History

```bash
# View commit history
git log

# View compact history
git log --oneline

# View last 5 commits
git log -5

# View file changes
git log --stat

# View commits with diffs
git log -p
```

### Push Changes

```bash
# Push to main branch
git push origin main

# Push and set upstream
git push -u origin main

# Force push (use with caution)
git push -f origin main
```

### Pull Changes

```bash
# Pull from main branch
git pull origin main

# Pull with rebase
git pull --rebase origin main
```

### Branches

```bash
# List branches
git branch

# Create new branch
git branch feature-name

# Switch to branch
git checkout feature-name

# Create and switch to new branch
git checkout -b feature-name

# Delete branch
git branch -d feature-name

# Push branch to remote
git push origin feature-name
```

### Undo Changes

```bash
# Discard changes in file
git checkout -- path/to/file

# Unstage file
git reset HEAD path/to/file

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert a commit
git revert commit-hash
```

### Stash Changes

```bash
# Stash uncommitted changes
git stash

# Stash with message
git stash save "Work in progress"

# List stashes
git stash list

# Apply most recent stash
git stash apply

# Apply specific stash
git stash apply stash@{0}

# Apply and remove stash
git stash pop

# Remove stash
git stash drop stash@{0}
```

### Remote Operations

```bash
# List remotes
git remote -v

# Add remote
git remote add origin URL

# Change remote URL
git remote set-url origin NEW_URL

# Remove remote
git remote remove origin

# Fetch from remote
git fetch origin

# Fetch all remotes
git fetch --all
```

### Tags

```bash
# Create tag
git tag v1.0.0

# Create annotated tag
git tag -a v1.0.0 -m "Version 1.0.0"

# List tags
git tag

# Push tags to remote
git push origin v1.0.0

# Push all tags
git push --tags

# Delete tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0
```

## Project-Specific Workflows

### Making Changes to Smart Contract

```bash
# Create feature branch
git checkout -b feature/new-contract-function

# Make your changes to contracts/CrashBytesNFT.sol
# Write tests in test/

# Run tests
npm test

# Commit changes
git add contracts/ test/
git commit -m "Add new contract function with tests"

# Push branch
git push origin feature/new-contract-function
```

### Updating Frontend

```bash
# Create feature branch
git checkout -b feature/improve-ui

# Make changes to frontend/
# Test locally
cd frontend && npm start

# Commit changes
git add frontend/
git commit -m "Improve NFT gallery UI layout"

# Push branch
git push origin feature/improve-ui
```

### Updating Documentation

```bash
# Make changes to README.md, CHANGELOG.md, etc.

# Commit
git add *.md
git commit -m "Update documentation with new examples"

# Push
git push origin main
```

### Creating a Release

```bash
# Update CHANGELOG.md with release notes

# Commit changes
git add CHANGELOG.md
git commit -m "Prepare v1.1.0 release"

# Create tag
git tag -a v1.1.0 -m "Release version 1.1.0

Features:
- Feature 1
- Feature 2

Fixes:
- Bug fix 1
- Bug fix 2"

# Push commits and tags
git push origin main
git push origin v1.1.0
```

## Git Best Practices

### Commit Messages

Good commit message format:
```
Short summary (50 chars or less)

More detailed explanation if needed. Wrap at 72 characters.
Explain what and why, not how.

- Bullet points are okay
- Use present tense: "Add feature" not "Added feature"
- Reference issues: "Fixes #123"
```

Examples:
```bash
git commit -m "Fix gas optimization in batch minting"

git commit -m "Add whitelist functionality

Implement Merkle tree-based whitelist for presale.
Includes contract function, tests, and frontend integration.

Fixes #45"
```

### Branching Strategy

```
main (or master)
├── develop
├── feature/new-feature
├── feature/another-feature
├── hotfix/critical-bug
└── release/v1.1.0
```

### Before Pushing

```bash
# Always check status
git status

# Review changes
git diff

# Run tests
npm test

# Compile contracts
npm run compile

# Then push
git push origin main
```

## Troubleshooting

### Merge Conflicts

```bash
# Pull latest changes
git pull origin main

# Fix conflicts in files (look for <<<<<<, ======, >>>>>>)
# Edit files to resolve

# After resolving
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Accidentally Committed Sensitive Data

```bash
# Remove from last commit
git rm --cached .env
git commit --amend -m "Remove .env file"

# If already pushed
git push -f origin main

# For older commits, use git filter-branch or BFG Repo-Cleaner
```

### Reset to Remote State

```bash
# Discard all local changes
git fetch origin
git reset --hard origin/main
```

## GitHub Integration

### Create Pull Request

1. Push your branch: `git push origin feature-name`
2. Go to GitHub repository
3. Click "Pull requests" → "New pull request"
4. Select your branch
5. Fill in title and description
6. Click "Create pull request"

### Sync Fork

```bash
# Add upstream remote
git remote add upstream https://github.com/CrashBytes/crashbytes-tutorial-nft-web3-ethereum.git

# Fetch upstream
git fetch upstream

# Merge upstream changes
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

## Additional Resources

- Git Documentation: https://git-scm.com/doc
- GitHub Guides: https://guides.github.com/
- Pro Git Book: https://git-scm.com/book/en/v2
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf

## Getting Help

```bash
# Get help for any command
git help <command>

# Example
git help commit
```

---

For project-specific questions, see CONTRIBUTING.md
