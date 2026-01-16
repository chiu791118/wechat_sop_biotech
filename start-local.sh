#!/bin/bash
echo "========================================"
echo " WeChat SOP Biotech - Local Development"
echo "========================================"
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server && npm install && cd ..
fi

echo
echo "Starting development servers..."
echo "- Frontend: http://localhost:5173"
echo "- Backend:  http://localhost:3001"
echo

npm run dev
