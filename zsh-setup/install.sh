#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Installing zshrc configuration...${NC}\n"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if oh-my-zsh is installed
if [ ! -d ~/.oh-my-zsh ]; then
    echo -e "${YELLOW}oh-my-zsh not found. Installing...${NC}"
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ oh-my-zsh installed successfully${NC}\n"
    else
        echo -e "${RED}✗ Failed to install oh-my-zsh${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}✓ oh-my-zsh already installed${NC}\n"
fi

# Install Powerline fonts for agnoster theme
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}Checking for Powerline fonts...${NC}"
    
    # Check if a common powerline font is installed
    if ! system_profiler SPFontsDataType 2>/dev/null | grep -q "Meslo.*Powerline\|Source Code Pro.*Powerline\|Inconsolata.*Powerline"; then
        echo -e "${YELLOW}Powerline fonts not found. Installing...${NC}"
        
        # Clone powerline fonts repo to temp directory
        TEMP_DIR=$(mktemp -d)
        git clone https://github.com/powerline/fonts.git --depth=1 "$TEMP_DIR/powerline-fonts"
        
        if [ $? -eq 0 ]; then
            # Install fonts
            cd "$TEMP_DIR/powerline-fonts"
            ./install.sh
            cd - > /dev/null
            
            # Cleanup
            rm -rf "$TEMP_DIR"
            
            echo -e "${GREEN}✓ Powerline fonts installed successfully${NC}"
            echo -e "${YELLOW}⚠ Important: Set your terminal font to 'Meslo LG M for Powerline' or similar${NC}"
            echo -e "${YELLOW}  Terminal > Preferences > Profiles > Text > Font${NC}\n"
        else
            echo -e "${RED}✗ Failed to clone powerline fonts repository${NC}"
            echo -e "${YELLOW}You can install manually from: https://github.com/powerline/fonts${NC}\n"
        fi
    else
        echo -e "${GREEN}✓ Powerline fonts already installed${NC}\n"
    fi
fi

# Backup existing .zshrc if it exists
if [ -f ~/.zshrc ]; then
    BACKUP_FILE=~/.zshrc.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${YELLOW}Backing up existing .zshrc to $BACKUP_FILE${NC}"
    cp ~/.zshrc "$BACKUP_FILE"
fi

# Backup existing .zshrc.d if it exists
if [ -d ~/.zshrc.d ]; then
    BACKUP_DIR=~/.zshrc.d.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${YELLOW}Backing up existing .zshrc.d to $BACKUP_DIR${NC}"
    cp -r ~/.zshrc.d "$BACKUP_DIR"
fi

# Copy new .zshrc
if [ -f "$SCRIPT_DIR/.zshrc" ]; then
    echo -e "${GREEN}Installing .zshrc${NC}"
    cp "$SCRIPT_DIR/.zshrc" ~/
else
    echo -e "${RED}Error: .zshrc not found in $SCRIPT_DIR${NC}"
    exit 1
fi

# Copy .zshrc.d directory if it exists
if [ -d "$SCRIPT_DIR/.zshrc.d" ]; then
    echo -e "${GREEN}Installing .zshrc.d directory${NC}"
    
    # Remove existing directory to ensure clean copy
    if [ -d ~/.zshrc.d ] && [ ! -L ~/.zshrc.d ]; then
        rm -rf ~/.zshrc.d
    fi
    
    # Copy with verbose error checking
    if cp -r "$SCRIPT_DIR/.zshrc.d" ~/ 2>/dev/null; then
        echo -e "${GREEN}✓ .zshrc.d directory installed successfully${NC}"
        echo -e "${BLUE}  Installed files:${NC}"
        ls -la ~/.zshrc.d/ | tail -n +4 | awk '{print "    " $9}'
    else
        echo -e "${RED}✗ Failed to copy .zshrc.d directory${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ .zshrc.d directory not found in $SCRIPT_DIR${NC}"
fi

# Enable showing hidden files in Finder (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "\n${BLUE}Configuring macOS Finder to show hidden files...${NC}"
    defaults write com.apple.finder AppleShowAllFiles YES
    killall Finder 2>/dev/null
    echo -e "${GREEN}✓ Finder will now show hidden files${NC}"
fi

# Add alias to show hidden files by default in terminal
if ! grep -q "alias ls='ls -la'" ~/.zshrc 2>/dev/null; then
    echo -e "\n${BLUE}Adding 'ls' alias to always show hidden files...${NC}"
    echo "" >> ~/.zshrc
    echo "# Always show hidden files in ls" >> ~/.zshrc
    echo "alias ls='ls -la'" >> ~/.zshrc
    echo -e "${GREEN}✓ Terminal ls will now show hidden files by default${NC}"
fi

echo -e "\n${GREEN}✓ Installation complete!${NC}"

# Verify installation
echo -e "\n${BLUE}Verifying installation...${NC}"
if [ -f ~/.zshrc ]; then
    echo -e "${GREEN}✓ .zshrc installed${NC}"
else
    echo -e "${RED}✗ .zshrc not found${NC}"
fi

if [ -d ~/.zshrc.d ]; then
    FILE_COUNT=$(ls -1 ~/.zshrc.d/*.zsh 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ .zshrc.d installed with $FILE_COUNT files${NC}"
else
    echo -e "${RED}✗ .zshrc.d directory not found${NC}"
fi

if [ -d ~/.oh-my-zsh ]; then
    echo -e "${GREEN}✓ oh-my-zsh installed${NC}"
else
    echo -e "${RED}✗ oh-my-zsh not found${NC}"
fi

echo -e "\n${BLUE}Reloading zsh configuration...${NC}"

# Source the new configuration
if [ -n "$ZSH_VERSION" ]; then
    source ~/.zshrc
    echo -e "${GREEN}✓ Configuration reloaded!${NC}"
else
    echo -e "${YELLOW}Note: Run 'source ~/.zshrc' or restart your terminal to apply changes.${NC}"
fi
