@echo off
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo Bazardrom API: http://127.0.0.1:8000
echo Docs: http://127.0.0.1:8000/docs
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
