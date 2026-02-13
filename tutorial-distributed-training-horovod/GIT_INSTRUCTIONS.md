# Git Setup Instructions for CrashBytes Tutorial (SSH Configuration)

## 🔑 Your SSH Configuration

You have two GitHub accounts configured:
- **Personal**: `github.com-michaeleakins` → `~/.ssh/id_ed25519_michaeleakins`
- **CrashBytes**: `github.com-crashbytes` → `~/.ssh/id_ed25519_crashbytes`

For this repository, we'll use the **CrashBytes** SSH configuration.

## Quick Setup (Automated) ✅

Run the provided script:

```bash
cd /Users/blackholesoftware/github/crashbytes-tutorials/tutorial-distributed-training-horovod
chmod +x git-setup.sh
./git-setup.sh
```

## Manual Setup (Step-by-Step)

### 1. Navigate to Repository

```bash
cd /Users/blackholesoftware/github/crashbytes-tutorials/tutorial-distributed-training-horovod
```

### 2. Initialize Git

```bash
git init
```

### 3. Configure CrashBytes Identity (Local Repo Only)

```bash
git config user.name "CrashBytes"
git config user.email "michael@crashbytes.com"
```

### 4. Add All Files

```bash
git add .
```

### 5. Check Status

```bash
git status
```

### 6. Create Initial Commit

```bash
git commit -m "Initial commit: Production-ready distributed ML training with Horovod

- Complete README with badges and documentation
- Model factory supporting ResNet, EfficientNet, ViT
- YAML-based configuration management
- Requirements and setup files
- MIT License
- Professional .gitignore

Accompanies CrashBytes tutorial:
https://crashbytes.com/tutorial-distributed-ml-training-horovod-pytorch-multi-gpu-2025"
```

### 7. Add Remote Origin (Using CrashBytes SSH)

**IMPORTANT:** Use `github.com-crashbytes` host alias:

```bash
git remote add origin git@github.com-crashbytes:CrashBytes/tutorial-distributed-training-horovod.git
```

### 8. Verify Remote

```bash
git remote -v
```

Should show:
```
origin  git@github.com-crashbytes:CrashBytes/tutorial-distributed-training-horovod.git (fetch)
origin  git@github.com-crashbytes:CrashBytes/tutorial-distributed-training-horovod.git (push)
```

### 9. Set Main Branch

```bash
git branch -M main
```

### 10. Push to GitHub

```bash
git push -u origin main
```

## 🔐 SSH Key Verification

Test your CrashBytes SSH connection:

```bash
ssh -T git@github.com-crashbytes
```

Expected response:
```
Hi CrashBytes! You've successfully authenticated, but GitHub does not provide shell access.
```

## Troubleshooting

### If remote already exists:

```bash
git remote remove origin
git remote add origin git@github.com-crashbytes:CrashBytes/tutorial-distributed-training-horovod.git
```

### If push fails with permission denied:

1. **Test SSH connection:**
   ```bash
   ssh -T git@github.com-crashbytes
   ```

2. **Check SSH agent:**
   ```bash
   ssh-add -l
   ```
   
   If your CrashBytes key isn't listed:
   ```bash
   ssh-add ~/.ssh/id_ed25519_crashbytes
   ```

3. **Verify SSH config:**
   ```bash
   cat ~/.ssh/config | grep -A 5 "crashbytes"
   ```

### If using HTTPS instead of SSH:

If you accidentally used HTTPS URL, fix it:

```bash
git remote set-url origin git@github.com-crashbytes:CrashBytes/tutorial-distributed-training-horovod.git
```

### If repository doesn't exist on GitHub:

Create it first at: https://github.com/organizations/CrashBytes/repositories/new

- Name: `tutorial-distributed-training-horovod`
- Description: `Production-ready distributed ML training with Horovod and PyTorch`
- Public/Private: Your choice
- DO NOT initialize with README (we already have one)

## Key Differences from Standard Setup

| Standard | CrashBytes (Your Setup) |
|----------|------------------------|
| `git@github.com:User/repo.git` | `git@github.com-crashbytes:CrashBytes/repo.git` |
| Uses default SSH key | Uses `~/.ssh/id_ed25519_crashbytes` |
| Generic git config | Local config for CrashBytes identity |

## Quick Reference Commands

```bash
# Navigate
cd /Users/blackholesoftware/github/crashbytes-tutorials/tutorial-distributed-training-horovod

# Initialize
git init
git config user.name "CrashBytes"
git config user.email "michael@crashbytes.com"

# Commit
git add .
git commit -m "Initial commit: Production-ready distributed ML training with Horovod"

# Push (CrashBytes SSH)
git remote add origin git@github.com-crashbytes:CrashBytes/tutorial-distributed-training-horovod.git
git branch -M main
git push -u origin main
```

## Verification

After successful push, verify at:
**https://github.com/CrashBytes/tutorial-distributed-training-horovod**

## Files Ready for Git

```
tutorial-distributed-training-horovod/
├── .gitignore              ✅ Professional Python/ML .gitignore
├── LICENSE                 ✅ MIT License (CrashBytes)
├── README.md               ✅ Complete documentation
├── requirements.txt        ✅ All dependencies
├── git-setup.sh            ✅ Automated setup (SSH configured)
├── GIT_INSTRUCTIONS.md     ✅ This file
├── configs/
│   └── training_config.yaml ✅
└── src/
    ├── __init__.py         ✅
    └── models/
        └── __init__.py     ✅
```

## SSH Config Reference

Your current SSH config (`~/.ssh/config`):

```
# CrashBytes organization account
Host github.com-crashbytes
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_crashbytes
    IdentitiesOnly yes
```

This config ensures that when you use `git@github.com-crashbytes:...`, it automatically uses your CrashBytes SSH key.

## Next Steps After Push

1. ✅ Repository pushed to GitHub
2. Verify repository access at https://github.com/CrashBytes/tutorial-distributed-training-horovod
3. Add repository topics: `machine-learning`, `distributed-training`, `horovod`, `pytorch`
4. Add description: "Production-ready distributed ML training with Horovod and PyTorch"
5. Consider adding:
   - GitHub Actions CI/CD
   - Branch protection rules
   - Issue templates
   - Additional implementation files in future commits
