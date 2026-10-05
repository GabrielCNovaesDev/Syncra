import { useEffect, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  rotulo: string;
  className?: string;
  style?: CSSProperties;
  /** Quando ausente, o modal não fecha por Escape nem por clique fora. */
  aoFechar?: () => void;
  children: ReactNode;
};

/**
 * Renderiza no `body` para escapar de ancestrais com transform/animação, que
 * criam um novo bloco de contenção e quebram o `position: fixed`.
 */
export function Modal({ rotulo, className, style, aoFechar, children }: ModalProps) {
  useEffect(() => {
    if (!aoFechar) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar?.();
    }
    window.addEventListener("keydown", aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aoFechar]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={aoFechar}>
      <div
        className={className ? `modal ${className}` : "modal"}
        role="dialog"
        aria-modal="true"
        aria-label={rotulo}
        style={style}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
