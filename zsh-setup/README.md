# ZSH Configuration

A clean, modular ZSH configuration using Oh My Zsh with organized file structure for easy customization.

![ZSH](https://img.shields.io/badge/shell-zsh-green)
![Oh My Zsh](https://img.shields.io/badge/framework-oh--my--zsh-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

## ✨ Features

- 🎨 **Agnoster theme** with git branch display
- 📦 **Modular configuration** split into logical files
- 🔧 **Comprehensive git aliases** for faster workflow
- 🛠️ **Tool integration** (NVM, Google Cloud SDK, Android SDK)
- 🎯 **Easy customization** with numbered config files
- 🔒 **Portable** across machines using `$HOME` variables
- 💾 **Safe installation** with automatic backups

## 🚀 Quick Start

### One-Command Installation

```bash
git clone https://github.com/CrashBytes/zshrc-setup.git /tmp/zshrc-setup
cd /tmp/zshrc-setup
./install.sh
```

The installer will:
- ✅ Install Oh My Zsh (if not present)
- ✅ Install Powerline fonts for the Agnoster theme (macOS)
- ✅ Backup your existing `.zshrc` and `.zshrc.d` directory
- ✅ Install the new configuration files
- ✅ Reload your shell configuration

### Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/CrashBytes/zshrc-setup.git ~/.zshrc.d

# 2. Add the loader to your ~/.zshrc
cat >> ~/.zshrc << 'EOF'

# Load modular zsh configuration
setopt EXTENDED_GLOB
setopt NULL_GLOB
ZDOTDIR="${ZDOTDIR:-$HOME}"
if [ -d "$ZDOTDIR/.zshrc.d" ]; then
  for _z in "$ZDOTDIR"/.zshrc.d/*.zsh(.N); do
    source "$_z"
  done
fi
unset _z
EOF

# 3. Reload your shell
source ~/.zshrc
```

## 📁 Configuration Structure

```
~/.zshrc.d/
├── 20-prompt.zsh         # Custom prompt with git branch display
├── 30-ohmyzsh.zsh        # Oh My Zsh settings and plugins
├── 40-exports.zsh        # Environment variables
├── 50-paths.zsh          # PATH modifications
├── 60-tools.zsh          # Tool initialization (NVM, GCloud, etc.)
├── 70-aliases.zsh        # Git and other command aliases
└── README.md             # Detailed documentation
```

Files are numbered to control load order (20 → 70).

## 🎯 Git Aliases

Streamlined git workflow with intuitive aliases:

```bash
gs          # git status
gl          # git log (pretty graph)
gp          # git push
gpl         # git pull
gc "msg"    # git commit -m "msg"
gca "msg"   # git commit -a -m "msg"
gco         # git checkout
gcb         # git checkout -b (new branch)
gcm         # git checkout main
gup         # git pull --rebase
gcl         # git clone
gclean      # git clean -fd
greset      # git reset --hard
gdiff       # git diff
gbranch     # git branch
gstash      # git stash --include-untracked
gstashp     # git stash pop
```

[See all aliases →](.zshrc.d/70-aliases.zsh)

## 🔧 Included Tools

Pre-configured for common development tools:

- **Node.js** - NVM (Node Version Manager) integration
- **Google Cloud** - GCloud SDK with completion
- **Android** - Android SDK paths for React Native development
- **.NET** - .NET SDK in PATH
- **VS Code** - `code` command for opening files from terminal

All tool configurations are optional and can be commented out if not needed.

## 🎨 Oh My Zsh Plugins

### Active Plugins

- **git** - Enhanced git integration
- **sudo** - Press ESC twice to prepend `sudo`
- **web-search** - Search Google, Stack Overflow, etc. from terminal
- **copyfile** - Copy file contents to clipboard

### Optional Plugins (Commented Out)

```bash
# Install with Homebrew:
brew install zsh-autosuggestions zsh-syntax-highlighting

# Then uncomment in 30-ohmyzsh.zsh:
# plugins+=(zsh-autosuggestions zsh-syntax-highlighting)
```

## 🛠️ Customization

### Add Your Own Configuration

Create numbered files in `~/.zshrc.d/` for custom settings:

```bash
# Work-specific aliases
echo 'alias deploy="./deploy.sh"' > ~/.zshrc.d/80-work.zsh

# Personal exports
echo 'export MY_VAR="value"' > ~/.zshrc.d/85-personal.zsh

# Reload
source ~/.zshrc
```

### Modify Existing Files

```bash
# Edit any configuration file
nano ~/.zshrc.d/70-aliases.zsh

# Reload to see changes
source ~/.zshrc
```

### Disable Optional Features

Comment out sections you don't need:

```bash
# In 40-exports.zsh - disable Android SDK
# export ANDROID_HOME="$HOME/Library/Android/sdk"
```

## 📋 Requirements

### Required

- **ZSH** - Usually pre-installed on macOS and most Linux distros
- **Git** - For cloning the repository

### Optional

- **Oh My Zsh** - Auto-installed by `install.sh`
- **Powerline Fonts** - Auto-installed by `install.sh` on macOS
- Development tools (NVM, Android SDK, etc.) - Only if you use them

## 🐛 Troubleshooting

### Plugin Not Found Error

```bash
[oh-my-zsh] plugin 'some-plugin' not found
```

**Solution:** Either install the plugin or remove it from `30-ohmyzsh.zsh`.

### Command Not Found

If you see errors about missing commands:
1. Check if the tool is installed
2. If not using the tool, comment out its configuration in the relevant file

### Configuration Not Loading

Verify the loader is in your `~/.zshrc`:

```bash
grep -A 10 "Load modular zsh" ~/.zshrc
```

If missing, add it manually (see [Manual Installation](#manual-installation)).

## 📚 Documentation

- **[Detailed Config Guide](.zshrc.d/README.md)** - In-depth documentation
- **[Oh My Zsh Wiki](https://github.com/ohmyzsh/ohmyzsh/wiki)** - Official docs
- **[Agnoster Theme](https://github.com/agnoster/agnoster-zsh-theme)** - Theme info

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use and modify as needed.

## 🙏 Credits

- [Oh My Zsh](https://ohmyz.sh/) - ZSH configuration framework
- [Agnoster](https://github.com/agnoster/agnoster-zsh-theme) - Prompt theme
- Community contributors and plugin authors

## 📬 Support

- **Issues:** [GitHub Issues](https://github.com/CrashBytes/zshrc-setup/issues)
- **Questions:** Open a discussion or issue

---

**Made with ❤️ for cleaner terminal workflows**
