import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const contas = pgTable("contas", {
  id: uuid("id").primaryKey(),
  nome: text("nome").notNull(),
  criadoEm: timestamptz("criado_em").notNull(),
  excluidoEm: timestamptz("excluido_em"),
});

export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey(),
  contaId: uuid("conta_id")
    .notNull()
    .references(() => contas.id),
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  papel: text("papel").notNull(),
  criadoEm: timestamptz("criado_em").notNull(),
});

export const planos = pgTable("planos", {
  id: uuid("id").primaryKey(),
  nome: text("nome").notNull(),
  precoCentavos: integer("preco_centavos").notNull(),
  tetoMensagensMes: integer("teto_mensagens_mes"),
  maxBots: integer("max_bots").notNull(),
  ativo: boolean("ativo").notNull(),
});

export const assinaturas = pgTable("assinaturas", {
  id: uuid("id").primaryKey(),
  contaId: uuid("conta_id")
    .notNull()
    .references(() => contas.id),
  planoId: uuid("plano_id")
    .notNull()
    .references(() => planos.id),
  estado: text("estado").notNull(),
  referenciaExterna: text("referencia_externa"),
  inicioEm: timestamptz("inicio_em").notNull(),
  fimEm: timestamptz("fim_em"),
});

export const eventosPagamento = pgTable("eventos_pagamento", {
  id: uuid("id").primaryKey(),
  assinaturaId: uuid("assinatura_id")
    .notNull()
    .references(() => assinaturas.id),
  tipo: text("tipo").notNull(),
  payload: jsonb("payload").notNull(),
  idEventoExterno: text("id_evento_externo").notNull().unique(),
  recebidoEm: timestamptz("recebido_em").notNull(),
});

export const bots = pgTable("bots", {
  id: uuid("id").primaryKey(),
  contaId: uuid("conta_id")
    .notNull()
    .references(() => contas.id),
  nome: text("nome").notNull(),
  versaoPublicadaId: uuid("versao_publicada_id"),
  origemCatalogoId: uuid("origem_catalogo_id"),
  ativo: boolean("ativo").notNull(),
  criadoEm: timestamptz("criado_em").notNull(),
  excluidoEm: timestamptz("excluido_em"),
});

export const botVersoes = pgTable(
  "bot_versoes",
  {
    id: uuid("id").primaryKey(),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id),
    numero: integer("numero").notNull(),
    definicao: jsonb("definicao").notNull(),
    modoCriacao: text("modo_criacao").notNull(),
    publicadaEm: timestamptz("publicada_em"),
    criadoEm: timestamptz("criado_em").notNull(),
  },
  (t) => ({
    botNumero: unique().on(t.botId, t.numero),
    porBot: index("bot_versoes_bot_id_numero_idx").on(t.botId, t.numero),
  }),
);

export const catalogoItens = pgTable("catalogo_itens", {
  id: uuid("id").primaryKey(),
  botVersaoId: uuid("bot_versao_id")
    .notNull()
    .references(() => botVersoes.id),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  categoria: text("categoria").notNull(),
  precoCentavos: integer("preco_centavos").notNull(),
  publicado: boolean("publicado").notNull(),
  publicadoEm: timestamptz("publicado_em"),
});

export const aquisicoes = pgTable("aquisicoes", {
  id: uuid("id").primaryKey(),
  contaId: uuid("conta_id")
    .notNull()
    .references(() => contas.id),
  catalogoItemId: uuid("catalogo_item_id")
    .notNull()
    .references(() => catalogoItens.id),
  botGeradoId: uuid("bot_gerado_id")
    .notNull()
    .references(() => bots.id),
  adquiridoEm: timestamptz("adquirido_em").notNull(),
});

export const conversas = pgTable(
  "conversas",
  {
    id: uuid("id").primaryKey(),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id),
    botVersaoId: uuid("bot_versao_id")
      .notNull()
      .references(() => botVersoes.id),
    canal: text("canal").notNull(),
    identificadorExterno: text("identificador_externo"),
    noAtual: text("no_atual"),
    variaveis: jsonb("variaveis").notNull().default({}),
    estado: text("estado").notNull(),
    consentimentoEm: timestamptz("consentimento_em"),
    iniciadaEm: timestamptz("iniciada_em").notNull(),
    encerradaEm: timestamptz("encerrada_em"),
    expurgoEm: timestamptz("expurgo_em"),
  },
  (t) => ({
    botEstado: index("conversas_bot_id_estado_idx").on(t.botId, t.estado),
  }),
);

export const mensagens = pgTable(
  "mensagens",
  {
    id: uuid("id").primaryKey(),
    conversaId: uuid("conversa_id")
      .notNull()
      .references(() => conversas.id),
    papel: text("papel").notNull(),
    conteudo: text("conteudo").notNull(),
    noId: text("no_id"),
    tokensEntrada: integer("tokens_entrada"),
    tokensSaida: integer("tokens_saida"),
    custoInferenciaCentavos: integer("custo_inferencia_centavos"),
    custoCanalCentavos: integer("custo_canal_centavos"),
    latenciaMs: integer("latencia_ms"),
    criadaEm: timestamptz("criada_em").notNull(),
  },
  (t) => ({
    porConversa: index("mensagens_conversa_id_criada_em_idx").on(t.conversaId, t.criadaEm),
  }),
);

export const consumos = pgTable(
  "consumos",
  {
    id: uuid("id").primaryKey(),
    contaId: uuid("conta_id")
      .notNull()
      .references(() => contas.id),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id),
    periodo: date("periodo").notNull(),
    mensagens: integer("mensagens").notNull().default(0),
    custoTotalCentavos: integer("custo_total_centavos").notNull().default(0),
  },
  (t) => ({
    botPeriodo: unique().on(t.botId, t.periodo),
  }),
);
