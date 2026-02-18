# Push StyleSwap Code to GitHub - Step by Step

## What You Need to Do

You need to run these commands on your computer (in the project folder) to push your code to GitHub.

## Step 1: Open Terminal/Command Prompt

On your computer:
- **Mac/Linux:** Open "Terminal"
- **Windows:** Open "Command Prompt" or "PowerShell"

## Step 2: Navigate to Your Project Folder

```bash
cd /path/to/fitroom-ai-research
```

Replace `/path/to/fitroom-ai-research` with the actual path where your project is stored.

**Example:**
- Mac: `cd ~/Documents/fitroom-ai-research`
- Windows: `cd C:\Users\YourName\Documents\fitroom-ai-research`
- Linux: `cd ~/fitroom-ai-research`

## Step 3: Run These Commands (Copy & Paste)

Run these commands one by one in your terminal:

### Command 1: Configure Git (if you haven't already)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Replace "Your Name" and "your.email@example.com" with your actual name and email.

### Command 2: Initialize Git (if not already initialized)
```bash
git init
```

### Command 3: Add All Files
```bash
git add .
```

### Command 4: Create Initial Commit
```bash
git commit -m "Initial commit: StyleSwap application"
```

### Command 5: Add GitHub Remote
```bash
git remote add origin https://github.com/StyleSwap-sa/styleswap.git
```

### Command 6: Rename Branch to Main
```bash
git branch -M main
```

### Command 7: Push Code to GitHub
```bash
git push -u origin main
```

This will ask for your GitHub credentials. Enter your username and password (or personal access token).

## Step 4: Verify on GitHub

1. Go to https://github.com/StyleSwap-sa
2. You should see a new repository called "styleswap"
3. Your code should be visible there

## If You Get an Error

**"fatal: not a git repository"**
- Run `git init` first

**"Permission denied"**
- Make sure you're using the correct GitHub username and password
- Or create a personal access token: https://github.com/settings/tokens

**"remote origin already exists"**
- Run: `git remote remove origin` first, then try Command 5 again

## Next Steps

Once your code is on GitHub:
1. Tell me "Code is pushed"
2. I'll guide you through Railway setup

---

**That's it! Just copy and paste these commands.** 🚀
