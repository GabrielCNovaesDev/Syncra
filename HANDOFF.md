# Handoff do projeto Syncra Bot

Atualizado em 1 de outubro de 2026.

## Objetivo do produto

O Syncra Bot é uma plataforma web para criar, executar e distribuir chatbots inteligentes. A direção atual do produto é evoluir o projeto para uma experiência de demonstração premium, deixando as telas e interações o mais funcionais possível sem violar os contratos técnicos já definidos.

## Fontes de verdade

Leia nesta ordem antes de implementar:

1. `AGENTS.md` — invariantes do repositório e divisão das frentes.
2. `docs/04-plano-de-implementacao.md` — roadmap operacional E0–E10, critérios de aceite e ordem das etapas.
3. `docs/05-agentes.md` — responsabilidades e limites de cada frente.
4. `docs/06-decisoes-tecnicas.md` — decisões técnicas adotadas para a Fase 1.
5. `README.md` — setup local e mapa do monorepo.
6. Documentos-base em `docs/` (`Syncra_Visao_e_Escopo_MVP (1).docx` e PDFs de arquitetura, contrato de dados e execução) quando for necessário confirmar requisitos de produto ou contratos detalhados.

Em caso de conflito, preserve os invariantes de `AGENTS.md` e confirme a intenção do usuário antes de mudar decisões registradas em `docs/06-decisoes-tecnicas.md`.

## Arquitetura atual

- Monorepo TypeScript com pnpm workspaces.
- `apps/web`: React 18, Vite, React Router, Zustand e React Flow.
- `apps/api`: Express e Drizzle.
- `packages/shared`: formato canônico Zod e validador V-01 a V-08; não duplicar essas regras.
- `packages/engine`: interpretação direta do grafo de conversa.
- Infra local: PostgreSQL 16 e Redis 7 previstos em `docker-compose.yml`.
- Deploy planejado/documentado: web na Vercel, API no Railway e PostgreSQL gerenciado.

## Estado implementado

- Estrutura do monorepo e configuração TypeScript prontas.
- Contrato de dados compartilhado e validador implementados, com 9 testes.
- Motor inicial do grafo implementado, com 2 testes.
- API Express disponível com `GET /health` e `POST /definicoes/validar`.
- Schema Drizzle, migração inicial e seed presentes.
- Frontend com rotas de Painel, Estúdio e Catálogo.
- Estúdio renderiza uma definição de exemplo no React Flow e permite validação local.
- Marca visível alterada de `Syncra` para `Syncra Bot` no cabeçalho, título do navegador e catálogo.

### Camada de demonstração (outubro de 2026)

Tudo abaixo roda só no navegador, sem backend, e está marcado na interface como demonstração:

- `/` landing animada e `/entrar` login mockado (qualquer e-mail entra; sessão em `localStorage`). Rotas do app ficam em `/app/*` com guarda de sessão.
- Estúdio: arraste de nós corrigido (antes o React Flow controlado não tinha `onNodesChange`), arrastar da paleta para o canvas, tecla Delete, snap na grade, auto-layout em camadas ("Organizar"), badges de início/erro por nó e **simulador de conversa** que usa `@syncra/engine` de verdade; nós `ia` recebem resposta simulada.
- Marketplace com 10 fluxos mockados (`apps/web/src/data/marketplace.ts`), todos válidos no validador V-01..V-08, com busca, filtros, prévia do grafo e checkout sandbox simulado que carrega o fluxo no estúdio.
- Integrações: assistente simulado de WhatsApp/Meta (cadastro incorporado, número, webhook, verificação) e painel conectado com prévia em telefone. O token digitado nunca é salvo — só os 4 últimos caracteres.
- Ícones SVG próprios em `components/Icon.tsx` (sem dependência nova).

Nada disso substitui E2 (auth real), E7 (catálogo na API) ou a integração real com a Meta; quando esses chegarem, troque os stores `sessao`, `integracoes` e os dados de `data/marketplace.ts` pelas chamadas à API.

O código de backend ainda representa o esqueleto E1. Autenticação, persistência dos bots, edição completa do grafo, conversa real, catálogo funcional, assinatura e integrações de IA ainda não estão concluídos.

## Estado validado no handoff

Foram executados com sucesso:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @syncra/shared test
corepack pnpm --filter @syncra/engine test
corepack pnpm --filter @syncra/web build
```

Resultado: 11 testes aprovados e build de produção do frontend concluído.

Durante a validação local:

- Web: `http://localhost:5173`
- API: `http://localhost:3001/health`
- Redis respondeu `PONG` pelo Compose.
- A porta `5432` estava ocupada por uma instalação nativa do PostgreSQL; por isso o serviço `postgres` do Compose não foi iniciado. Verifique o processo/porta antes de tentar subir esse contêiner e não encerre o banco existente sem autorização.

O repositório fixa `pnpm@9.15.0`. Prefira comandos com `corepack pnpm` para evitar divergência com uma instalação global de outra versão.

## Como continuar

1. Verifique `git status`, a branch e as instruções acima antes de editar.
2. Suba web e API em terminais separados com `corepack pnpm --filter @syncra/web dev` e `corepack pnpm --filter @syncra/api dev`.
3. Inspecione a interface renderizada em desktop e mobile antes de alterar o design.
4. Mantenha nomes técnicos existentes (`@syncra/*`, `syncra-api`, nomes de banco e imports) até existir uma necessidade explícita de migração; `Syncra Bot` é a marca visível.
5. Para a evolução funcional, respeite a ordem e os critérios de aceite de `docs/04-plano-de-implementacao.md`. O próximo marco arquitetural importante continua sendo E4: um bot montado no editor conversar pela interface web.
6. Antes de cada commit, execute os testes dos pacotes afetados e o build do frontend quando houver mudança visual.

## Invariantes que não devem ser quebrados

- `packages/shared` é a única fonte do formato canônico e das regras V-01 a V-08.
- O backend deve revalidar definições antes de gravar.
- Nunca executar código vindo da definição de um bot.
- Toda leitura futura de dados de negócio deve ser isolada por `conta_id`.
- Chaves de IA e demais segredos permanecem apenas no backend e fora do Git.
- Conversas devem ficar presas à versão do bot com que começaram.
