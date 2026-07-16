@echo off
title 基智中學分班分組決策系統
echo 正在啟動決策系統後台...
cd /d %~dp0
..\venv\Scripts\python.exe server.py
if %errorlevel% neq 0 (
    echo 後台執行出錯，請確認 python venv 及相依性庫是否安裝完成。
    pause
)
