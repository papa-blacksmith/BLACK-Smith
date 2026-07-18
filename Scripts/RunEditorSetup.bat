@echo off
if not defined UE_ENGINE_DIR (echo Set UE_ENGINE_DIR first.& exit /b 1)
"%UE_ENGINE_DIR%\Engine\Binaries\Win64\UnrealEditor-Cmd.exe" "%~dp0..\BLACKSmith.uproject" -ExecutePythonScript="%~dp0..\Content\Python\setup_blacksmith_project.py" -unattended -nop4
pause
