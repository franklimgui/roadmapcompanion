import { useEffect, useState } from "react";
import type { AnaliseLP, AnaliseHistorico } from "../../../lib/types";
import { config } from "../../config";
import { useToast } from "../../components/Toast";
import {
  ScoreCircle,
  CategoriaCard,
  MudancaCard,
  AnaliseLoadingState,
  EstadoVazio,
  botaoExportarPDF,
  GateFooterBloqueado,
} from "./shared";
import { useAnaliseGate } from "../../hooks/useAnaliseGate";

export function AnaliseLPTab() {
  const toast = useToast();
  const gate = useAnaliseGate();
  const [url, setUrl] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<AnaliseLP | null>(null);
  const [historico, setHistorico] = useState<AnaliseHistorico[]>([]);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    window.api.getHistoricoAnalises().then((h) => {
      setHistorico(h.filter((a) => a.tipo === "lp"));
    });
  }, []);

  async function analisar() {
    setErro(null);
    if (!gate.liberado) return;
    if (!url.trim()) return;

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    setAnalisando(true);
    setResultado(null);

    try {
      const deviceId = await window.api.getDeviceId();
      const response = await fetch(`${config.apiBaseUrl}/api/analise/lp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl, deviceId }),
      });
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

      const analise: AnaliseLP = data.analise;
      setResultado(analise);
      setRestantes(data.rateLimit?.restantes ?? null);

      const nova = await window.api.addAnalise({
        tipo: "lp",
        url: normalizedUrl,
        analise,
        feitaEm: new Date().toISOString(),
      });
      setHistorico([nova, ...historico]);

      toast.show({
        type: "success",
        title: "Análise concluída",
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
      <div className="glass-strong rounded-2xl p-6 no-print">
        <label className="block">
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/50 mb-2"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            URL da landing page
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !analisando && analisar()}
            placeholder="https://minhaoferta.com/lp"
            disabled={analisando}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 outline-none focus:border-lime/40 transition-colors placeholder:text-white/20 disabled:opacity-50"
          />
        </label>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
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
              analisando || !url.trim() || restantes === 0 || !gate.liberado
            }
            className="px-6 py-2.5 rounded-lg bg-lime text-obsidian font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:lime-glow transition-all"
          >
            {analisando ? "Analisando..." : "Analisar →"}
          </button>
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.05] p-4 no-print">
          <div className="text-sm text-red-300">{erro}</div>
        </div>
      )}

      {analisando && <AnaliseLoadingState />}

      {resultado && !analisando && (
        <ResultadoAnaliseLP analise={resultado} url={url} />
      )}

      {!analisando && !resultado && historico.length > 0 && (
        <HistoricoLP
          historico={historico}
          onSelecionar={(item) => {
            setResultado(item.analise as AnaliseLP);
            setUrl(item.url || "");
          }}
        />
      )}

      {!analisando && !resultado && historico.length === 0 && (
        <EstadoVazio
          titulo="Nenhuma análise ainda"
          texto="Cole a URL de uma das suas LPs aí em cima e clique em Analisar. Use pra revisar antes de subir tráfego."
        />
      )}
    </div>
  );
}

function ResultadoAnaliseLP({
  analise,
  url,
}: {
  analise: AnaliseLP;
  url: string;
}) {
  return (
    <div className="space-y-6 animate-fade-up print-section">
      <div className="flex items-center justify-between gap-4 no-print">
        <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono">
          Resultado da análise
        </div>
        {botaoExportarPDF()}
      </div>

      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-start gap-6">
          <ScoreCircle valor={analise.scoreGeral} grande />
          <div className="flex-1 min-w-0">
            <div
              className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              Score geral · {url}
            </div>
            <h3 className="text-xl font-semibold tracking-tight mb-2">
              {analise.scoreGeral >= 80
                ? "Página forte"
                : analise.scoreGeral >= 60
                ? "Página aceitável, com pontos a melhorar"
                : analise.scoreGeral >= 40
                ? "Página precisa de revisão"
                : "Página perde muita conversão"}
            </h3>
            <p className="text-primary-white/70 leading-relaxed">
              {analise.resumo}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div
          className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-3"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Top mudanças por impacto
        </div>
        <div className="space-y-3">
          {analise.topMudancas.map((m, i) => (
            <MudancaCard key={i} mudanca={m} ordem={i + 1} />
          ))}
        </div>
      </div>

      {analise.pontosFortes.length > 0 && (
        <div>
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-3"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Pontos fortes
          </div>
          <div className="glass rounded-xl p-5">
            <ul className="space-y-2">
              {analise.pontosFortes.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-lime mt-0.5 shrink-0">+</span>
                  <span className="text-primary-white/80">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div>
        <div
          className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-3"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Score por categoria
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <CategoriaCard nome="Headline" valor={analise.scorePorCategoria.headline} />
          <CategoriaCard nome="Above the fold" valor={analise.scorePorCategoria.aboveTheFold} />
          <CategoriaCard nome="Prova social" valor={analise.scorePorCategoria.provaSocial} />
          <CategoriaCard nome="CTA" valor={analise.scorePorCategoria.cta} />
          <CategoriaCard nome="Oferta e preço" valor={analise.scorePorCategoria.ofertaEPreco} />
          <CategoriaCard nome="Mobile" valor={analise.scorePorCategoria.mobile} />
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

function HistoricoLP({
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
        Análises anteriores
      </div>
      <div className="space-y-2">
        {historico.slice(0, 10).map((a) => {
          const lp = a.analise as AnaliseLP;
          return (
            <button
              key={a.id}
              onClick={() => onSelecionar(a)}
              className="w-full text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-lime/30 hover:bg-lime/[0.03] transition-all flex items-center gap-4"
            >
              <ScoreCircle valor={lp.scoreGeral} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-primary-white truncate">
                  {a.url}
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
