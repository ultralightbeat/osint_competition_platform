@echo off
echo ====================================
echo Fixing Alembic Migration Conflict
echo ====================================
echo.

cd /d "%~dp0"

set FLASK_APP=src.wsgi:app

echo Step 1: Running fix script...
python fix_migration_conflict.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Step 2: Applying migrations...
    python -m flask db upgrade
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ====================================
        echo SUCCESS! Migration conflict fixed!
        echo ====================================
    ) else (
        echo.
        echo ERROR: Failed to apply migrations
        exit /b 1
    )
) else (
    echo.
    echo ERROR: Failed to fix migration state
    exit /b 1
)

pause
