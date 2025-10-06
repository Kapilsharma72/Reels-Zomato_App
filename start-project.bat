@echo off
echo 🚀 Starting ReelZomato Project...
echo.

echo 📁 Starting Backend Server...
start "Backend Server" cmd /k "cd Backend && npm run start:dev"

echo ⏳ Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo 📁 Starting Frontend Server...
start "Frontend Server" cmd /k "cd Frontend && npm run dev"

echo.
echo ✅ Both servers are starting...
echo 🔗 Backend: http://localhost:3001
echo 🔗 Frontend: http://localhost:5173
echo.
echo 💡 Press any key to close this window...
pause > nul
