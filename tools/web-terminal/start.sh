#!/bin/bash
set -e

echo "🔧 Setting up Web Terminal..."

# Install server deps
cd "$(dirname "$0")/server"
if [ ! -d node_modules ]; then
  echo "📦 Installing server dependencies..."
  npm install
fi

# Install client deps
cd ../client
if [ ! -d node_modules ]; then
  echo "📦 Installing client dependencies..."
  npm install
fi

# Build client
echo "⚡ Building client..."
npm run build

# Start server
cd ../server
echo "🚀 Starting server on http://localhost:3001"
node server.js
