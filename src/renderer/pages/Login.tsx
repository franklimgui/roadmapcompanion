import { useState } from "react";
import type { Sessao } from "../../lib/types";

interface Props {
  onLogin: (sessao: Sessao) => void;
  motivoInicial?: string | null;
  emailPreenchido?: string;
}

export function Login({ onLogin, motivoInicial, emailPreenchido }: Props) {
  const [email, setEmail] = useState(emailPreenchido || "");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(motivoInicial || null);

  async function validar() {
    if (!email.trim() || !email.includes("@")) {
      setErro("Digita um email válido.");
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const { resposta, sessao } = await window.api.authValidar(
        email.trim().toLowerCase()
      );
      if (resposta.valido && sessao) {
        onLogin(sessao);
      } else {
        setErro(
          resposta.motivo || "Email não encontrado. Use o mesmo email da compra."
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro de rede";
      setErro(
        `Sem conexão com o servidor. Verifica sua internet e tenta de novo. (${msg})`
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="h-screen w-full bg-obsidian relative overflow-y-auto flex items-center justify-center">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ccff00 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-md mx-auto px-8 py-12 w-full">
        <div className="mb-10 text-center">
          <div className="text-[0.7rem] tracking-[0.18em] uppercase text-lime/80 mb-3 font-mono">
            Acesso ao Companion
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
            Entra com o email da sua{" "}
            <span className="text-lime">compra</span>
          </h1>
          <p className="text-primary-white/60 leading-relaxed text-sm">
            Use o mesmo email que você usou pra comprar o Roadmap Dev de
            Oferta.
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-6 space-y-4">
          <label className="block">
            <div className="text-[0.65rem] uppercase tracking-[0.12em] font-mono text-primary-white/50 mb-2">
              Email da compra
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !carregando && validar()}
              placeholder="seu@email.com"
              autoFocus
              disabled={carregando}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 outline-none focus:border-lime/40 transition-colors disabled:opacity-50"
            />
          </label>

          {erro && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/[0.05] p-3 text-sm text-red-300 leading-relaxed">
              {erro}
            </div>
          )}

          <button
            onClick={validar}
            disabled={carregando || !email.trim()}
            className="w-full px-6 py-3.5 rounded-lg bg-lime text-obsidian font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:lime-glow-strong transition-all"
          >
            {carregando ? "Validando..." : "Validar acesso →"}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-primary-white/40 leading-relaxed">
          Acesso revogado por engano? Manda DM no Instagram pro{" "}
          <button
            onClick={() =>
              window.api.abrirLink("https://instagram.com/franklim.gui")
            }
            className="text-primary-white/70 hover:text-lime transition-colors underline-offset-2 hover:underline"
          >
            @franklim.gui
          </button>
        </div>
      </div>
    </div>
  );
}
