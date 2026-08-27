import { describe, expect, it } from "vitest";
import { definicaoExemploValida, validarDefinicao } from "./validador.js";

describe("validarDefinicao", () => {
  it("aceita o exemplo canônico do contrato de dados", () => {
    const r = validarDefinicao(definicaoExemploValida());
    expect(r.ok).toBe(true);
  });

  it("V-01 rejeita no_inicial inexistente", () => {
    const def = definicaoExemploValida();
    def.no_inicial = "fantasma";
    const r = validarDefinicao(def);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.regra === "V-01")).toBe(true);
  });

  it("V-02 rejeita ids duplicados", () => {
    const def = definicaoExemploValida();
    def.nos.push({ ...def.nos[0], texto: "outro" });
    const r = validarDefinicao(def);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.regra === "V-02")).toBe(true);
  });

  it("V-03 rejeita conexão para nó inexistente", () => {
    const def = definicaoExemploValida();
    def.conexoes.push({ de: "no_fim", para: "nao_existe", condicao: null });
    const r = validarDefinicao(def);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.regra === "V-03")).toBe(true);
  });

  it("V-04 rejeita nó órfão", () => {
    const def = definicaoExemploValida();
    def.nos.push({
      id: "orfao",
      tipo: "mensagem",
      texto: "ninguém chega aqui",
    });
    const r = validarDefinicao(def);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.regra === "V-04")).toBe(true);
  });

  it("V-05 rejeita condição com uma saída", () => {
    const def = definicaoExemploValida();
    def.conexoes = def.conexoes.filter(
      (c) => !(c.de === "no_tem_nome" && c.condicao === "else"),
    );
    const r = validarDefinicao(def);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.regra === "V-05")).toBe(true);
  });

  it("V-06 rejeita variável não declarada", () => {
    const def = definicaoExemploValida();
    const pergunta = def.nos.find((n) => n.tipo === "pergunta");
    if (pergunta && pergunta.tipo === "pergunta") {
      pergunta.variavel_destino = "nao_existe";
    }
    const r = validarDefinicao(def);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.regra === "V-06")).toBe(true);
  });

  it("V-07 rejeita ciclo só com nós de ia/mensagem", () => {
    const r = validarDefinicao({
      versao_schema: 1,
      nome: "loop",
      modelo_padrao: "modelo-rapido",
      instrucao_global: "",
      no_inicial: "a",
      variaveis: [],
      nos: [
        { id: "a", tipo: "mensagem", texto: "oi" },
        { id: "b", tipo: "mensagem", texto: "tchau" },
        { id: "fim", tipo: "encerramento", texto_final: "fim" },
      ],
      conexoes: [
        { de: "a", para: "b", condicao: null },
        { de: "b", para: "a", condicao: null },
        { de: "a", para: "fim", condicao: null },
      ],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.regra === "V-07")).toBe(true);
  });

  it("V-08 rejeita grafo sem encerramento alcançável", () => {
    const r = validarDefinicao({
      versao_schema: 1,
      nome: "sem fim",
      modelo_padrao: "modelo-rapido",
      instrucao_global: "",
      no_inicial: "a",
      variaveis: [{ chave: "x", tipo: "texto", obrigatoria: false }],
      nos: [
        { id: "a", tipo: "pergunta", texto: "nome?", variavel_destino: "x" },
      ],
      conexoes: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erros.some((e) => e.regra === "V-08")).toBe(true);
  });
});
