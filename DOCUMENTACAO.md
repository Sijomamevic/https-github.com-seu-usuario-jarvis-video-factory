# Documentação Jarvis Video Factory

## 1. Acesso Seguro (Clique Único)
O acesso à plataforma é feito via **Túnel SSH**, o que elimina a necessidade de expor portas públicas na VPS.

### Como usar:
1. Certifique-se de que os arquivos `Acessar_Jarvis.bat` e `jarvis_access_key` estão na mesma pasta em seu computador.
2. Clique duas vezes em `Acessar_Jarvis.bat`.
3. O navegador abrirá automaticamente em `http://localhost:3000`.
4. **Segurança:** Não há senhas no script. A autenticação é feita exclusivamente pela chave SSH fornecida.

## 2. Governança e Manifesto Central
O sistema segue rigorosamente o **Manifesto Central** (`manifest.json`).

- **Verdade Única:** Toda a lógica de execução, status de cenas e caminhos de arquivos são lidos e gravados no `manifest.json` localizado em `/data/video_factory/<project_id>/`.
- **Controle Principal:** O **Painel Web** é a interface central de comando.
- **Telegram:** Utilizado apenas como atalho para criação rápida de projetos. O fluxo é sempre: `Telegram -> Jarvis -> API -> Manifesto`.

## 3. Persistência e Recuperação
- **Dados:** Todos os arquivos de mídia e o estado do projeto são salvos no volume `/data/video_factory`, que é persistente.
- **Retomada:** Caso ocorra uma falha ou reinício da VPS, os agentes verificam o status no `manifest.json` e retomam a execução a partir da última etapa não concluída.

## 4. Migração para Domínio e HTTPS
Quando você adquirir um domínio, siga estes passos:

1. **DNS:** Aponte seu domínio (ex: `painel.seuprojeto.com`) para o IP da VPS `76.13.174.201`.
2. **Nginx:** Configure o Nginx na VPS como Proxy Reverso:
   ```nginx
   server {
       listen 80;
       server_name painel.seuprojeto.com;
       location / {
           proxy_pass http://localhost:3000;
       }
       location /api {
           proxy_pass http://localhost:4000;
       }
   }
   ```
3. **SSL:** Utilize o Certbot para gerar certificados gratuitos:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d painel.seuprojeto.com
   ```
4. **Ambiente:** Atualize o arquivo `.env` na VPS com a nova URL no campo `CORS_ORIGIN`.
