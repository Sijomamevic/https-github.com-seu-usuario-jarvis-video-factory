@echo off
TITLE Acessar Jarvis Video Factory
SET VPS_IP=76.13.174.201
SET VPS_USER=root
SET LOCAL_PORT_UI=3000
SET LOCAL_PORT_API=4000
SET KEY_FILE=jarvis_access_key

echo ======================================================
echo           JARVIS VIDEO FACTORY - ACESSO SEGURO
echo ======================================================
echo.
echo Estabelecendo conexao segura com a VPS via CHAVE SSH...
echo Mantenha esta janela aberta enquanto usa o painel.
echo.
echo Abrindo navegador em http://localhost:%LOCAL_PORT_UI%
echo.

start http://localhost:%LOCAL_PORT_UI%

:: Verifica se a chave existe, se nao, avisa o usuario
if not exist "%KEY_FILE%" (
    echo ERRO: Arquivo de chave "%KEY_FILE%" nao encontrado no mesmo diretorio!
    echo Por favor, coloque a chave privada fornecida pela Manus AI aqui.
    pause
    exit /b
)

ssh -i %KEY_FILE% -L %LOCAL_PORT_UI%:127.0.0.1:%LOCAL_PORT_UI% -L %LOCAL_PORT_API%:127.0.0.1:%LOCAL_PORT_API% %VPS_USER%@%VPS_IP%

echo.
echo Conexao encerrada.
pause
