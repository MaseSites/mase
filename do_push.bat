@echo off
cd /d C:\Users\sever\IdeaProjects\MASEOfficial
echo === GIT REMOTE === > push_result.txt
git remote -v >> push_result.txt 2>&1
echo === GIT LOG === >> push_result.txt
git log --oneline -5 >> push_result.txt 2>&1
echo === GIT PUSH github === >> push_result.txt
git push github main --force >> push_result.txt 2>&1
echo PUSH1_EXIT=%ERRORLEVEL% >> push_result.txt
echo === GIT PUSH origin === >> push_result.txt
git push origin main --force >> push_result.txt 2>&1
echo PUSH2_EXIT=%ERRORLEVEL% >> push_result.txt
echo === DONE === >> push_result.txt

