# 06 — Decisões Técnicas da Fase 1

| Campo | Conteúdo |
| --- | --- |
| Documento | 06 — Decisões (desbloqueio da minuta 01 §8 e 02 §7) |
| Versão | 1.0 |
| Data | 27 de agosto de 2026 |
| Status | Adotadas para implementação. Revisão pelos quatro integrantes em até 30 dias. |

As minutas 01 e 02 estavam “em revisão” e bloqueavam E0. Este documento fecha os itens com a opção mais barata de reverter e alinhada ao doc 00 (canal web, orçamento restrito).

## 1. Autenticação (01 §8.1)

**Escolha:** Better Auth com e-mail e senha, sessão em cookie httpOnly.

**Por quê:** Clerk cobra por usuário ativo; Auth.js é centrado em Next.js e o backend é Express. Better Auth cobre Express + SPA.

**Reverter para Clerk:** trocar o adaptador de sessão; contas e `conta_id` permanecem.

## 2. Canal da Fase 1 (01 §8.2 · 02 §7.1)

**Escolha:** somente interface web (F-10). WhatsApp fora desta fase.

**Banco:** coluna `conversas.canal` com valores `web` | `whatsapp`. MVP grava sempre `web`.

**Por quê:** o escopo aprovado é web; os dois canais têm sessão diferente e contaminariam o motor cedo demais. O campo evita migração quando o WhatsApp entrar.

## 3. Pagamento (01 §8.3)

**Escolha:** Mercado Pago, credenciais de sandbox por env.

**Por quê:** já citado na análise inicial; webhooks com `id_evento_externo` único (doc 02).

**Código:** nenhuma ramificação `if (sandbox)`. Só `MERCADOPAGO_ACCESS_TOKEN` e webhook secret por ambiente.

## 4. Execução dos nós (01 §8.4 · 02 §7.2)

**Escolha:** interpretação direta do grafo a cada turno.

**Estado da conversa:** colunas `no_atual` + `variaveis jsonb` (já no contrato). Sem tabela extra de máquina de estados.

**Por quê:** mais fácil de depurar no piloto. Compilação pode ser avaliada depois de E4 se a latência do motor (não a do modelo) aparecer na medição.

## 5. Resumo de contexto (01 §8.5)

**Escolha:** janela deslizante (N últimos turnos + instrução do nó + variáveis). Sem chamada extra de resumo na v1.

**Por quê:** resumo por modelo aumenta custo, que já é restrição. Se CA-03 falhar com janela só, aí introduz-se resumo.

**N inicial:** 12 mensagens na janela (cobre o mínimo de 10 do CA-03 com folga).

## 6. LGPD e teto (02 §7.3 · §7.4)

| Item | Valor Fase 1 |
| --- | --- |
| Retenção de conteúdo | 90 dias → `expurgo_em` |
| Teto seed | 1.000 mensagens/mês, `null` = ilimitado no schema |
| Tabela `execucoes` | Não. Reavaliar após bots reais (02 §7.5) |

## 7. Modelos Anthropic

Nomes lógicos no JSON canônico, mapeados no servidor:

| `modelo_padrao` / `no.modelo` | Uso |
| --- | --- |
| `modelo-rapido` | Roteamento, geração de definição (E6), consultora |
| `modelo-qualidade` | Resposta ao usuário em nós `ia` |

IDs reais só em variáveis de ambiente (`ANTHROPIC_MODEL_FAST`, `ANTHROPIC_MODEL_QUALITY`).

## 8. O que continua parametrizável

Não são decisões de código: preço dos planos, teto definitivo, faixa de latência. Funcionalidade parametrizada; números no seed/config.

## 9. Controle de versão

| Versão | Data | Descrição |
| --- | --- | --- |
| 1.0 | 27/08/2026 | Fecha 8.1–8.5 e 7.1–7.4 para iniciar E0/E1 |
