@echo off
echo Formatting markdown files in content/posts...
call npx prettier --write "content/posts/**/*.md"
echo Done.
pause
