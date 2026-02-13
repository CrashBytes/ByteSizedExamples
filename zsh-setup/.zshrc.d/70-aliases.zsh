# Git aliases
alias gs="git status"
alias gl="git log --oneline --graph --decorate --all"
alias gp="git push"
alias gpl="git pull"
alias gc="git commit -m"
alias gca="git commit -a -m"
alias gco="git checkout"
alias gcb="git checkout -b"
alias gcm="git checkout main"
alias gup="git pull --rebase"
alias gcl="git clone"
alias gclean="git clean -fd"
alias greset="git reset --hard"
alias gdiff="git diff"
alias gdiffc="git diff --cached"
alias gbranch="git branch"
alias gbranches="git branch -a"
alias gshow="git show"
alias gstatus="git status -s"
alias gstash="git stash --include-untracked"
alias gstashp="git stash pop"
alias gstashl="git stash list"

# Prompt management (optional - requires external scripts)
# Uncomment and adjust paths if you have custom prompt scripts:
# alias prompt-gitline="$HOME/.config/shell-scripts/prompt-set.sh gitline"
# alias prompt-minimal="$HOME/.config/shell-scripts/prompt-set.sh minimal"
# alias prompt-twoline="$HOME/.config/shell-scripts/prompt-set.sh twoline"
# alias prompt-theme="$HOME/.config/shell-scripts/prompt-set.sh theme"
# alias prompt-cycle="$HOME/.config/shell-scripts/prompt-cycle.sh"

# Git workflow function: add, commit with message, and push
# Usage: gamf "commit message" [file]
# If no file specified, defaults to . (all files)
gamf() {
    local message="$1"
    local file="${2:-.}"
    
    if [ -z "$message" ]; then
        echo "Error: Commit message required"
        echo "Usage: gamf \"commit message\" [file]"
        return 1
    fi
    
    echo "Adding: $file"
    git add "$file"
    
    echo "Committing: $message"
    git commit -m "$message"
    
    echo "Pushing to remote..."
    git push
}

# Yarn via corepack
alias yarn='corepack yarn'
