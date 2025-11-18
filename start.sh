#!/bin/bash

# Start both server and client for the EduGrade application

echo "Starting EduGrade Server and Client..."
echo ""

# Start server in background
echo "Starting server on port 5000..."
cd server && npm start &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start client in background
echo "Starting client on port 3000..."
cd ../client && npm start &
CLIENT_PID=$!

echo ""
echo "Both applications are starting..."
echo "Server: http://localhost:5000"
echo "Client: http://localhost:3000"
echo ""
echo "Server PID: $SERVER_PID"
echo "Client PID: $CLIENT_PID"
echo ""
echo "To stop both applications, run: kill $SERVER_PID $CLIENT_PID"

# Wait for both processes
wait
