import { useEffect, useRef, useState } from "react";

interface Props {
  aulaId: string;
  placeholder?: string;
}

const SAVE_DEBOUNCE_MS = 800;

/**
 * Textarea de notas por aula com auto-save debounced.
 *
 * Comportamento:
 * - Ao montar, carrega nota existente (se houver)
 * - Em cada mudança, debounce 800ms e salva em userData (notas_aulas.json)
 * - Indicador visual sutil quando salvando ("salvando..." → "salvo às HH:MM")
 * - Texto vazio remove a nota (não polui o storage)
 */
export function NotaAulaEditor({
  aulaId,
  placeholder = "Anotações dessa aula. O que aprendi, dúvidas, código que travou, próximo passo...",
}: Props) {
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aulaRef = useRef(aulaId);

  // Carrega nota existente
  useEffect(() => {
    aulaRef.current = aulaId;
    setCarregando(true);
    window.api.getNotaAula(aulaId).then((nota) => {
      setTexto(nota?.texto || "");
      setSalvoEm(nota?.atualizadoEm || null);
      setCarregando(false);
    });
  }, [aulaId]);

  // Cleanup do timer ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function onChange(novo: string) {
    setTexto(novo);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      // Garante que ainda estamos na mesma aula (modal pode ter trocado)
      if (aulaRef.current !== aulaId) return;
      setSalvando(true);
      const salva = await window.api.saveNotaAula(aulaId, novo);
      setSalvando(false);
      setSalvoEm(salva?.atualizadoEm || null);
    }, SAVE_DEBOUNCE_MS);
  }

  if (carregando) {
    return (
      <div className="text-xs text-primary-white/30 font-mono py-2">
        Carregando notas...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div
          className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono"
        >
          Suas notas dessa aula
        </div>
        <div
          className="text-[0.65rem] text-primary-white/30 font-mono"
          aria-live="polite"
        >
          {salvando
            ? "salvando..."
            : salvoEm
            ? `salvo · ${new Date(salvoEm).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""}
        </div>
      </div>
      <textarea
        value={texto}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={5}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 outline-none focus:border-lime/40 transition-colors placeholder:text-white/20 resize-y leading-relaxed"
      />
    </div>
  );
}
