@echo off
if not defined UE_ENGINE_DIR (echo Set UE_ENGINE_DIR first.& exit /b 1)
"%UE_ENGINE_DIR%\Engine\Build\BatchFiles\GenerateProjectFiles.bat" -project="%~dp0..\BLACKSmith.uproject" -game -engine
pause
