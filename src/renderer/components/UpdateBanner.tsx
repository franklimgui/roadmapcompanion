import { useEffect, useState } from "react";
import type { UpdateStatus } from "../../lib/types";

/**
 * Banner discreto que aparece no topo do app quando há update.
 *
 * Estados visuais:
 * - downloading: faixa amarela com progresso
 * - downloaded: faixa lime "Reiniciar pra atualizar"
 * - error: faixa vermelha (raro, só mostra se persistir)
 *
 * Estados invisíveis (não renderiza nada):
 * - idle, checking, available, up-to-date
 */
export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ tipo: "idle" });
  const [reiniciando, setReiniciando] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    window.api.getUpdateStatus().then((s) => setStatus(s));
    unsub = window.api.onUpdateStatus((s) => setStatus(s));

    return () => {
      if (unsub) unsub();
    };
  }, []);

  async function reiniciar() {
    setReiniciando(true);
    await window.api.instalarUpdate();
  }

  if (status.tipo === "downloading") {
    return (
      <div className="no-print w-full bg-amber-400/10 border-b border-amber-400/30 px-6 py-2">
        <div className="flex items-center gap-3 text-sm">
          <div
            className="size-1.5 rounded-full bg-amber-400 animate-pulse-dot"
            style={{ flexShrink: 0 }}
          />
          <span className="text-amber-200/90">
            Baixando atualização em background ({status.progresso}%)...
          </span>
        </div>
      </div>
    );
  }

  if (status.tipo === "mac-update-disponivel") {
    return (
      <div className="no-print w-full bg-lime/10 border-b border-lime/30 px-6 py-2">
        <div className="flex items-center justify-between gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="size-1.5 rounded-full bg-lime animate-pulse-dot"
              style={{ flexShrink: 0 }}
            />
            <span className="text-lime/90">
              Nova versão ({status.versao}) disponível pra Mac.
            </span>
          </div>
          <button
            onClick={() => window.api.abrirLink(status.urlPagina)}
            className="px-3 py-1 rounded-md bg-lime text-obsidian text-xs font-medium tracking-tight hover:lime-glow transition-all"
          >
            Baixar nova versão
          </button>
        </div>
      </div>
    );
  }

  if (status.tipo === "downloaded") {
    return (
      <div className="no-print w-full bg-lime/10 border-b border-lime/30 px-6 py-2">
        <div className="flex items-center justify-between gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="size-1.5 rounded-full bg-lime animate-pulse-dot"
              style={{ flexShrink: 0 }}
            />
            <span className="text-lime/90">
              Nova versão{status.versao ? ` (${status.versao})` : ""} pronta pra
              instalar.
            </span>
          </div>
          <button
            onClick={reiniciar}
            disabled={reiniciando}
            className="px-3 py-1 rounded-md bg-lime text-obsidian text-xs font-medium tracking-tight hover:lime-glow transition-all disabled:opacity-50"
          >
            {reiniciando ? "Reiniciando..." : "Reiniciar e atualizar"}
          </button>
        </div>
      </div>
    );
  }

  // Erros de verificação de update são silenciosos pro aluno (servidor fora,
  // sem asset pra plataforma, etc). Aluno não pode fazer nada com isso, então
  // não mostramos banner vermelho assustador. Logamos pro Console pra debug.
  if (status.tipo === "error") {
    if (typeof console !== "undefined") {
      console.warn("[update] verificação falhou:", status.mensagem);
    }
    return null;
  }

  return null;
}
