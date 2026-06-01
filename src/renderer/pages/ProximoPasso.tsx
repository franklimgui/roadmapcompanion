import { useEffect, useMemo, useState } from "react";
import type { Sessao } from "../../lib/types";
import { VideoPlayer } from "../components/VideoPlayer";

const VIDEO_URL = "https://youtu.be/3J3OOTVrDHY";
const WHATSAPP_URL = "https://wa.link/l49fup";
const DIAS_PARA_LIBERAR = 7;

function diasDesdeCompra(validadoEm: string | undefined): number {
  if (!validadoEm) return 0;
  const inicio = new Date(validadoEm).getTime();
  const agora = Date.now();
  if (isNaN(inicio)) return 0;
  return Math.floor((agora - inicio) / (1000 * 60 * 60 * 24));
}

export function ProximoPasso() {
  const [sessao, setSessao] = useState<Sessao | null>(null);

  useEffect(() => {
    window.api.getSessao().then(setSessao);
  }, []);

  const diasComConta = useMemo(
    () => diasDesdeCompra(sessao?.validadoEm),
    [sessao]
  );

  const diasRestantes = Math.max(0, DIAS_PARA_LIBERAR - diasComConta);
  const bloqueado = diasRestantes > 0;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1 font-mono">
          Acesso direto
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">Próximo Passo</h2>
        {!bloqueado && (
          <p className="text-primary-white/60 mt-2 max-w-2xl">
            Troca de ideias real, sem automações nem robôs.
          </p>
        )}
      </div>

      {bloqueado ? (
        <EstadoBloqueado diasRestantes={diasRestantes} />
      ) : (
        <EstadoLiberado />
      )}
    </div>
  );
}

function EstadoBloqueado({ diasRestantes }: { diasRestantes: number }) {
  return (
    <div className="glass-strong rounded-2xl p-12 flex flex-col items-center text-center max-w-2xl mx-auto">
      <div className="text-6xl mb-6">🔒</div>
      <h3 className="text-3xl font-semibold tracking-tight mb-6">
        {diasRestantes === 1
          ? "Libera amanhã"
          : `Libera em ${diasRestantes} dias`}
      </h3>
      <p className="text-primary-white/70 max-w-lg leading-relaxed text-base mb-6">
        Aqui você vai aprender a escalar R$100 mil por mês com ofertas criadas
        com IA. O tempo de 7 dias é pra garantir que você tenha estudado toda
        a base e feito o nivelamento antes de começar aqui.
      </p>
      <p className="text-primary-white/50 text-sm">Volte em breve!</p>
    </div>
  );
}

function EstadoLiberado() {
  return (
    <div className="space-y-6 max-w-4xl">
      <VideoPlayer url={VIDEO_URL} titulo="Próximo Passo" />

      <div className="glass rounded-xl p-6 space-y-5">
        <div>
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-lime/80 font-mono mb-2">
            Troca de ideias real
          </div>
          <h3 className="text-xl font-semibold tracking-tight mb-3">
            Sem automações nem robôs
          </h3>
          <p className="text-primary-white/70 leading-relaxed">
            Me fala qual o gargalo da sua operação, por que você não vende ou
            escala mais. Quem sabe eu posso te ajudar a chegar no próximo
            nível, que eu considero de no mínimo{" "}
            <span className="text-lime font-medium">100k/mês</span>.
          </p>
        </div>

        <div className="pt-5 border-t border-white/[0.06]">
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono mb-3">
            Meu WhatsApp reservado pra isso
          </div>
          <button
            onClick={() => window.api.abrirLink(WHATSAPP_URL)}
            className="w-full px-5 py-3.5 rounded-lg bg-lime text-obsidian font-medium hover:lime-glow transition-all"
          >
            Abrir conversa no WhatsApp →
          </button>
          <div className="mt-3 text-xs text-primary-white/30 font-mono text-center">
            {WHATSAPP_URL}
          </div>
        </div>
      </div>
    </div>
  );
}
