#!/bin/bash
echo "🔧 Starting development mode..."

# Install deps if needed
cd "$(dirname "$0")/server" && [ ! -d node_modules ] && npm install
cd "$(dirname "$0")/client" && [ ! -d node_modules ] && npm install

# Run server and vite dev in parallel
cd "$(dirname "$0")"
trap 'kill 0' EXIT

(cd server && node server.js) &
(cd client && npm run dev -- --host) &

wait
