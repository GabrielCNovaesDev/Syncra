import { useEffect, useRef, useState, type FormEvent } from "react";
import { io, type Socket } from "socket.io-client";
import { Icon } from "./Icon";
import { baseURL } from "../store/sessao";

type Mensagem = { id: string; papel: string; conteudo: string; noId: string | null };
type Estado = "ativa" | "aguardando_entrada" | "encerrada" | "bloqueada";
type Conversa = {
  id: string; versao: number; estado: Estado; noAtual: string | null; mensagens: Mensagem[];
};

type Props = {
  botId: string;
  contaId: string;
  nome: string;
  aoMudarNoAtivo: (id: string | null) => void;
  aoFechar: () => void;
};

async function requisicao<T>(rota: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${baseURL}${rota}`, {
    ...init, credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!resposta.ok) throw new Error("Não foi possível carregar a conversa.");
  return resposta.json() as Promise<T>;
}

export function ConversaReal({ botId, contaId, nome, aoMudarNoAtivo, aoFechar }: Props) {
  const chave = `syncra.conversa.${contaId}.${botId}`;
  const socketRef = useRef<Socket | null>(null);
  const conversaIdRef = useRef<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [estado, setEstado] = useState<Estado>("ativa");
  const [versao, setVersao] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [trecho, setTrecho] = useState("");
  const [ocupado, setOcupado] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  function avancar(conversaId: string, entrada?: string) {
    setErro(null);
    setOcupado(true);
    socketRef.current?.emit("conversa:avancar", { conversaId, texto: entrada },
      (resposta: { ok: boolean; erro?: string }) => {
        if (!resposta.ok) { setErro(resposta.erro || "Erro na conversa."); setTrecho(""); }
        setOcupado(false);
      });
  }

  async function criarConversa() {
    const criada = await requisicao<{ id: string; versao: number }>("/api/conversas", {
      method: "POST", body: JSON.stringify({ botId }),
    });
    conversaIdRef.current = criada.id;
    try { localStorage.setItem(chave, criada.id); } catch { /* Mantém em memória. */ }
    setMensagens([]);
    setEstado("ativa");
    setVersao(criada.versao);
    setTrecho("");
    avancar(criada.id);
  }

  useEffect(() => {
    let cancelado = false;
    const socket = io(baseURL, { path: "/socket.io", withCredentials: true, autoConnect: false });
    socketRef.current = socket;
    socket.on("conversa:mensagem", (mensagem: Mensagem) => {
      setTrecho("");
      setMensagens((atual) => atual.some((item) => item.id === mensagem.id) ? atual : [...atual, mensagem]);
    });
    socket.on("conversa:delta", ({ trecho: delta }: { trecho: string }) =>
      setTrecho((atual) => atual + delta));
    socket.on("conversa:estado", ({ estado: proximo, noAtual }: { estado: Estado; noAtual: string | null }) => {
      setEstado(proximo);
      aoMudarNoAtivo(proximo === "encerrada" ? null : noAtual);
    });
    socket.on("conversa:erro", ({ erro: mensagem }: { erro: string }) => {
      setErro(mensagem);
      setTrecho("");
      setOcupado(false);
    });
    socket.on("connect_error", () => {
      setErro("Não foi possível conectar à conversa. Entre novamente se a sessão expirou.");
      setOcupado(false);
    });
    socket.on("connect", () => {
      void (async () => {
        try {
          let anterior = conversaIdRef.current;
          if (!anterior) { try { anterior = localStorage.getItem(chave); } catch { /* Mantém em memória. */ } }
          if (anterior) {
            const resposta = await fetch(`${baseURL}/api/conversas/${anterior}`, { credentials: "include" });
            if (resposta.ok) {
              const conversa = await resposta.json() as Conversa;
              if (cancelado) return;
              conversaIdRef.current = conversa.id;
              setMensagens(conversa.mensagens);
              setEstado(conversa.estado);
              setVersao(conversa.versao);
              aoMudarNoAtivo(conversa.estado === "encerrada" ? null : conversa.noAtual);
              if (conversa.estado === "ativa") avancar(conversa.id);
              else setOcupado(false);
              return;
            }
            try { localStorage.removeItem(chave); } catch { /* Mantém em memória. */ }
          }
          if (!cancelado) await criarConversa();
        } catch (falha) {
          if (!cancelado) { setErro(falha instanceof Error ? falha.message : "Erro ao iniciar conversa."); setOcupado(false); }
        }
      })();
    });
    socket.connect();
    return () => { cancelado = true; socket.disconnect(); socketRef.current = null; aoMudarNoAtivo(null); };
    // A conversa pertence ao bot e à conta selecionados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId, contaId]);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [mensagens, trecho]);

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    const entrada = texto.trim();
    if (!entrada || !conversaIdRef.current || estado !== "aguardando_entrada" || ocupado) return;
    setTexto("");
    avancar(conversaIdRef.current, entrada);
  }

  return (
    <aside className="simulator" aria-label="Conversa real com o bot">
      <div className="simulator-head">
        <span className="simulator-avatar"><Icon name="bot" size={18} /></span>
        <div><strong>{nome}</strong><small><i className="online" /> Conversa salva · versão {versao ?? "…"}</small></div>
        <button type="button" aria-label="Nova conversa" disabled={ocupado} onClick={() => { void criarConversa().catch((falha) => setErro(String(falha))); }}>
          <Icon name="refresh" size={15} />
        </button>
        <button type="button" aria-label="Fechar conversa" onClick={aoFechar}><Icon name="x" size={15} /></button>
      </div>
      <div className="simulator-body">
        {mensagens.map((m) => <div key={m.id} className={`bubble bubble-${m.papel === "usuario" ? "usuario" : "bot"}`}>{m.conteudo}</div>)}
        {trecho ? <div className="bubble bubble-ia">{trecho}</div> : null}
        {erro ? <div className="bubble bubble-sistema" role="alert">{erro}</div> : null}
        {erro && estado === "ativa" && !ocupado ? (
          <button type="button" className="button button-ghost" onClick={() => { if (conversaIdRef.current) avancar(conversaIdRef.current); }}>
            Tentar novamente
          </button>
        ) : null}
        {estado === "encerrada" ? <div className="bubble bubble-sistema">Conversa encerrada</div> : null}
        <div ref={fimRef} />
      </div>
      <form className="simulator-input" onSubmit={enviar}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)}
          disabled={estado !== "aguardando_entrada" || ocupado}
          placeholder={estado === "aguardando_entrada" ? "Digite sua resposta…" : estado === "encerrada" ? "Conversa encerrada" : "Aguarde a resposta…"} />
        <button type="submit" disabled={estado !== "aguardando_entrada" || ocupado || !texto.trim()} aria-label="Enviar resposta">
          <Icon name="arrowUpRight" size={17} />
        </button>
      </form>
    </aside>
  );
}
