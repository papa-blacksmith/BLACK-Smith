@echo off
if not defined UE_ENGINE_DIR (echo Set UE_ENGINE_DIR first.& exit /b 1)
call "%UE_ENGINE_DIR%\Engine\Build\BatchFiles\Build.bat" BLACKSmithEditor Win64 Development "%~dp0..\BLACKSmith.uproject" -WaitMutex
pause
