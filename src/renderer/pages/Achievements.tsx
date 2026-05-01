import { useEffect, useState } from "react";
import type { ConquistasState } from "../../lib/types";

interface ConquistaDef {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  comoDesbloquear: string;
}

const CONQUISTAS: ConquistaDef[] = [
  {
    id: "primeiro-passo",
    titulo: "Primeiro passo",
    descricao: "Marcou a primeira etapa como feita",
    icone: "▣",
    comoDesbloquear: "Marque qualquer aula como concluída",
  },
  {
    id: "fase-1-completa",
    titulo: "Setup pronto",
    descricao: "Concluiu a Fase 01 inteira",
    icone: "◇",
    comoDesbloquear: "Complete as 5 aulas da Fase 01",
  },
  {
    id: "fase-2-completa",
    titulo: "Fundação técnica",
    descricao: "Concluiu a Fase 02 inteira",
    icone: "◈",
    comoDesbloquear: "Complete as 5 aulas da Fase 02",
  },
  {
    id: "fase-3-completa",
    titulo: "Construindo o produto",
    descricao: "Concluiu a Fase 03 inteira",
    icone: "❖",
    comoDesbloquear: "Complete as 4 aulas da Fase 03",
  },
  {
    id: "diario-3d",
    titulo: "3 dias seguidos",
    descricao: "Manteve streak de 3 dias nas Notas",
    icone: "✦",
    comoDesbloquear: "Registre algo nas Notas 3 dias consecutivos",
  },
  {
    id: "diario-7d",
    titulo: "Uma semana inteira",
    descricao: "Manteve streak de 7 dias nas Notas",
    icone: "✧",
    comoDesbloquear: "Registre algo nas Notas 7 dias consecutivos",
  },
  {
    id: "primeiro-prompt",
    titulo: "Primeiro prompt copiado",
    descricao: "Copiou seu primeiro prompt da biblioteca",
    icone: "❯_",
    comoDesbloquear: "Copie qualquer prompt da biblioteca",
  },
  {
    id: "primeiro-saas",
    titulo: "Primeiro SaaS rodando",
    descricao: "Subiu seu primeiro produto em produção",
    icone: "★",
    comoDesbloquear: "Marca manualmente quando subir seu primeiro projeto",
  },
];

export function Achievements() {
  const [state, setState] = useState<ConquistasState | null>(null);

  useEffect(() => {
    window.api.getConquistas().then(setState);
  }, []);

  function isDesbloqueada(id: string): boolean {
    return state?.desbloqueadas.includes(id) ?? false;
  }

  const totalDesbloqueadas = state?.desbloqueadas.length ?? 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1 font-mono">
            Marcos
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">Conquistas</h2>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold text-lime tracking-tight">
            {totalDesbloqueadas} <span className="text-primary-white/30">/ {CONQUISTAS.length}</span>
          </div>
          <div className="text-[0.65rem] uppercase tracking-[0.12em] text-primary-white/40 font-mono">
            desbloqueadas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {CONQUISTAS.map((c) => {
          const unlocked = isDesbloqueada(c.id);
          return (
            <div
              key={c.id}
              className={`rounded-xl p-5 border transition-all ${
                unlocked
                  ? "bg-lime/[0.04] border-lime/20 lime-glow"
                  : "glass opacity-50"
              }`}
            >
              <div
                className={`size-12 rounded-lg flex items-center justify-center text-xl mb-3 font-mono ${
                  unlocked
                    ? "bg-lime/10 border border-lime/30 text-lime"
                    : "bg-white/[0.04] border border-white/[0.06]"
                }`}
              >
                {c.icone}
              </div>
              <div className="font-semibold text-sm mb-1">{c.titulo}</div>
              <div className="text-xs text-primary-white/50 mb-2">
                {c.descricao}
              </div>
              {!unlocked && (
                <div className="text-[0.65rem] uppercase tracking-[0.08em] text-primary-white/30 font-mono mt-2 pt-2 border-t border-white/[0.04]">
                  {c.comoDesbloquear}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
