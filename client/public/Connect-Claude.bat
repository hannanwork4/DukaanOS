@echo off
title DukaanOS - 1-Click Claude Integration
echo ========================================================
echo        DukaanOS - 1-Click Claude Desktop Setup
echo ========================================================
echo.
echo Connecting DukaanOS Store Engine to Claude Desktop...

set "CLAUDE_DIR=%APPDATA%\Claude"
if not exist "%CLAUDE_DIR%" mkdir "%CLAUDE_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$cfg = @{ mcpServers = @{ dukaanos = @{ command = 'node'; args = @('C:\Users\DELL\Desktop\DukaanOS\mcp\dist\stdio.js'); env = @{ API_URL = 'https://dukaanos-plum.vercel.app'; DEFAULT_BUSINESS_ID = 'b0000000-0000-0000-0000-000000000001' } } } } | ConvertTo-Json -Depth 5; Set-Content -Path \"$env:APPDATA\Claude\claude_desktop_config.json\" -Value $cfg"

echo.
echo [SUCCESS] Claude is now directly connected to your DukaanOS Store!
echo Launch Claude Desktop, and your Kirana store tools will be active.
echo ========================================================
pause
