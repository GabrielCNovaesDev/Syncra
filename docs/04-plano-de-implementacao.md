# 04 — Plano de Implementação Completo

| Campo | Conteúdo |
| --- | --- |
| Documento | 04 — Plano de Implementação |
| Versão | 1.0 |
| Data | 27 de agosto de 2026 |
| Situação | Base operacional para desenvolvimento |
| Origem | Documentos 00 (v1.2), 01 (v0.1), 02 (v0.1), 03 (v0.1) |
| Relacionados | [05-agentes.md](./05-agentes.md) · [06-decisoes-tecnicas.md](./06-decisoes-tecnicas.md) |

Este documento traduz as minutas em um plano executável: decisões desbloqueadas, estrutura do repositório, etapas com tarefas atômicas, agentes (humanos e Cursor) e definição de pronto.

## 1. O que estamos construindo

O Syncra é uma plataforma web para criar, executar e distribuir chatbots inteligentes, posicionada entre ferramentas no-code rasas e plataformas pesadas.

Na Fase 1 o produto entrega, em estrutura completa:

1. **Estúdio** — editor visual (prioridade 1), geração por prompt (prioridade 2), IA consultora (condicionada).
2. **Repositório** — bots versionados; conversa presa à versão com que começou.
3. **Motor** — interpreta o formato canônico; não sabe como o bot foi criado.
4. **Catálogo** — bots produzidos pela Syncra; aquisição copia a definição para a conta do cliente.
5. **Conta** — autenticação, assinatura em sandbox, teto de mensagens, observabilidade.

Fora da Fase 1: voz, widget embarcável, publicação por terceiros, pagamento real, multi-tenant em escala.

O marco que importa é **E4**: um bot montado no editor conversa de verdade.

## 2. Decisões que desbloqueiam o código

Resolvidas em [06-decisoes-tecnicas.md](./06-decisoes-tecnicas.md). Resumo:

| # | Tema | Decisão da Fase 1 |
| --- | --- | --- |
| 8.1 | Autenticação | Sessão em cookie httpOnly + e-mail/senha (Better Auth). Sem Clerk nesta fase. |
| 8.2 | Canal | Somente web. Campo `canal` permanece no banco (`web` \| `whatsapp`) para não migrar depois. |
| 8.3 | Pagamento | Mercado Pago em sandbox. |
| 8.4 | Motor | Interpretação direta do grafo a cada turno (sem compilação). |
| 8.5 | Contexto | Janela deslizante; resumo por modelo só se a medição em E5 exigir. |
| 7.3 | Retenção | 90 dias padrão (`expurgo_em`). |
| 7.4 | Teto | Parametrizável no plano; seed inicial 1.000 mensagens/mês. |

## 3. Estrutura do repositório

Monorepo TypeScript com `pnpm` workspaces.

```
Syncra/
  apps/
    api/                 # Express, Socket.io, Drizzle, BullMQ
    web/                 # Vite + React + Zustand + React Flow
  packages/
    shared/              # Zod canônico, validador, tipos, constantes
    engine/              # Motor de execução (grafo → próximo nó)
  docs/
  docker-compose.yml     # Postgres + Redis locais
  .cursor/rules/         # Regras persistentes dos agentes
```

Contratos:

- `packages/shared` é a única fonte do formato canônico e das regras V-01 a V-08.
- Frontend valida para UX; backend revalida antes de gravar. Nunca duplicar regras.
- O motor lê `definicao` e ignora `metadados_editor`.
- Nenhuma chave de modelo vai para o cliente.

## 4. Stack

| Camada | Tecnologia |
| --- | --- |
| Web | React 18, Vite, React Flow, Zustand, Tailwind CSS |
| API | Node.js 20, Express, Socket.io |
| Validação | Zod 3 (compartilhado) |
| ORM | Drizzle + PostgreSQL (Neon em nuvem) |
| Cache / filas | Redis + BullMQ |
| Auth | Better Auth (e-mail/senha) |
| IA | Anthropic (modelo rápido vs. qualidade) |
| Pagamento | Mercado Pago sandbox |
| Observabilidade | Sentry + tabela `mensagens` (tokens, custo, latência) |
| Implantação | Web na Vercel, API no Railway |

## 5. Agentes

Detalhe em [05-agentes.md](./05-agentes.md).

Cinco frentes para quatro pessoas. Integração com o modelo acumula em **Motor e backend**.

| Frente | Responsável (proposta) | Suplente | Agente Cursor |
| --- | --- | --- | --- |
| Dados e domínio | João Guilherme | Gabriel | `syncra-dados` |
| Motor e backend + modelo | Gabriel | Vinicius | `syncra-motor` |
| Estúdio e frontend | Vinicius | Tarso | `syncra-estudio` |
| Catálogo e assinatura | Tarso | João Guilherme | `syncra-catalogo` |
| Orquestração / E0 | Os quatro | — | `syncra-orquestrador` |

A proposta de nomes desbloqueia o plano 03 §8.1. Pode ser reatribuída na primeira reunião; o código não depende dos nomes, depende das fronteiras.

## 6. Sequência de construção

### E0 — Repositório e decisões (atual)

**Pronto quando:** decisões 8.1–8.5 documentadas; monorepo sobe; Postgres e Redis via Compose; `.env.example` sem segredos.

- [x] Resolver decisões da arquitetura (doc 06)
- [x] Definir agentes e regras Cursor
- [ ] `pnpm` workspaces, TypeScript, ESLint, Prettier
- [ ] `docker-compose` (Postgres 16 + Redis 7)
- [ ] README de setup local

### E1 — Contrato de dados

**Pronto quando:** migrações sobem do zero; Zod rejeita definições que ferem V-01..V-08; testes do validador passam.

