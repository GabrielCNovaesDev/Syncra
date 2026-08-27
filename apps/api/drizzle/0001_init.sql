CREATE TABLE IF NOT EXISTS contas (
  id uuid PRIMARY KEY,
  nome text NOT NULL,
  criado_em timestamptz NOT NULL,
  excluido_em timestamptz
);

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY,
  conta_id uuid NOT NULL REFERENCES contas (id),
  email text NOT NULL UNIQUE,
  nome text NOT NULL,
  papel text NOT NULL,
  criado_em timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS planos (
  id uuid PRIMARY KEY,
  nome text NOT NULL,
  preco_centavos integer NOT NULL,
  teto_mensagens_mes integer,
  max_bots integer NOT NULL,
  ativo boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS assinaturas (
  id uuid PRIMARY KEY,
  conta_id uuid NOT NULL REFERENCES contas (id),
  plano_id uuid NOT NULL REFERENCES planos (id),
  estado text NOT NULL,
  referencia_externa text,
  inicio_em timestamptz NOT NULL,
  fim_em timestamptz
);

CREATE TABLE IF NOT EXISTS eventos_pagamento (
  id uuid PRIMARY KEY,
  assinatura_id uuid NOT NULL REFERENCES assinaturas (id),
  tipo text NOT NULL,
  payload jsonb NOT NULL,
  id_evento_externo text NOT NULL UNIQUE,
  recebido_em timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS bots (
  id uuid PRIMARY KEY,
  conta_id uuid NOT NULL REFERENCES contas (id),
  nome text NOT NULL,
  versao_publicada_id uuid,
  origem_catalogo_id uuid,
  ativo boolean NOT NULL,
  criado_em timestamptz NOT NULL,
  excluido_em timestamptz
);

CREATE TABLE IF NOT EXISTS bot_versoes (
  id uuid PRIMARY KEY,
  bot_id uuid NOT NULL REFERENCES bots (id),
  numero integer NOT NULL,
  definicao jsonb NOT NULL,
  modo_criacao text NOT NULL,
  publicada_em timestamptz,
  criado_em timestamptz NOT NULL,
  UNIQUE (bot_id, numero)
);

CREATE INDEX IF NOT EXISTS bot_versoes_bot_id_numero_idx ON bot_versoes (bot_id, numero DESC);

CREATE TABLE IF NOT EXISTS catalogo_itens (
  id uuid PRIMARY KEY,
  bot_versao_id uuid NOT NULL REFERENCES bot_versoes (id),
  titulo text NOT NULL,
  descricao text NOT NULL,
  categoria text NOT NULL,
  preco_centavos integer NOT NULL,
  publicado boolean NOT NULL,
  publicado_em timestamptz
);

CREATE TABLE IF NOT EXISTS aquisicoes (
  id uuid PRIMARY KEY,
  conta_id uuid NOT NULL REFERENCES contas (id),
  catalogo_item_id uuid NOT NULL REFERENCES catalogo_itens (id),
  bot_gerado_id uuid NOT NULL REFERENCES bots (id),
  adquirido_em timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS conversas (
  id uuid PRIMARY KEY,
  bot_id uuid NOT NULL REFERENCES bots (id),
  bot_versao_id uuid NOT NULL REFERENCES bot_versoes (id),
  canal text NOT NULL,
  identificador_externo text,
  no_atual text,
  variaveis jsonb NOT NULL DEFAULT '{}',
  estado text NOT NULL,
  consentimento_em timestamptz,
  iniciada_em timestamptz NOT NULL,
  encerrada_em timestamptz,
  expurgo_em timestamptz
);

CREATE INDEX IF NOT EXISTS conversas_bot_id_estado_idx ON conversas (bot_id, estado);

CREATE TABLE IF NOT EXISTS mensagens (
  id uuid PRIMARY KEY,
  conversa_id uuid NOT NULL REFERENCES conversas (id),
  papel text NOT NULL,
  conteudo text NOT NULL,
  no_id text,
  tokens_entrada integer,
  tokens_saida integer,
  custo_inferencia_centavos integer,
  custo_canal_centavos integer,
  latencia_ms integer,
  criada_em timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS mensagens_conversa_id_criada_em_idx ON mensagens (conversa_id, criada_em);

CREATE TABLE IF NOT EXISTS consumos (
  id uuid PRIMARY KEY,
  conta_id uuid NOT NULL REFERENCES contas (id),
  bot_id uuid NOT NULL REFERENCES bots (id),
  periodo date NOT NULL,
  mensagens integer NOT NULL DEFAULT 0,
  custo_total_centavos integer NOT NULL DEFAULT 0,
  UNIQUE (bot_id, periodo)
);
