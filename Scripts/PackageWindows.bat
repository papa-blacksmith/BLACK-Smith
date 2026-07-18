@echo off
if not defined UE_ENGINE_DIR (echo Set UE_ENGINE_DIR first.& exit /b 1)
call "%UE_ENGINE_DIR%\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun -project="%~dp0..\BLACKSmith.uproject" -noP4 -platform=Win64 -clientconfig=Shipping -build -cook -allmaps -stage -pak -iostore -archive -archivedirectory="%~dp0..\Build\Windows"
pause