- Esquema Drizzle = doc 02 (contas, usuarios, planos, assinaturas, eventos_pagamento, bots, bot_versoes, catalogo_itens, aquisicoes, conversas, mensagens, consumos)
- Índices: `(bot_id, estado)` em conversas; `(conversa_id, criada_em)` em mensagens; `(bot_id, numero desc)` em bot_versoes
- Pacote `shared`: `DefinicaoBot`, nós, conexões, validador
- Seed: plano Starter (teto 1000, max 5 bots, preço referência)

### E2 — Conta e painel esqueleto

**Pronto quando:** cadastro/login isolam dados por `conta_id`; rotas autenticadas recusam recurso de outra conta.

- Better Auth + tabelas de sessão
- Layout do painel: lista de bots vazia, conta, logout
- Isolamento: toda query filtra `conta_id`

### E3 — Editor visual (F-01, CA-01) — prioridade 1

**Pronto quando:** usuário autenticado monta fluxo com os 5 tipos de nó, incluindo uma condicional, e grava versão válida.

- React Flow: mensagem, pergunta, ia, condicao, encerramento
- Persistência: POST cria bot + versão 1; PUT cria nova versão (imutabilidade)
- Validador no cliente (aviso) e no servidor (bloqueio)
- Auto-layout se `metadados_editor.posicoes` estiver vazio

### E4 — Motor + conversa web (F-04, F-10, CA-05) — marco

**Pronto quando:** bot do editor responde na UI web; conversa fica presa a `bot_versao_id`.

- Carregar versão travada, não a mais recente
- Interpretar grafo: mensagem → pergunta → ia → condição → encerramento
- Socket.io + streaming da resposta de nós `ia`
- Persistência de mensagens

### E5 — Contexto, consumo, observabilidade (F-12, F-13, CA-03, CA-08, CA-09)

**Pronto quando:** 10 turnos mantêm contexto; teto bloqueia antes da chamada; erro de modelo não derruba a API.

- Redis: `no_atual`, variáveis, trecho recente
- Postgres: histórico e `consumos`
- Janela deslizante; teto no Redis com consolidação mensal
- Tokens, `custo_inferencia_centavos`, `custo_canal_centavos`, `latencia_ms`
- Sentry

### E6 — Criação por prompt (F-02, CA-02)

**Pronto quando:** definição gerada abre no editor, edita e salva sem perda.

- Prompt de sistema: JSON exclusivo no schema v1
- Validar → persistir ou devolver erros ao usuário
- `modo_criacao = prompt`

### E7 — Catálogo (F-06, F-07, CA-06)

**Pronto quando:** aquisição copia definição; editar a cópia não altera a origem.

- Vitrine, busca, detalhe
- Transação: `aquisicoes` + bot novo + `bot_versoes`
- Seed de pelo menos 3 bots Syncra

### E8 — Assinatura sandbox (F-08, F-09, CA-07, CA-10)

**Pronto quando:** webhook assinado ativa conta; cancelamento desativa bots; idempotência por `id_evento_externo`.

- Checkout Mercado Pago sandbox
- Estados: `teste` | `ativa` | `inadimplente` | `cancelada`
- Motor recusa conversa se assinatura não estiver `ativa` ou `teste`

### E9 — IA consultora (F-03) — cortar se o prazo apertar

**Pronto quando:** sugestões aparecem sem gravar sozinhas; usuário confirma.

### E10 — Piloto

Medir custo/conversa, uso por `modo_criacao`, latência percebida; fechar teto e preço.

## 7. Tarefas da sprint atual (E0 + E1)

Ordem de execução nesta sessão e nas imediatas:

1. Documentos 04, 05, 06 e regras Cursor
2. Monorepo, Compose, env de exemplo
3. `packages/shared` (schema + validador + testes)
4. `packages/engine` (esqueleto: percorrer mensagem/pergunta/encerramento sem IA)
5. `apps/api`: health, Drizzle, migrate
6. `apps/web`: shell Vite + rota `/studio` com canvas React Flow vazio conectado ao tipo compartilhado

## 8. Critérios de aceite mapeados

| CA | Etapa |
| --- | --- |
| CA-01 editor com condicional | E3 |
| CA-02 prompt ↔ visual | E6 |
| CA-03 contexto em 10 mensagens | E5 |
| CA-04 latência percebida | E5 + piloto |
| CA-05 persistência após restart | E4 |
| CA-06 catálogo | E7 |
| CA-07 assinatura sandbox | E8 |
| CA-08 teto | E5 |
| CA-09 erros de modelo | E5 |
| CA-10 disponibilidade com conta ativa | E8 |

## 9. Regras de execução (do doc 03)

- Branch principal implantável; trabalho em branches curtas
- Sem merge sem revisão de outro integrante
- Formato canônico e esquema: concordância dos quatro
- Etapa não concluída não é abandonada para começar outra
- Documentação Markdown em `/docs`, na mesma entrega
- Custo de inferência separado de custo de canal desde a primeira migração
- Teto checado **antes** da chamada ao modelo

## 10. Riscos operacionais

| Sinal | Resposta |
| --- | --- |
| E3 atrasando | Cortar nós para mensagem, pergunta, ia; condição depois de E4 |
| Custo cego | Não abrir piloto antes de E5 |
| Divergência prompt/editor | Não iniciar E6 antes do Zod estável |
| Frente parada 2+ dias | Orquestrador antecipa o contrato de interface |

## 11. Controle de versão

| Versão | Data | Descrição |
| --- | --- | --- |
| 1.0 | 27/08/2026 | Plano operacional derivado das minutas 00–03; início de E0/E1 |
