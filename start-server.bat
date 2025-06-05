@echo off
echo Starting Luxury Angler Development Server...
echo.
echo Current directory: %CD%
echo.
echo Checking Node.js installation...
node --version
echo.
echo Checking npm installation...
npm --version
echo.
echo Starting Vite development server...
npm run dev
pause 