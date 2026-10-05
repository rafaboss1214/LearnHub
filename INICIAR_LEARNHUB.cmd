@echo off
setlocal
cd /d "%~dp0"
title LearnHub

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao foi encontrado.
  echo Instale o Node.js 22.13 ou mais recente em https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: npm nao foi encontrado. Reinstale o Node.js com o npm habilitado.
  pause
  exit /b 1
)

if not exist "node_modules\expo\bin\cli" (
  echo Instalando as dependencias do LearnHub pela primeira vez...
  call npm install
  if errorlevel 1 (
    echo.
    echo A instalacao falhou. Verifique a internet e se a escola bloqueia o npm.
    pause
    exit /b 1
  )
)

echo Iniciando o LearnHub no modo compativel com rede escolar...
call npm start
if errorlevel 1 (
  echo.
  echo O LearnHub nao iniciou. Execute npm run diagnose e envie o resultado.
)
pause
