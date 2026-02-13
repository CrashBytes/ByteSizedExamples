export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="agnoster"

# Core plugins (shipped with Oh My Zsh)
plugins=(
  git
  sudo
  web-search
  copyfile
)

# Optional: Add these if installed via brew/git
# Uncomment after installing:
# brew install zsh-autosuggestions zsh-syntax-highlighting
# plugins+=(zsh-autosuggestions zsh-syntax-highlighting)

source "$ZSH/oh-my-zsh.sh"
