# Git Version Control Setup Guide

## Step 1: Manual Git Setup (From Replit Shell)

Since Git operations are restricted in the current environment, you'll need to set up Git manually using the Replit Shell:

### Open Replit Shell
1. In your Replit project, click on the "Shell" tab (usually at the bottom)
2. This opens a terminal where you can run Git commands

### Configure Git (First Time Setup)
```bash
# Set your name and email (replace with your actual details)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Initialize Repository and Make Initial Commit
```bash
# Check if Git is already initialized
git status

# If not initialized, run:
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Spotify to TIDAL playlist transfer app"
```

## Step 2: Create GitHub Repository

### Option A: Using GitHub Website
1. Go to [github.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it something like `spotify-tidal-transfer`
5. Keep it public or private (your choice)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### Option B: Using GitHub CLI (if available)
```bash
# Install GitHub CLI if not available
gh auth login
gh repo create spotify-tidal-transfer --public
```

## Step 3: Connect Local Repository to GitHub

After creating the GitHub repository, GitHub will show you commands similar to these:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/spotify-tidal-transfer.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Future Workflow - Making Changes

### Daily Development Workflow
```bash
# 1. Check current status
git status

# 2. Add specific files you've changed
git add filename.ts
# OR add all changes
git add .

# 3. Commit your changes with a descriptive message
git commit -m "Add user authentication feature"

# 4. Push to GitHub
git push origin main
```

### Example Commit Messages
- `"Add Spotify playlist import functionality"`
- `"Fix transfer progress tracking bug"`
- `"Update UI styling for dark mode"`
- `"Add error handling for TIDAL API"`

## Step 5: Best Practices

### Commit Frequency
- Commit after completing each feature or bug fix
- Don't wait too long between commits
- Each commit should represent a logical unit of work

### Branching (Advanced)
For larger features, consider using branches:
```bash
# Create and switch to a new branch
git checkout -b feature-name

# Work on your feature, then commit
git add .
git commit -m "Implement new feature"

# Switch back to main branch
git checkout main

# Merge your feature
git merge feature-name

# Delete the feature branch
git branch -d feature-name
```

### What's Already Ignored
Your `.gitignore` file already excludes:
- `node_modules/` - Dependencies
- `.env*` - Environment variables and secrets
- `__pycache__/` - Python cache files
- Build and temporary files
- IDE settings
- OS-specific files

## Step 6: Collaboration Features

### Viewing Changes
```bash
# See what files have changed
git status

# See specific changes in files
git diff

# View commit history
git log --oneline
```

### Pulling Updates (if working with others)
```bash
# Get latest changes from GitHub
git pull origin main
```

## Troubleshooting

### If You Get "Repository Not Found" Error
- Double-check the repository URL
- Ensure you have access to the repository
- Verify your GitHub username and repository name

### If You Get Authentication Errors
- You may need to set up a Personal Access Token
- Go to GitHub Settings > Developer settings > Personal access tokens
- Create a token with repository permissions
- Use the token as your password when prompted

### Replit-Specific Notes
- Replit automatically saves your files
- You still need to manually commit and push to GitHub
- The Replit environment persists your Git configuration
- Use the Shell tab for all Git commands

## Quick Reference Commands

```bash
# Essential Git commands
git status              # Check what's changed
git add .              # Stage all changes
git commit -m "message" # Commit with message
git push origin main    # Upload to GitHub
git pull origin main    # Download from GitHub
git log --oneline      # View commit history
```

## Next Steps

1. Set up your GitHub repository
2. Make your first commit and push
3. Start using Git for all your changes
4. Consider setting up automated deployments from your GitHub repository

Your project is now ready for professional version control!