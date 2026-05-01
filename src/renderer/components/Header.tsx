import type { Perfil } from "../../lib/types";

interface Props {
  perfil: Perfil;
}

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function Header({ perfil }: Props) {
  return (
    <header className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between">
      <div>
        <div
          className="text-[0.65rem] tracking-[0.12em] uppercase text-primary-white/40 mb-1"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {saudacao()}, <span className="text-lime">{perfil.nome}</span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="px-3 py-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] text-[0.7rem] tracking-[0.08em] uppercase text-primary-white/60"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          {perfil.nicho}
        </div>
      </div>
    </header>
  );
}
