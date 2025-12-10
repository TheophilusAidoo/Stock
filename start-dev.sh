#!/bin/bash

# Kill any existing processes
echo "Stopping any existing servers..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true
sleep 2

# Start backend in background
echo "Starting backend server on http://127.0.0.1:4001..."
cd "/Users/alphamac/Downloads/Angelone 2/backend"
PORT=4001 HOST=127.0.0.1 npm run start:dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 5

# Start frontend in background
echo "Starting frontend server on http://127.0.0.1:3001..."
cd "/Users/alphamac/Downloads/Angelone 2/frontend"
PORT=3001 npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "✅ Servers started!"
echo "=========================================="
echo "Frontend: http://127.0.0.1:3001"
echo "Backend:  http://127.0.0.1:4001"
echo ""
echo "Backend log:  backend/backend.log"
echo "Frontend log: frontend/frontend.log"
echo ""
echo "To stop servers, run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Or use: pkill -f 'node server.js' && pkill -f 'nest start'"
echo "=========================================="

