# Jarvis Video Factory - Estrutura do Projeto

## Visão Geral
Plataforma de automação cinematográfica de vídeos com sistema de agentes especializados coordenados por Jarvis (MoltBot + DeepSeek R1).

## Estrutura de Diretórios

```
jarvis-video-factory/
├── docker-compose.yml          # Orquestração de serviços
├── .env.example                # Variáveis de ambiente modelo
├── README.md                   # Documentação principal
│
├── panel-ui/                   # Frontend (React + TypeScript + TailwindCSS)
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── pages/              # Páginas do painel
│   │   ├── services/           # Integração com API
│   │   ├── hooks/              # React hooks customizados
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utilitários
│   ├── public/                 # Assets estáticos
│   └── package.json
│
├── panel-api/                  # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── routes/             # Rotas da API
│   │   ├── controllers/        # Controladores
│   │   ├── services/           # Lógica de negócio
│   │   ├── models/             # Modelos de dados
│   │   ├── middleware/         # Middlewares
│   │   └── utils/              # Utilitários
│   ├── Dockerfile
│   └── package.json
│
├── agent-runner/               # Executor de agentes (Python)
│   ├── agents/
│   │   ├── jarvis.py           # Coordenador (MoltBot + DeepSeek R1)
│   │   ├── neoqeav.py          # Roteiro
│   │   ├── joao.py             # Prompts
│   │   ├── cassiano.py         # Imagens/Frames
│   │   ├── noah.py             # Vídeo (Diretor)
│   │   ├── melissa.py          # Voz
│   │   ├── victoria.py         # Trilha Sonora
│   │   ├── miriam.py           # Edição
│   │   └── caio.py             # Publicação
│   ├── core/
│   │   ├── manifest.py         # Gerenciador de manifesto
│   │   ├── character.py        # Gerenciador de personagens
│   │   ├── frame_chain.py      # Continuidade visual
│   │   └── queue.py            # Sistema de filas
│   ├── Dockerfile
│   └── requirements.txt
│
├── browser-runner/             # Automação browser (Playwright)
│   ├── src/
│   │   ├── platforms/          # Integrações com plataformas
│   │   │   ├── grok.py
│   │   │   ├── runway.py
│   │   │   ├── kling.py
│   │   │   ├── capcut.py
│   │   │   ├── elevenlabs.py
│   │   │   └── suno.py
│   │   └── utils/
│   ├── Dockerfile
│   └── requirements.txt
│
├── telegram-bridge/            # Ponte Telegram (opcional)
│   ├── src/
│   │   ├── bot.py
│   │   └── handlers/
│   ├── Dockerfile
│   └── requirements.txt
│
├── scripts/                    # Scripts utilitários
│   ├── start.sh                # Iniciar serviços
│   ├── stop.sh                 # Parar serviços
│   ├── logs.sh                 # Ver logs
│   ├── setup-vps.sh            # Setup inicial na VPS
│   └── access-panel.bat        # Acesso por clique único (Windows)
│
└── data/                       # Dados persistentes (volume Docker)
    └── video_factory/
        └── <project_id>/
            ├── manifest.json
            ├── characters/
            ├── reference/
            ├── roteiro/
            ├── prompts/
            ├── imagens/
            ├── videos/
            ├── frames_extraidos/
            ├── audio/
            ├── musica/
            ├── edicao/
            └── export/
```

## Serviços Docker

1. **panel-ui** - Frontend React (porta 3000)
2. **panel-api** - Backend API (porta 4000)
3. **redis** - Fila de tarefas e eventos
4. **postgres** - Banco de dados
5. **agent-runner** - Executor de agentes
6. **browser-runner** - Automação de navegador
7. **telegram-bridge** - Ponte Telegram (opcional)

## Fluxo de Trabalho

1. Usuário cria projeto no painel
2. Jarvis gera manifest.json
3. Agentes executam tarefas em sequência
4. Browser-runner automatiza plataformas externas
5. Arquivos são salvos na estrutura definida
6. Painel exibe progresso em tempo real
7. Vídeo final é exportado

## Princípios

- Painel web é o controle principal
- Manifesto é a verdade única
- Personagem nunca muda
- Continuidade visual obrigatória
- Tudo testável sem domínio (via túnel SSH)
