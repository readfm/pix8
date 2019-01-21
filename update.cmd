git init
git pull https://github.com/readfm/pix8.git
git stash
if not exist node_modules (mkdir node_modules)
npm install