#!/bin/bash
VPS_IP="76.13.174.201"
VPS_USER="root"
LOCAL_PORT_UI=3000
LOCAL_PORT_API=4000

echo "======================================================"
echo "          JARVIS VIDEO FACTORY - ACESSO SEGURO"
echo "======================================================"
echo ""
echo "Estabelecendo conexão segura com a VPS..."
echo "Mantenha este terminal aberto enquanto usa o painel."
echo ""
echo "Abrindo navegador em http://localhost:$LOCAL_PORT_UI"
echo ""

# Abrir navegador (funciona em Linux e Mac)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:$LOCAL_PORT_UI"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:$LOCAL_PORT_UI"
fi

ssh -L $LOCAL_PORT_UI:127.0.0.1:$LOCAL_PORT_UI -L $LOCAL_PORT_API:127.0.0.1:$LOCAL_PORT_API $VPS_USER@$VPS_IP
