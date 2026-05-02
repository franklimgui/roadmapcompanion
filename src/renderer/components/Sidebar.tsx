import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard", icon: "▣" },
  { to: "/roadmap", label: "Roadmap", icon: "◇" },
  { to: "/prompts", label: "Prompts", icon: "❯_" },
  { to: "/analise", label: "Análise", icon: "⊕" },
  { to: "/diario", label: "Notas", icon: "✎" },
  { to: "/conquistas", label: "Conquistas", icon: "★" },
];

interface Props {
  onLogout: () => void;
  email?: string;
}

export function Sidebar({ onLogout, email }: Props) {
  const [versao, setVersao] = useState<string>("");

  useEffect(() => {
    window.api.getVersion().then(setVersao).catch(() => setVersao(""));
  }, []);

  return (
    <aside className="w-60 shrink-0 border-r border-white/[0.06] bg-obsidian-soft flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="size-2 rounded-full bg-lime animate-pulse-dot" />
          <span
            className="text-[0.7rem] tracking-[0.12em] uppercase font-medium"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Roadmap Companion
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-lime/10 text-lime border border-lime/20"
                  : "text-primary-white/70 hover:bg-white/[0.04] hover:text-primary-white border border-transparent"
              }`
            }
          >
            <span
              className="text-base font-medium opacity-80"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer da sidebar */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-3">
        {/* Conta + Sair */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary-white/60 hover:bg-white/[0.04] hover:text-primary-white border border-transparent hover:border-white/[0.06] transition-all group"
          title="Sair da conta"
        >
          <span
            className="text-base font-medium opacity-70 group-hover:opacity-100"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            ⏻
          </span>
          <span className="flex-1 text-left">
            <span className="block">Sair</span>
            {email && (
              <span
                className="block text-[0.6rem] tracking-[0.04em] text-primary-white/30 truncate group-hover:text-primary-white/50 transition-colors"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                {email}
              </span>
            )}
          </span>
        </button>

        <div className="px-3">
          <div
            className="text-[0.65rem] tracking-[0.12em] uppercase text-primary-white/30"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {versao ? `v${versao}` : ""}
          </div>
        </div>
      </div>
    </aside>
  );
}
