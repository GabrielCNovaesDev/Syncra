import {
  aposRespostaIa,
  estadoInicial,
  interpretarTurno,
  type AcaoMotor,
  type EstadoConversa,
} from "@syncra/engine";
import type { DefinicaoBot } from "@syncra/shared";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "./Icon";

type Mensagem = { id: number; autor: "bot" | "usuario" | "sistema" | "ia"; texto: string };

type Props = {
  definicao: DefinicaoBot;
  valida: boolean;
  aoMudarNoAtivo: (id: string | null) => void;
  aoFechar: () => void;
};

const LIMITE_PASSOS = 40;

/**
 * Resposta simulada para nós `ia`. A chamada real ao modelo fica no backend
 * (E4/E5); aqui apenas ilustramos o lugar dela na conversa.
 */
function respostaIaSimulada(instrucao: string, variaveis: Record<string, unknown>): string {
  const instrucaoInterpolada = instrucao.replace(
    /\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g,
    (_, chave: string) => String(variaveis[chave] ?? ""),
  );
  return `Resposta gerada pela IA seguindo: “${instrucaoInterpolada}”`;
}

/** Executa o grafo até precisar de entrada do usuário ou encerrar. */
function executar(
  definicao: DefinicaoBot,
  estado: EstadoConversa,
  entrada?: string,
): { estado: EstadoConversa; falas: Omit<Mensagem, "id">[] } {
  const falas: Omit<Mensagem, "id">[] = [];
  let atual = estado;
  let primeiraEntrada = entrada;

  for (let passo = 0; passo < LIMITE_PASSOS; passo += 1) {
    const resultado = interpretarTurno(definicao, atual, primeiraEntrada);
    primeiraEntrada = undefined;
    atual = resultado.estado;

    let chamouIa = false;
    for (const acao of resultado.acoes as AcaoMotor[]) {
      if (acao.tipo === "chamar_ia") {
        falas.push({ autor: "ia", texto: respostaIaSimulada(acao.no.instrucao, atual.variaveis) });
        chamouIa = true;
      } else {
        falas.push({ autor: "bot", texto: acao.texto });
      }
    }

    if (chamouIa) {
      atual = aposRespostaIa(definicao, atual);
      if (atual.estado === "ativa") continue;
    }
    break;
  }

  if (atual.estado === "encerrada") {
    falas.push({ autor: "sistema", texto: "Conversa encerrada" });
  }
  return { estado: atual, falas };
}

let sequencia = 0;

export function SimuladorChat({ definicao, valida, aoMudarNoAtivo, aoFechar }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [estado, setEstado] = useState<EstadoConversa | null>(null);
  const [digitando, setDigitando] = useState(false);
  const [texto, setTexto] = useState("");
  const fimRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  function limparTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  function revelar(falas: Omit<Mensagem, "id">[], proximo: EstadoConversa) {
    setDigitando(true);
    falas.forEach((fala, i) => {
      const t = window.setTimeout(
        () => {
          sequencia += 1;
          setMensagens((anteriores) => [...anteriores, { ...fala, id: sequencia }]);
          if (i === falas.length - 1) {
            setDigitando(false);
            setEstado(proximo);
            aoMudarNoAtivo(proximo.estado === "encerrada" ? null : proximo.no_atual);
          }
        },
        450 + i * 650,
      );
      timers.current.push(t);
    });
    if (falas.length === 0) {
      setDigitando(false);
      setEstado(proximo);
    }
  }

  function reiniciar() {
    limparTimers();
    setMensagens([]);
    setTexto("");
    if (!valida) {
      setEstado(null);
      aoMudarNoAtivo(null);
      return;
    }
    try {
      const resultado = executar(definicao, estadoInicial(definicao));
      revelar(resultado.falas, resultado.estado);
    } catch (erro) {
      setMensagens([
        { id: ++sequencia, autor: "sistema", texto: (erro as Error).message },
      ]);
    }
  }

  // Reinicia quando o simulador abre ou quando o fluxo muda de validade.
  useEffect(() => {
    reiniciar();
    return () => {
      limparTimers();
      aoMudarNoAtivo(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valida]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, digitando]);

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (!estado || estado.estado !== "aguardando_entrada" || digitando) return;
    const entrada = texto.trim();
    if (!entrada) return;
    setTexto("");
    setMensagens((anteriores) => [...anteriores, { id: ++sequencia, autor: "usuario", texto: entrada }]);
    try {
      const resultado = executar(definicao, estado, entrada);
      revelar(resultado.falas, resultado.estado);
    } catch (erro) {
      setMensagens((anteriores) => [
        ...anteriores,
        { id: ++sequencia, autor: "sistema", texto: (erro as Error).message },
      ]);
    }
  }

  const aguardando = estado?.estado === "aguardando_entrada" && !digitando;
  const variaveis = Object.entries(estado?.variaveis ?? {});

  return (
    <aside className="simulator" aria-label="Simulador de conversa">
      <div className="simulator-head">
        <span className="simulator-avatar">
          <Icon name="bot" size={18} />
        </span>
        <div>
          <strong>{definicao.nome}</strong>
          <small>
            <i className={valida ? "online" : ""} /> {valida ? "Simulação local" : "Fluxo com pendências"}
          </small>
        </div>
        <button type="button" aria-label="Reiniciar conversa" onClick={reiniciar}>
          <Icon name="refresh" size={15} />
        </button>
        <button type="button" aria-label="Fechar simulador" onClick={aoFechar}>
          <Icon name="x" size={15} />
        </button>
      </div>

      <div className="simulator-body">
        {!valida ? (
          <div className="simulator-empty">
            <Icon name="alert" size={22} />
            <p>Corrija as pendências de validação para testar a conversa.</p>
          </div>
        ) : null}
        {mensagens.map((m) => (
          <div key={m.id} className={`bubble bubble-${m.autor}`}>
            {m.autor === "ia" ? (
              <span className="bubble-tag">
                <Icon name="sparkles" size={10} /> IA simulada
              </span>
            ) : null}
            {m.texto}
          </div>
        ))}
        {digitando ? (
          <div className="bubble bubble-bot typing" aria-label="Digitando">
            <i />
            <i />
            <i />
          </div>
        ) : null}
        <div ref={fimRef} />
      </div>

      {variaveis.length > 0 ? (
        <div className="simulator-vars">
          {variaveis.map(([chave, valor]) => (
            <span key={chave}>
              {chave}: <strong>{String(valor) || "—"}</strong>
            </span>
          ))}
        </div>
      ) : null}

      <form className="simulator-input" onSubmit={enviar}>
        <input
          value={texto}
          disabled={!aguardando}
          placeholder={
            aguardando
              ? "Digite sua resposta…"
              : estado?.estado === "encerrada"
                ? "Conversa encerrada — reinicie para testar de novo"
                : "Aguardando o bot…"
          }
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" disabled={!aguardando || !texto.trim()} aria-label="Enviar">
          <Icon name="send" size={15} />
        </button>
      </form>
    </aside>
  );
}
