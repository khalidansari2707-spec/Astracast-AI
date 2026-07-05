# AstraCast AI — Predicting Space Weather Before It Happens

A premium, enterprise-ready space weather forecasting platform that uses AI and physical modeling to predict radiation storms, electron flux, solar wind velocity, IMF Bz deflection, and plasma densities.

## Technology Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + TailwindCSS v4 + Framer Motion + Recharts + Lucide Icons
- **Backend**: FastAPI (Python) + SQLite + SQLAlchemy
- **Data Science**: Scikit-Learn + Pandas + NumPy

## Quick Start (Windows)

1. Double-click the `start.bat` script in the root directory.
2. It will automatically spawn:
   - The FastAPI backend service at `http://localhost:8000`
   - The Next.js dashboard workspace at `http://localhost:3000`

## Manual Startup

### Backend

```bash
# Activate virtual environment
.venv\Scripts\activate

# Launch backend
python -m uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm run dev -- --port 3000
```

## Security Access Levels

Authentication is powered by JWT tokens. The database is pre-populated with these default demo profiles:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| **admin** | `astracast2026` | Admin | Full control, training trigger, operator registration, logs audit |
| **operator** | `astracast2026` | Operator | Telemetry entries submission, data uploads, run predictions |
| **researcher** | `astracast2026` | Researcher | Read-only view of dashboard charts, simulator, and reports |

## Key Features

1. **Space Weather Command Center**: Real-time KPI indicators (Solar index, Wind speed, GOES PFU, Bz) and a 7-day merged historical-predictive chart timeline.
2. **Observation Entry Form**: Operator input terminal with validation limits, plus a "Simulate Solar Flare" auto-fill tool.
3. **AI Scenario Simulator**: Interactive sliders to instantly recalculate predictions.
4. **Model Performance & Analytics**: Displays neural network training loss curves, feature importances, state characteristic profiles, and metrics (RMSE, MAE, R²).
5. **Data Management**: Upload JSON/Excel/CSV, run data cleaning and linear interpolation, and trigger background model training.
6. **Report Generator**: Compile and download operational space weather forecast reports as PDF (using ReportLab), Excel, or CSV formats.
