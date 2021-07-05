del ".\SetupScripts\app.7z"

rem Éú³Éapp.7z
7z.exe a ".\SetupScripts\app.7z" "..\release\win-ia32-unpacked\*.*"

@set DestPath=..\release\win-ia32-unpacked\
@echo off& setlocal EnableDelayedExpansion

for /f "delims=" %%a in ('dir /ad/b %DestPath%') do (
7z.exe a ".\SetupScripts\app.7z" "..\release\win-ia32-unpacked\%%a"
@echo "compressing ..\release\win-ia32-unpacked\%%a"
)