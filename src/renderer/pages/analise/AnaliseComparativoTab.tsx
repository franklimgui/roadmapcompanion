import { useEffect, useState } from "react";
import type {
  AnaliseComparativo,
  AnaliseHistorico,
} from "../../../lib/types";
import { config } from "../../config";
import { useToast } from "../../components/Toast";
import {
  ScoreCircle,
  AnaliseLoadingState,
  EstadoVazio,
  botaoExportarPDF,
  ImpactoBadge,
  GateFooterBloqueado,
} from "./shared";
import { useAnaliseGate } from "../../hooks/useAnaliseGate";

export function AnaliseComparativoTab() {
  const toast = useToast();
  const gate = useAnaliseGate();
  const [urlA, setUrlA] = useState("");
  const [urlB, setUrlB] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<AnaliseComparativo | null>(null);
  const [historico, setHistorico] = useState<AnaliseHistorico[]>([]);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    window.api.getHistoricoAnalises().then((h) => {
      setHistorico(h.filter((a) => a.tipo === "comparativo"));
    });
  }, []);

  function normalizar(u: string): string {
    let n = u.trim();
    if (!/^https?:\/\//i.test(n)) n = `https://${n}`;
    return n;
  }

  async function analisar() {
    setErro(null);
    if (!gate.liberado) return;
    if (!urlA.trim() || !urlB.trim()) return;

    const a = normalizar(urlA);
    const b = normalizar(urlB);
    if (a === b) {
      setErro("As duas URLs precisam ser diferentes pra comparar.");
      return;
    }

    setAnalisando(true);
    setResultado(null);

    try {
      const deviceId = await window.api.getDeviceId();
      const response = await fetch(
        `${config.apiBaseUrl}/api/analise/comparativo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urlA: a, urlB: b, deviceId }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.ok) {
        if (response.status === 429) {
          setErro(data.detalhe || "Limite diário atingido");
          if (data.rateLimit) setRestantes(data.rateLimit.restantes);
        } else {
          setErro(
            `${data.erro || "Erro desconhecido"}${
              data.detalhe ? `. ${data.detalhe}` : ""
            }`
          );
        }
        return;
      }

      const analise: AnaliseComparativo = data.analise;
      setResultado(analise);
      setRestantes(data.rateLimit?.restantes ?? null);

      const nova = await window.api.addAnalise({
        tipo: "comparativo",
        urlA: a,
        urlB: b,
        analise,
        feitaEm: new Date().toISOString(),
      });
      setHistorico([nova, ...historico]);

      toast.show({
        type: "success",
        title: "Comparativo concluído",
        icon: "✓",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro de rede";
      setErro(`Não consegui contatar o servidor: ${msg}`);
    } finally {
      setAnalisando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-2xl p-6 no-print space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <div
              className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/50 mb-2"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              URL A (sua página, geralmente)
            </div>
            <input
              type="text"
              value={urlA}
              onChange={(e) => setUrlA(e.target.value)}
              placeholder="https://minha-lp.com"
              disabled={analisando}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 outline-none focus:border-lime/40 transition-colors placeholder:text-white/20 disabled:opacity-50"
            />
          </label>
          <label className="block">
            <div
              className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/50 mb-2"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              URL B (concorrente ou variante)
            </div>
            <input
              type="text"
              value={urlB}
              onChange={(e) => setUrlB(e.target.value)}
              placeholder="https://concorrente.com"
              disabled={analisando}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 outline-none focus:border-lime/40 transition-colors placeholder:text-white/20 disabled:opacity-50"
            />
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          {gate.liberado ? (
            <div
              className="text-xs text-primary-white/40"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {restantes !== null
                ? `${restantes} análise${restantes === 1 ? "" : "s"} restante${
                    restantes === 1 ? "" : "s"
                  } hoje`
                : "Limite: 5 análises por dia"}
            </div>
          ) : (
            <GateFooterBloqueado
              diasRestantes={gate.diasRestantes}
              dataLiberacao={gate.dataLiberacao}
            />
          )}
          <button
            onClick={analisar}
            disabled={
              analisando ||
              !urlA.trim() ||
              !urlB.trim() ||
              restantes === 0 ||
              !gate.liberado
            }
            className="px-6 py-2.5 rounded-lg bg-lime text-obsidian font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:lime-glow transition-all"
          >
            {analisando ? "Comparando..." : "Comparar A vs B →"}
          </button>
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.05] p-4 no-print">
          <div className="text-sm text-red-300">{erro}</div>
        </div>
      )}

      {analisando && (
        <AnaliseLoadingState tempo="Pode levar até 45 segundos (busca 2 páginas)" />
      )}

      {resultado && !analisando && <ResultadoComparativo analise={resultado} />}

      {!analisando && !resultado && historico.length > 0 && (
        <HistoricoComparativo
          historico={historico}
          onSelecionar={(item) => {
            setResultado(item.analise as AnaliseComparativo);
            setUrlA(item.urlA || "");
            setUrlB(item.urlB || "");
          }}
        />
      )}

      {!analisando && !resultado && historico.length === 0 && (
        <EstadoVazio
          titulo="Nenhum comparativo ainda"
          texto="Cole 2 URLs aí em cima (sua e concorrente, ou 2 versões da sua) e veja qual converte mais e por quê."
        />
      )}
    </div>
  );
}

function ResultadoComparativo({ analise }: { analise: AnaliseComparativo }) {
  const corVencedor = {
    a: "border-lime/40 bg-lime/[0.05]",
    b: "border-lime/40 bg-lime/[0.05]",
    empate: "border-amber-400/30 bg-amber-400/[0.05]",
  }[analise.vencedor];

  return (
    <div className="space-y-6 animate-fade-up print-section">
      <div className="flex items-center justify-between gap-4 no-print">
        <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono">
          Resultado do comparativo
        </div>
        {botaoExportarPDF()}
      </div>

      {/* Veredicto */}
      <div className={`glass-strong rounded-2xl p-6 border ${corVencedor}`}>
        <div className="flex items-center gap-4 mb-3">
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Veredicto
          </div>
          <span
            className="text-[0.55rem] uppercase tracking-[0.12em] font-mono px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.02] text-primary-white/60"
          >
            Confiança {analise.confianca}
          </span>
        </div>
        <h3 className="text-2xl font-semibold tracking-tight mb-3">
          {analise.vencedor === "a" && (
            <>
              Lado <span className="text-lime">A</span> vence
            </>
          )}
          {analise.vencedor === "b" && (
            <>
              Lado <span className="text-lime">B</span> vence
            </>
          )}
          {analise.vencedor === "empate" && (
            <span className="text-amber-400">Empate técnico</span>
          )}
        </h3>
        <p className="text-primary-white/70 leading-relaxed">
          {analise.resumo}
        </p>
      </div>

      {/* Lados lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LadoCard
          letra="A"
          dados={analise.ladoA}
          eVencedor={analise.vencedor === "a"}
        />
        <LadoCard
          letra="B"
          dados={analise.ladoB}
          eVencedor={analise.vencedor === "b"}
        />
      </div>

      {/* Pontos críticos */}
      <div>
        <div
          className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-3"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Pontos críticos comparados
        </div>
        <div className="space-y-3">
          {analise.pontosCriticos.map((p, i) => (
            <PontoCriticoCard key={i} ponto={p} />
          ))}
        </div>
      </div>

      {/* Como superar */}
      <div>
        <div
          className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-3"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Como o perdedor pode superar
        </div>
        <div className="glass rounded-xl p-5">
          <ul className="space-y-2">
            {analise.comoSuperarVencedor.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-lime mt-0.5 shrink-0 font-mono">
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <span className="text-primary-white/80">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {analise.observacoesExtras && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-2"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Observação extra
          </div>
          <p className="text-sm text-primary-white/70 leading-relaxed">
            {analise.observacoesExtras}
          </p>
        </div>
      )}
    </div>
  );
}

function LadoCard({
  letra,
  dados,
  eVencedor,
}: {
  letra: "A" | "B";
  dados: AnaliseComparativo["ladoA"];
  eVencedor: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        eVencedor
          ? "border-lime/40 bg-lime/[0.04] lime-glow"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-4 mb-4">
        <ScoreCircle valor={dados.score} grande />
        <div className="flex-1 min-w-0">
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Lado {letra} {eVencedor && "· vencedor"}
          </div>
          <div className="text-sm text-primary-white truncate">{dados.url}</div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div
            className="text-[0.6rem] tracking-[0.16em] uppercase text-lime/80 mb-1.5"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Pontos fortes
          </div>
          <ul className="space-y-1">
            {dados.pontosFortes.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-lime mt-0.5 shrink-0">+</span>
                <span className="text-primary-white/80">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div
            className="text-[0.6rem] tracking-[0.16em] uppercase text-red-400/80 mb-1.5"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Pontos fracos
          </div>
          <ul className="space-y-1">
            {dados.pontosFracos.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-red-400 mt-0.5 shrink-0">−</span>
                <span className="text-primary-white/80">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PontoCriticoCard({
  ponto,
}: {
  ponto: AnaliseComparativo["pontosCriticos"][0];
}) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="font-semibold text-primary-white">{ponto.aspecto}</span>
        <ImpactoBadge impacto={ponto.impacto} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div
            className="text-[0.6rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Lado A
          </div>
          <p className="text-sm text-primary-white/80">{ponto.ladoA}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <div
            className="text-[0.6rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Lado B
          </div>
          <p className="text-sm text-primary-white/80">{ponto.ladoB}</p>
        </div>
      </div>
      <div className="rounded-lg border border-lime/20 bg-lime/[0.04] p-3">
        <div
          className="text-[0.6rem] tracking-[0.16em] uppercase text-lime/80 mb-1"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Veredicto
        </div>
        <p className="text-sm text-primary-white/80">{ponto.veredito}</p>
      </div>
    </div>
  );
}

function HistoricoComparativo({
  historico,
  onSelecionar,
}: {
  historico: AnaliseHistorico[];
  onSelecionar: (a: AnaliseHistorico) => void;
}) {
  return (
    <div>
      <div
        className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-3"
        style={{ fontFamily: "JetBrains Mono, monospace" }}
      >
        Comparativos anteriores
      </div>
      <div className="space-y-2">
        {historico.slice(0, 10).map((a) => {
          const c = a.analise as AnaliseComparativo;
          return (
            <button
              key={a.id}
              onClick={() => onSelecionar(a)}
              className="w-full text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-lime/30 hover:bg-lime/[0.03] transition-all flex items-center gap-4"
            >
              <div
                className="size-12 rounded-lg bg-lime/10 border border-lime/30 flex items-center justify-center text-base font-mono font-semibold text-lime shrink-0"
              >
                {c.vencedor === "empate" ? "=" : c.vencedor.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-primary-white truncate">
                  {a.urlA}
                </div>
                <div className="text-xs text-primary-white/50 truncate">
                  vs {a.urlB}
                </div>
                <div
                  className="text-xs text-primary-white/40 mt-0.5"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {new Date(a.feitaEm).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="text-primary-white/40 text-xs">Ver →</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
