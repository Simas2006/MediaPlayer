if [ ! -d "node_modules" ]; then
  npm install
  npm install -g forever
fi
forever -l $PWD"/out.log" server.js $1 $2
