import { useEffect, useState } from "react";
import type { EntradaDiario } from "../../lib/types";
import { verificarDesbloqueios } from "../hooks/useConquistas";
import { useToast } from "../components/Toast";

export function Journal() {
  const [entradas, setEntradas] = useState<EntradaDiario[]>([]);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();

  useEffect(() => {
    window.api.getEntradas().then(setEntradas);
  }, []);

  async function adicionar() {
    if (!texto.trim()) return;
    setSalvando(true);
    const nova = await window.api.addEntrada({
      data: new Date().toISOString(),
      texto: texto.trim(),
    });
    const atualizadas = [nova, ...entradas];
    setEntradas(atualizadas);
    setTexto("");
    setSalvando(false);
    toast.show({
      type: "success",
      title: "Anotação salva",
      icon: "✎",
    });
    const novas = await verificarDesbloqueios({ entradas: atualizadas });
    novas.forEach((c) => {
      toast.show({
        type: "achievement",
        title: c.titulo,
        icon: c.icone,
      });
    });
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div
          className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Log de execução
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">Notas</h2>
      </div>

      <div className="glass-strong rounded-2xl p-6">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="O que você fez hoje? Conquistas, travas, descobertas."
          rows={4}
          className="w-full bg-transparent outline-none resize-none placeholder:text-white/20 text-primary-white"
        />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
          <div
            className="text-[0.65rem] tracking-[0.12em] uppercase text-primary-white/30"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {texto.length} caracteres
          </div>
          <button
            onClick={adicionar}
            disabled={!texto.trim() || salvando}
            className="px-4 py-2 rounded-md bg-lime text-obsidian text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {salvando ? "Salvando..." : "Salvar anotação"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {entradas.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-primary-white/40 text-sm">
              Nenhuma anotação ainda. Anota a primeira aí em cima.
            </div>
          </div>
        )}
        {entradas.map((e) => (
          <div key={e.id} className="glass rounded-xl p-5">
            <div
              className="text-[0.65rem] tracking-[0.12em] uppercase text-primary-white/30 mb-2"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {new Date(e.data).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <p className="text-primary-white/80 whitespace-pre-wrap">{e.texto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
