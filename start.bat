@echo off
echo =====================================================================
echo                 ASTRACAST AI FORECASTING PLATFORM
echo =====================================================================
echo.
echo Launching space weather AI forecasting network services...
echo.

:: Start FastAPI Backend
start cmd /k "echo Starting FastAPI Backend... && .venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000"

:: Start Next.js Frontend
start cmd /k "echo Starting Next.js Frontend... && cd frontend && npm run dev -- --port 3000"

echo Services dispatched in background command shells.
echo.
echo =====================================================================
echo API backend active at: http://localhost:8000
echo Frontend dashboard active at: http://localhost:3000
echo =====================================================================
pause
