# Syncra

Plataforma de criação, distribuição e marketplace de chatbots inteligentes.

Fonte de verdade de produto: `/docs`. Código novo segue `docs/04-plano-de-implementacao.md`, `docs/05-agentes.md` e `docs/06-decisoes-tecnicas.md`.

## Agentes

Trabalho de implementação usa o recorte de `docs/05-agentes.md`:

- `syncra-orquestrador` — etapas, escopo, docs
- `syncra-dados` — Zod, Drizzle, validador V-01..V-08
- `syncra-motor` — engine, API, contexto, Anthropic, consumo
- `syncra-estudio` — React, React Flow, painel, chat
- `syncra-catalogo` — vitrine, aquisição, Mercado Pago sandbox

Não duplicar o schema Zod. Não executar código contido na definição do bot. Isolar toda leitura por `conta_id`. Chaves do modelo só no backend.

## Ordem

E0 repositório → E1 contrato de dados → E2 auth → E3 editor → E4 motor+chat (marco) → E5 custo/contexto → E6 prompt → E7 catálogo → E8 assinatura → E9 consultora (cortável) → E10 piloto.
