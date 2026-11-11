# Syncra

Plataforma de criação, distribuição e marketplace de chatbots inteligentes.

## Documentação

| Doc | Conteúdo |
| --- | --- |
| `docs/Syncra_Visao_e_Escopo_MVP (1).docx` | 00 — visão (aprovada) |
| `docs/Syncra_Arquitetura.pdf` | 01 — arquitetura |
| `docs/Syncra_Contrato_de_Dados.pdf` | 02 — formato canônico e banco |
| `docs/Syncra_Plano_de_Execucao.pdf` | 03 — plano de execução |
| [docs/04-plano-de-implementacao.md](docs/04-plano-de-implementacao.md) | Plano operacional (E0–E10) |
| [docs/05-agentes.md](docs/05-agentes.md) | Frentes humanas e agentes Cursor |
| [docs/06-decisoes-tecnicas.md](docs/06-decisoes-tecnicas.md) | Decisões 8.1–8.5 fechadas |

## Setup local

Requisitos: Node 20+, pnpm 9, Docker.

```bash
pnpm install
docker compose up -d
copy .env.example apps\api\.env   # Windows
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001/health

Crie um segredo local com pelo menos 32 caracteres em `apps/api/.env` antes de iniciar a API.
O login usa Better Auth; cadastro e sessão passam por `/api/auth/*`. Bots da conta são
listados e versionados em `/api/bots`. Cada salvamento válido no estúdio cria uma nova
versão imutável no PostgreSQL. Catálogo, checkout e WhatsApp ainda são demonstrações.

Em bots salvos, o teste de conversa no estúdio usa Socket.IO e grava mensagens no banco.
A conversa continua vinculada à versão com que começou. Para respostas de nós `ia`,
configure `ANTHROPIC_API_KEY` e os modelos em `apps/api/.env`; sem chave, os nós
determinísticos continuam funcionando.
O botão **Histórico** compara versões e restaura uma definição antiga criando uma nova versão.
O painel de validação destaca etapas inalcançáveis e caminhos sem encerramento.

## Monorepo

- `packages/shared` — Zod + validador V-01..V-08
- `packages/engine` — interpretação do grafo
- `apps/api` — Express
- `apps/web` — React + React Flow

Marco da Fase 1: **E4** (bot do editor conversa na web).
