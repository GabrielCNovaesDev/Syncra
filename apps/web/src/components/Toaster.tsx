import { Icon, type NomeIcone } from "./Icon";
import { useToastStore, type TomToast } from "../store/toast";

const iconePorTom: Record<TomToast, NomeIcone> = {
  sucesso: "checkCircle",
  info: "info",
  erro: "alert",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const remover = useToastStore((s) => s.remover);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tom}`}>
          <Icon name={iconePorTom[t.tom]} size={18} />
          <div>
            <strong>{t.titulo}</strong>
            {t.descricao ? <p>{t.descricao}</p> : null}
          </div>
          <button type="button" aria-label="Fechar aviso" onClick={() => remover(t.id)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
