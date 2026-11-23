@echo off
setlocal
cd /d "%~dp0"
set "APP_NODE=%ProgramFiles%\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_arm64__3k8sg7r9htsxt\dependencies\node\bin\node.exe"
if exist "%APP_NODE%" goto launch
set "APP_NODE="
for /f "delims=" %%N in ('powershell.exe -NoProfile -Command "Get-AppxPackage -Name OpenAI.CodexPrimaryRuntime* | Sort-Object Version -Descending | ForEach-Object { Join-Path $_.InstallLocation 'dependencies\node\bin\node.exe' } | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1"') do set "APP_NODE=%%N"
if not defined APP_NODE for %%N in (node.exe) do set "APP_NODE=%%~$PATH:N"
if not defined APP_NODE (
  echo No s'ha trobat Node.js. Instal.la Node.js 24 i torna-ho a provar.
  pause
  exit /b 1
)
:launch
if /i "%~1"=="--version" (
  "%APP_NODE%" node_modules\@angular\cli\bin\ng.js version
  exit /b
)
"%APP_NODE%" node_modules\@angular\cli\bin\ng.js serve --open
if errorlevel 1 pause
