import { describe, expect, it } from "vitest";
import { definicaoExemploValida } from "@syncra/shared";
import { estadoInicial, interpretarTurno } from "./interpretar.js";

describe("interpretarTurno", () => {
  it("emite boas-vindas e pergunta o nome", () => {
    const def = definicaoExemploValida();
    const { estado, acoes } = interpretarTurno(def, estadoInicial(def));
    expect(acoes[0]).toMatchObject({ tipo: "falar", no_id: "no_boas_vindas" });
    expect(acoes[1]).toMatchObject({ tipo: "perguntar", no_id: "no_coleta_nome" });
    expect(estado.estado).toBe("aguardando_entrada");
  });

  it("grava a variável e segue para o nó de ia", () => {
    const def = definicaoExemploValida();
    const primeiro = interpretarTurno(def, estadoInicial(def));
    const segundo = interpretarTurno(def, primeiro.estado, "Ana");
    expect(segundo.estado.variaveis.nome_aluno).toBe("Ana");
    expect(segundo.acoes.some((a) => a.tipo === "chamar_ia")).toBe(true);
  });
});
