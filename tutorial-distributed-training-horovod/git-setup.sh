#!/bin/bash

# Git Setup Script for tutorial-distributed-training-horovod
# This script initializes git and pushes to GitHub using CrashBytes SSH configuration

echo "================================================"
echo "Git Setup for Distributed Training Tutorial"
echo "Using CrashBytes SSH Configuration"
echo "================================================"

# Navigate to repository directory
cd /Users/blackholesoftware/github/crashbytes-tutorials/tutorial-distributed-training-horovod

# Check if git is already initialized
if [ -d .git ]; then
    echo "✓ Git already initialized"
else
    echo "→ Initializing git repository..."
    git init
fi

# Configure git user for this repository (CrashBytes)
echo "→ Configuring git user for CrashBytes..."
git config user.name "CrashBytes"
git config user.email "michael@crashbytes.com"

# Add all files
echo "→ Adding files to git..."
git add .

# Create initial commit
echo "→ Creating initial commit..."
git commit -m "Initial commit: Production-ready distributed ML training with Horovod

- Complete README with badges and documentation
- Model factory supporting ResNet, EfficientNet, ViT
- YAML-based configuration management
- Requirements and setup files
- MIT License
- Professional .gitignore

Accompanies CrashBytes tutorial:
https://crashbytes.com/tutorial-distributed-ml-training-horovod-pytorch-multi-gpu-2025"

# Add remote origin using CrashBytes SSH host alias
echo "→ Adding remote origin (CrashBytes SSH)..."
git remote add origin git@github.com-crashbytes:CrashBytes/tutorial-distributed-training-horovod.git

# Set main branch
echo "→ Setting main branch..."
git branch -M main

# Push to GitHub
echo "→ Pushing to GitHub..."
git push -u origin main

echo "================================================"
echo "✓ Git setup complete!"
echo "Repository: https://github.com/CrashBytes/tutorial-distributed-training-horovod"
echo "================================================"
