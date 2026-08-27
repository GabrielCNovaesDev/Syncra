# 05 — Agentes

| Campo | Conteúdo |
| --- | --- |
| Documento | 05 — Agentes (humanos e Cursor) |
| Versão | 1.0 |
| Data | 27 de agosto de 2026 |

Cinco frentes de produto (doc 03) e um orquestrador. Cada frente humana tem um agente Cursor com o mesmo recorte, para o trabalho no repositório não depender de um único contexto de chat.

## 1. Mapa

```
syncra-orquestrador
        │
        ├── syncra-dados          (packages/shared, migrações, validador)
        ├── syncra-motor          (apps/api, packages/engine, Anthropic, Redis)
        ├── syncra-estudio        (apps/web estúdio, painel, conversa)
        └── syncra-catalogo       (catálogo, aquisição, Mercado Pago)
```

Integração com o modelo **não** é uma frente extra: vive em `syncra-motor`.

## 2. Frentes humanas (proposta para o §2 do doc 03)

Ainda é proposta até os quatro concordarem. Serve para não deixar responsável em branco.

| Frente | Responsável | Suplente | Acumula |
| --- | --- | --- | --- |
| Dados e domínio | João Guilherme Costa Carvalho | Gabriel Henrique Costa Novaes | — |
| Motor e backend | Gabriel Henrique Costa Novaes | Vinicius Prado Sobral | Integração com o modelo |
| Estúdio e frontend | Vinicius Prado Sobral | Tarso Monteiro Alves Passos | — |
| Catálogo e assinatura | Tarso Monteiro Alves Passos | João Guilherme Costa Carvalho | — |

Regras (doc 03):

- Nada entra na principal sem revisão de outro integrante.
- O responsável da frente revisa PRs na sua área.
- Mudança em formato canônico ou esquema: os quatro.
- Ninguém fica isolado numa frente por mais de duas semanas sem o suplente revisar.

## 3. Contratos entre agentes

Não esperar a frente vizinha “ficar pronta”. Estes contratos existem desde E1.

| De | Para | Contrato |
| --- | --- | --- |
| Dados | todos | `packages/shared` exporta `DefinicaoBot`, `validarDefinicao`, enums |
| Dados | Motor | Tabelas `bots`, `bot_versoes`, `conversas`, `mensagens`, `consumos` |
| Estúdio | Dados | POST/PUT envia JSON canônico; 400 se o validador falhar |
| Motor | Estúdio | Eventos Socket.io: `mensagem:delta`, `mensagem:completa`, `conversa:estado` |
| Catálogo | Dados | Aquisição é transação que copia `definicao` para nova `bot_versao` |
| Motor | Catálogo | Recusa execução se assinatura ∉ {`ativa`, `teste`} ou teto estourado |

## 4. Agentes Cursor

Usar um chat (ou Task) por agente. Não misturar recortes: um agente de estúdio não inventa colunas no banco.

### 4.1 `syncra-orquestrador`

**Faz:** ordem E0–E10, cortes de escopo, PRs, docs, conflitos de fronteira.

**Não faz:** implementar feature de produto.

**Entrada típica:** “qual a próxima tarefa desbloqueada?” / “isso é Fase 1?”

### 4.2 `syncra-dados`

**Pastas:** `packages/shared/**`, `apps/api/src/db/**`

**Faz:** Zod, V-01..V-08, Drizzle, migrações, seeds, testes de domínio.

**Não faz:** UI, prompts Anthropic, webhooks de pagamento.

**Invariantes:** UUID v4 na aplicação; timestamps UTC; dinheiro em centavos; exclusão lógica; enums em texto.

### 4.3 `syncra-motor`

**Pastas:** `packages/engine/**`, `apps/api/src/**` (exceto `db/` de propriedade de dados)

**Faz:** interpretação do grafo, contexto Redis+Postgres, Socket.io, consumo, Anthropic, BullMQ, Sentry.

**Não faz:** React Flow, checkout.

**Invariantes:** nunca executa código da definição; conversa usa `bot_versao_id` travado; teto **antes** do modelo; chave Anthropic só no servidor.

### 4.4 `syncra-estudio`

**Pastas:** `apps/web/**`

**Faz:** editor, painel, chat web, Zustand, React Flow.

**Não faz:** SQL cru, schema Zod paralelo.

**Invariantes:** importar validador de `@syncra/shared`; `metadados_editor` é só posição visual.

### 4.5 `syncra-catalogo`

**Pastas:** rotas de catálogo/assinatura em `apps/api` e telas correspondentes em `apps/web`

**Faz:** vitrine, cópia na aquisição, Mercado Pago sandbox, estados de assinatura, idempotência de webhook.

**Não faz:** motor de nós, editor.

## 5. Como disparar no Cursor

1. Trabalho largo (várias frentes): orquestrador primeiro, depois Task paralelo com o recorte do agente.
2. Trabalho fundo numa pasta: abrir o chat com o prompt do agente (abaixo) e os globs certos.
3. Formato canônico: parar e alinhar os quatro (ou o orquestrador registra a RFC no doc 02).

### Prompt-base (colar no início do chat)

```
Você é o agente {NOME} do Syncra.
Leia docs/04-plano-de-implementacao.md, docs/05-agentes.md e docs/06-decisoes-tecnicas.md.
Respeite o recorte da seção 4 deste documento. Não altere o formato canônico sem RFC.
Use @syncra/shared; não duplique Zod.
Isolamento por conta_id em toda leitura.
```

## 6. Ordem de ativação

| Etapa | Agentes ativos |
| --- | --- |
| E0–E1 | orquestrador, dados |
| E2 | dados, estudio (shell), motor (API auth) |
| E3 | estudio + dados |
| E4–E5 | motor + estudio |
| E6 | motor (prompts) + estudio |
| E7–E8 | catalogo + dados |
| E9 | motor + estudio |
| E10 | orquestrador |

## 7. Controle de versão

| Versão | Data | Descrição |
| --- | --- | --- |
| 1.0 | 27/08/2026 | Frentes humanas propostas + cinco agentes Cursor |
