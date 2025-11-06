#!/bin/bash
# Quick script to start the IssueHive dev server

cd "$(dirname "$0")"

echo "🔥 Starting IssueHive Development Server..."
echo "=========================================="
echo ""

# Clear any processes on ports 8080-8082
echo "📍 Clearing ports..."
lsof -ti:8080,8081,8082 2>/dev/null | xargs -r kill -9 2>/dev/null
sleep 1

echo "🚀 Starting Vite..."
echo ""

# Start the dev server
npm run dev

echo ""
echo "Server stopped."
