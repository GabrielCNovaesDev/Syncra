import { useEffect, useMemo, useState } from "react";
import type { DefinicaoBot } from "@syncra/shared";
import { obterJSON, useBotsStore } from "../store/bots";
import { toast } from "../store/toast";
import { Modal } from "./Modal";

type Versao = { numero: number; criadoEm: string };
type Detalhe = Versao & { definicao: DefinicaoBot };

function mudancas(antes: DefinicaoBot, depois: DefinicaoBot): string[] {
  const resultado: string[] = [];
  for (const chave of ["nome", "modelo_padrao", "instrucao_global", "no_inicial", "variaveis"] as const) {
    if (JSON.stringify(antes[chave]) !== JSON.stringify(depois[chave])) {
      resultado.push(`${chave.replaceAll("_", " ")} alterado`);
    }
  }
  const antigos = new Map(antes.nos.map((no) => [no.id, no]));
  const novos = new Map(depois.nos.map((no) => [no.id, no]));
  for (const [id, no] of novos) {
    if (!antigos.has(id)) resultado.push(`Etapa adicionada: ${id}`);
    else if (JSON.stringify(antigos.get(id)) !== JSON.stringify(no)) resultado.push(`Etapa alterada: ${id}`);
  }
  for (const id of antigos.keys()) if (!novos.has(id)) resultado.push(`Etapa removida: ${id}`);
  const conexao = (c: DefinicaoBot["conexoes"][number]) => `${c.de} → ${c.para}${c.condicao ? ` (${c.condicao})` : ""}`;
  const antigas = new Set(antes.conexoes.map(conexao));
  const novas = new Set(depois.conexoes.map(conexao));
  for (const c of novas) if (!antigas.has(c)) resultado.push(`Conexão adicionada: ${c}`);
  for (const c of antigas) if (!novas.has(c)) resultado.push(`Conexão removida: ${c}`);
  return resultado;
}

export function HistoricoVersoes({ botId, alterado, aoFechar }: {
  botId: string; alterado: boolean; aoFechar: () => void;
}) {
  const restaurar = useBotsStore((s) => s.restaurar);
  const [versoes, setVersoes] = useState<Versao[]>([]);
  const [anterior, setAnterior] = useState<number | null>(null);
  const [posterior, setPosterior] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<Record<number, Detalhe>>({});
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    void obterJSON<{ versoes: Versao[] }>(`/api/bots/${botId}/versoes`)
      .then((dados) => {
        if (!ativo) return;
        setVersoes(dados.versoes);
        setPosterior(dados.versoes[0]?.numero ?? null);
        setAnterior(dados.versoes[1]?.numero ?? dados.versoes[0]?.numero ?? null);
      }).catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar versões."); });
    return () => { ativo = false; };
  }, [botId]);

  useEffect(() => {
    let ativo = true;
    for (const numero of [anterior, posterior]) {
      if (numero === null || detalhes[numero]) continue;
      void obterJSON<Detalhe>(`/api/bots/${botId}/versoes/${numero}`)
        .then((detalhe) => { if (ativo) setDetalhes((atual) => ({ ...atual, [numero]: detalhe })); })
        .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : "Erro ao comparar versões."); });
    }
    return () => { ativo = false; };
  }, [botId, anterior, posterior, detalhes]);

  const diferencas = useMemo(() => {
    if (anterior === null || posterior === null || !detalhes[anterior] || !detalhes[posterior]) return null;
    return mudancas(detalhes[anterior].definicao, detalhes[posterior].definicao);
  }, [anterior, posterior, detalhes]);

  async function aoRestaurar() {
    if (anterior === null || alterado || ocupado) return;
    setOcupado(true);
    try {
      const nova = await restaurar(botId, anterior);
      toast.sucesso("Versão restaurada", `A versão ${anterior} foi copiada para a nova versão ${nova}.`);
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível restaurar.");
    } finally { setOcupado(false); }
  }

  return (
    <Modal rotulo="Histórico de versões" aoFechar={aoFechar} className="history-modal">
      <button type="button" className="modal-close" aria-label="Fechar" onClick={aoFechar}>×</button>
      <h2>Histórico de versões</h2>
      <p>Compare duas versões salvas e recupere uma definição anterior.</p>
      {erro ? <p role="alert" className="history-error">{erro}</p> : null}
      <div className="history-selectors">
        <label>Versão de origem
          <select value={anterior ?? ""} onChange={(e) => setAnterior(Number(e.target.value))}>
            {versoes.map((v) => <option key={v.numero} value={v.numero}>v{v.numero} · {new Date(v.criadoEm).toLocaleString("pt-BR")}</option>)}
          </select>
        </label>
        <label>Comparar com
          <select value={posterior ?? ""} onChange={(e) => setPosterior(Number(e.target.value))}>
            {versoes.map((v) => <option key={v.numero} value={v.numero}>v{v.numero} · {new Date(v.criadoEm).toLocaleString("pt-BR")}</option>)}
          </select>
        </label>
      </div>
      <div className="history-diff">
        <strong>Diferenças de v{anterior ?? "…"} para v{posterior ?? "…"}</strong>
        {diferencas === null ? <p>Carregando comparação…</p> : diferencas.length === 0 ?
          <p>As definições são iguais.</p> : <ul>{diferencas.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul>}
      </div>
      {alterado ? <p className="history-error">Salve ou descarte as alterações atuais antes de restaurar.</p> : null}
      <button type="button" className="button button-primary" disabled={anterior === null || alterado || ocupado} onClick={() => { void aoRestaurar(); }}>
        {ocupado ? "Restaurando…" : `Restaurar v${anterior ?? "…"} como nova versão`}
      </button>
    </Modal>
  );
}
