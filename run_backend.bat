@echo off
echo Starting MEO Backend on Port 8001...
cd backend
if exist venv\Scripts\activate (
    call venv\Scripts\activate
)
python -m uvicorn main:app --reload --port 8001
pause
