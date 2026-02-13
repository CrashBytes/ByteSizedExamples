# Tool initialization and completion

# NVM (Node Version Manager)
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"

# Google Cloud SDK
[ -f "/opt/homebrew/share/google-cloud-sdk/path.zsh.inc" ] && source "/opt/homebrew/share/google-cloud-sdk/path.zsh.inc"
[ -f "/opt/homebrew/share/google-cloud-sdk/completion.zsh.inc" ] && source "/opt/homebrew/share/google-cloud-sdk/completion.zsh.inc"

# Completion system
autoload -Uz compinit
compinit -C

# Homebrew NVM fallback
if command -v brew >/dev/null 2>&1; then
  [ -s "$(brew --prefix nvm)/nvm.sh" ] && source "$(brew --prefix nvm)/nvm.sh"
fi
