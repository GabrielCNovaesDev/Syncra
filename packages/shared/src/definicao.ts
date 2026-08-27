import { z } from "zod";

export const VERSAO_SCHEMA = 1;

export const ModeloLogico = z.enum(["modelo-rapido", "modelo-qualidade"]);
export type ModeloLogico = z.infer<typeof ModeloLogico>;

export const TipoVariavel = z.enum(["texto", "numero", "booleano"]);
export type TipoVariavel = z.infer<typeof TipoVariavel>;

export const VariavelBot = z.object({
  chave: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, "chave de variável em snake_case começando por letra"),
  tipo: TipoVariavel,
  obrigatoria: z.boolean(),
});
export type VariavelBot = z.infer<typeof VariavelBot>;

export const NoMensagem = z.object({
  id: z.string().min(1),
  tipo: z.literal("mensagem"),
  texto: z.string().min(1),
});

export const NoPergunta = z.object({
  id: z.string().min(1),
  tipo: z.literal("pergunta"),
  texto: z.string().min(1),
  variavel_destino: z.string().min(1),
});

export const NoIa = z.object({
  id: z.string().min(1),
  tipo: z.literal("ia"),
  instrucao: z.string().min(1),
  modelo: ModeloLogico,
  usar_historico: z.boolean(),
});

export const NoCondicao = z.object({
  id: z.string().min(1),
  tipo: z.literal("condicao"),
  expressao: z.string().min(1),
});

export const NoEncerramento = z.object({
  id: z.string().min(1),
  tipo: z.literal("encerramento"),
  texto_final: z.string().min(1),
});

export const NoBot = z.discriminatedUnion("tipo", [
  NoMensagem,
  NoPergunta,
  NoIa,
  NoCondicao,
  NoEncerramento,
]);
export type NoBot = z.infer<typeof NoBot>;
export type TipoNo = NoBot["tipo"];

export const ConexaoBot = z.object({
  de: z.string().min(1),
  para: z.string().min(1),
  condicao: z.string().nullable(),
});
export type ConexaoBot = z.infer<typeof ConexaoBot>;

export const MetadadosEditor = z.object({
  posicoes: z.record(
    z.string(),
    z.object({
      x: z.number(),
      y: z.number(),
    }),
  ),
});
export type MetadadosEditor = z.infer<typeof MetadadosEditor>;

export const DefinicaoBot = z.object({
  versao_schema: z.literal(VERSAO_SCHEMA),
  nome: z.string().min(1),
  modelo_padrao: ModeloLogico,
  instrucao_global: z.string(),
  no_inicial: z.string().min(1),
  variaveis: z.array(VariavelBot),
  nos: z.array(NoBot).min(1),
  conexoes: z.array(ConexaoBot),
  metadados_editor: MetadadosEditor.optional(),
});
export type DefinicaoBot = z.infer<typeof DefinicaoBot>;

export const ModoCriacao = z.enum(["visual", "prompt", "consultora"]);
export type ModoCriacao = z.infer<typeof ModoCriacao>;
