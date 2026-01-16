@echo off
echo ========================================
echo  WeChat SOP Biotech - Local Development
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
)

if not exist "client\node_modules" (
    echo Installing client dependencies...
    cd client
    call npm install
    cd ..
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
)

echo.
echo Starting development servers...
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:3001
echo.

npm run dev
