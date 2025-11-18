@echo off
REM Start both server and client for the EduGrade application

echo Starting EduGrade Server and Client...
echo.

REM Start server in a new window
echo Starting server on port 5000...
start cmd /k "cd server && npm start"

REM Wait a moment for server to start
timeout /t 3 /nobreak

REM Start client in a new window
echo Starting client on port 3000...
start cmd /k "cd client && npm start"

echo.
echo Both applications are starting...
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.
pause
