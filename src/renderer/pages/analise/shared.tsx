import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Componentes compartilhados pelas 4 abas de análise (LP, Comparativo, Naming, Oferta).
 */

export function ScoreCircle({
  valor,
  grande,
}: {
  valor: number;
  grande?: boolean;
}) {
  const cor =
    valor >= 80
      ? "#10b981"
      : valor >= 60
      ? "#ccff00"
      : valor >= 40
      ? "#fbbf24"
      : "#ef4444";
  const tamanho = grande ? 88 : 56;
  const stroke = grande ? 7 : 5;
  const raio = (tamanho - stroke) / 2;
  const circ = 2 * Math.PI * raio;
  const offset = circ - (valor / 100) * circ;

  return (
    <div
      className="relative shrink-0"
      style={{ width: tamanho, height: tamanho }}
    >
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center font-semibold tracking-tight ${
          grande ? "text-2xl" : "text-base"
        }`}
        style={{ color: cor }}
      >
        {valor}
      </div>
    </div>
  );
}

export function CategoriaCard({ nome, valor }: { nome: string; valor: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-3">
      <ScoreCircle valor={valor} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-primary-white truncate">
          {nome}
        </div>
        <div className="text-xs text-primary-white/40">
          {valor >= 80
            ? "Excelente"
            : valor >= 60
            ? "Aceitável"
            : valor >= 40
            ? "Atenção"
            : "Crítico"}
        </div>
      </div>
    </div>
  );
}

interface Mudanca {
  titulo: string;
  impacto: "alto" | "medio" | "baixo";
  problema: string;
  solucao: string;
  promptSugerido?: string | null;
}

export function MudancaCard({
  mudanca,
  ordem,
}: {
  mudanca: Mudanca;
  ordem: number;
}) {
  const navigate = useNavigate();
  const [expandido, setExpandido] = useState(ordem === 1);
  const corImpacto = {
    alto: "text-red-400 border-red-400/30 bg-red-400/5",
    medio: "text-amber-400 border-amber-400/30 bg-amber-400/5",
    baixo: "text-primary-white/50 border-white/[0.08] bg-white/[0.02]",
  }[mudanca.impacto];

  function abrirPrompt() {
    if (mudanca.promptSugerido) {
      navigate(`/prompts?id=${encodeURIComponent(mudanca.promptSugerido)}`);
    }
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full text-left p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 size-8 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs font-mono font-semibold text-primary-white/60">
            {ordem.toString().padStart(2, "0")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-primary-white">
                {mudanca.titulo}
              </span>
              <span
                className={`text-[0.55rem] uppercase tracking-[0.12em] font-mono px-2 py-0.5 rounded border ${corImpacto}`}
              >
                Impacto {mudanca.impacto}
              </span>
            </div>
            {!expandido && (
              <p className="text-sm text-primary-white/50 line-clamp-1">
                {mudanca.problema}
              </p>
            )}
          </div>
          <div
            className={`text-primary-white/40 transition-transform shrink-0 ${
              expandido ? "rotate-90" : ""
            }`}
          >
            ▸
          </div>
        </div>
      </button>

      {expandido && (
        <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 space-y-4">
          <div>
            <div
              className="text-[0.6rem] tracking-[0.16em] uppercase text-red-400/80 mb-1"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              Problema
            </div>
            <p className="text-sm text-primary-white/80 leading-relaxed">
              {mudanca.problema}
            </p>
          </div>
          <div>
            <div
              className="text-[0.6rem] tracking-[0.16em] uppercase text-lime/80 mb-1"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              Solução
            </div>
            <p className="text-sm text-primary-white/80 leading-relaxed">
              {mudanca.solucao}
            </p>
          </div>
          {mudanca.promptSugerido && (
            <button
              onClick={abrirPrompt}
              className="no-print w-full text-left rounded-lg border border-lime/20 bg-lime/[0.04] p-3 text-sm hover:border-lime/40 hover:bg-lime/[0.07] transition-all flex items-center justify-between gap-2 group"
            >
              <span>
                <span className="text-lime/80 font-mono text-xs uppercase tracking-wider">
                  Prompt sugerido
                </span>{" "}
                <span className="text-lime font-mono">
                  {mudanca.promptSugerido}
                </span>
              </span>
              <span className="text-lime/60 text-xs group-hover:text-lime transition-colors">
                Abrir na biblioteca →
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AnaliseLoadingState({ tempo }: { tempo?: string }) {
  const [dotIndex, setDotIndex] = useState(0);
  const messages = [
    "Buscando o conteúdo...",
    "Analisando estrutura...",
    "Avaliando hierarquia visual...",
    "Comparando com benchmarks...",
    "Montando recomendações...",
  ];

  useEffect(() => {
    const i = setInterval(() => {
      setDotIndex((d) => (d + 1) % messages.length);
    }, 2500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="size-2 rounded-full bg-lime animate-pulse-dot mx-auto mb-4" />
      <div className="text-primary-white/70 mb-2">{messages[dotIndex]}</div>
      <div className="text-xs text-primary-white/30">
        {tempo || "Pode levar até 30 segundos"}
      </div>
    </div>
  );
}

export function EstadoVazio({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="text-2xl mb-3 font-mono opacity-40">⊕</div>
      <div className="font-semibold mb-1 text-primary-white">{titulo}</div>
      <p className="text-sm text-primary-white/50 max-w-md mx-auto">{texto}</p>
    </div>
  );
}

export function botaoExportarPDF() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-primary-white/70 hover:border-lime/30 hover:text-lime transition-all"
      style={{ fontFamily: "JetBrains Mono, monospace" }}
    >
      Exportar PDF
    </button>
  );
}

export function GateBanner({
  diasRestantes,
  dataLiberacao,
}: {
  diasRestantes: number;
  dataLiberacao: Date | null;
}) {
  const dataStr = dataLiberacao?.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-5 flex items-start gap-4 no-print animate-fade-up">
      <div className="size-10 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 text-base font-mono shrink-0">
        ⏳
      </div>
      <div className="flex-1">
        <div className="font-semibold text-amber-400 mb-1">
          Análise libera em {diasRestantes}{" "}
          {diasRestantes === 1 ? "dia" : "dias"}
          {dataStr ? ` · ${dataStr}` : ""}
        </div>
        <p className="text-sm text-primary-white/70 leading-relaxed">
          A análise consultiva com IA fica disponível 7 dias depois do seu
          primeiro acesso ao Companion. Aproveita esse tempo pra avançar nas
          aulas — quando liberar você já chega com produto rodando pra
          analisar.
        </p>
      </div>
    </div>
  );
}

export function GateFooterBloqueado({
  diasRestantes,
  dataLiberacao,
}: {
  diasRestantes: number;
  dataLiberacao: Date | null;
}) {
  const dataStr = dataLiberacao?.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  return (
    <div
      className="text-xs text-amber-300/80"
      style={{ fontFamily: "JetBrains Mono, monospace" }}
    >
      Disponível em {diasRestantes} {diasRestantes === 1 ? "dia" : "dias"}
      {dataStr ? ` · ${dataStr}` : ""}
    </div>
  );
}

export function ImpactoBadge({
  impacto,
}: {
  impacto: "alto" | "medio" | "baixo";
}) {
  const corImpacto = {
    alto: "text-red-400 border-red-400/30 bg-red-400/5",
    medio: "text-amber-400 border-amber-400/30 bg-amber-400/5",
    baixo: "text-primary-white/50 border-white/[0.08] bg-white/[0.02]",
  }[impacto];

  return (
    <span
      className={`text-[0.55rem] uppercase tracking-[0.12em] font-mono px-2 py-0.5 rounded border ${corImpacto}`}
    >
      Impacto {impacto}
    </span>
  );
}
