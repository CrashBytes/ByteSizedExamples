
# >>> zshrc.d loader >>>
setopt EXTENDED_GLOB
setopt NULL_GLOB
ZDOTDIR="${ZDOTDIR:-$HOME}"
if [ -d "$ZDOTDIR/.zshrc.d" ]; then
  for _z in "$ZDOTDIR"/.zshrc.d/*.zsh(.N); do
    source "$_z"
  done
fi
unset _z
# <<< zshrc.d loader <<<

