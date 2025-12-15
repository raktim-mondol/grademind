@echo off
echo Initializing/Checking Git Repository...
if not exist .git (
    git init
)

echo Configuring Remote Origin...
git remote add origin https://github.com/raktim-mondol/grademind.git 2>nul
git remote set-url origin https://github.com/raktim-mondol/grademind.git

echo Adding files...
git add .

echo Committing changes...
git commit -m "Upload frontend and backend sources"

echo Setting branch to main...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

echo Done.
pause
