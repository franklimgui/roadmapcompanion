import { useEffect, useState } from "react";
import type { AnaliseNaming, AnaliseHistorico } from "../../../lib/types";
import { config } from "../../config";
import { useToast } from "../../components/Toast";
import {
  ScoreCircle,
  CategoriaCard,
  AnaliseLoadingState,
  EstadoVazio,
  botaoExportarPDF,
} from "./shared";

export function AnaliseNamingTab() {
  const toast = useToast();
  const [nome, setNome] = useState("");
  const [contexto, setContexto] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<AnaliseNaming | null>(null);
  const [historico, setHistorico] = useState<AnaliseHistorico[]>([]);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    window.api.getHistoricoAnalises().then((h) => {
      setHistorico(h.filter((a) => a.tipo === "naming"));
    });
  }, []);

  async function analisar() {
    setErro(null);
    if (!nome.trim() || nome.trim().length < 2) {
      setErro("Digita um nome com pelo menos 2 caracteres.");
      return;
    }

    setAnalisando(true);
    setResultado(null);

    try {
      const deviceId = await window.api.getDeviceId();
      const response = await fetch(`${config.apiBaseUrl}/api/analise/naming`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          contexto: contexto.trim(),
          deviceId,
        }),
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

      const analise: AnaliseNaming = data.analise;
      setResultado(analise);
      setRestantes(data.rateLimit?.restantes ?? null);

      const nova = await window.api.addAnalise({
        tipo: "naming",
        nome: nome.trim(),
        contexto: contexto.trim(),
        analise,
        feitaEm: new Date().toISOString(),
      });
      setHistorico([nova, ...historico]);

      toast.show({
        type: "success",
        title: "Análise de naming concluída",
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
        <label className="block">
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/50 mb-2"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Nome proposto
          </div>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Roadmap Dev de Oferta"
            disabled={analisando}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 outline-none focus:border-lime/40 transition-colors placeholder:text-white/20 disabled:opacity-50"
          />
        </label>

        <label className="block">
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/50 mb-2"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Contexto (opcional, mas recomendado)
          </div>
          <textarea
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="Nicho, persona, tipo de produto. Ex: curso de programação pra infoprodutor não-técnico, R$173 ticket"
            rows={3}
            disabled={analisando}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 outline-none focus:border-lime/40 transition-colors placeholder:text-white/20 disabled:opacity-50 resize-none"
          />
        </label>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
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
          <button
            onClick={analisar}
            disabled={analisando || !nome.trim() || restantes === 0}
            className="px-6 py-2.5 rounded-lg bg-lime text-obsidian font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:lime-glow transition-all"
          >
            {analisando ? "Avaliando..." : "Avaliar nome →"}
          </button>
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.05] p-4 no-print">
          <div className="text-sm text-red-300">{erro}</div>
        </div>
      )}

      {analisando && <AnaliseLoadingState tempo="Pode levar até 20 segundos" />}

      {resultado && !analisando && <ResultadoNaming analise={resultado} />}

      {!analisando && !resultado && historico.length > 0 && (
        <HistoricoNaming
          historico={historico}
          onSelecionar={(item) => {
            setResultado(item.analise as AnaliseNaming);
            setNome(item.nome || "");
            setContexto(item.contexto || "");
          }}
        />
      )}

      {!analisando && !resultado && historico.length === 0 && (
        <EstadoVazio
          titulo="Nenhuma análise de naming ainda"
          texto="Cole o nome do seu produto/oferta aí em cima. Quanto mais contexto você der, melhor a avaliação."
        />
      )}
    </div>
  );
}

function ResultadoNaming({ analise }: { analise: AnaliseNaming }) {
  const corRisco = {
    baixo: "border-emerald-glow/30 bg-emerald-glow/[0.05] text-emerald-glow",
    medio: "border-amber-400/30 bg-amber-400/[0.05] text-amber-400",
    alto: "border-red-400/30 bg-red-400/[0.05] text-red-400",
  }[analise.riscoJuridico];

  return (
    <div className="space-y-6 animate-fade-up print-section">
      <div className="flex items-center justify-between gap-4 no-print">
        <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono">
          Resultado de naming
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
              Avaliação · "{analise.nome}"
            </div>
            <h3 className="text-xl font-semibold tracking-tight mb-2">
              {analise.scoreGeral >= 80
                ? "Nome forte"
                : analise.scoreGeral >= 60
                ? "Nome aceitável, com ajustes possíveis"
                : analise.scoreGeral >= 40
                ? "Nome precisa de revisão"
                : "Nome enfraquece a marca"}
            </h3>
            <p className="text-primary-white/70 leading-relaxed">
              {analise.resumo}
            </p>
          </div>
        </div>
      </div>

      {/* Pontos fortes e fracos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase text-lime/80 mb-3"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Pontos fortes
          </div>
          <ul className="space-y-2">
            {analise.pontosFortes.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-lime mt-0.5 shrink-0">+</span>
                <span className="text-primary-white/80">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-xl p-5">
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase text-red-400/80 mb-3"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Pontos fracos
          </div>
          <ul className="space-y-2">
            {analise.pontosFracos.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-red-400 mt-0.5 shrink-0">−</span>
                <span className="text-primary-white/80">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Score por categoria */}
      <div>
        <div
          className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-3"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Score por critério
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <CategoriaCard nome="Memorabilidade" valor={analise.scorePorCategoria.memorabilidade} />
          <CategoriaCard nome="Pronunciabilidade" valor={analise.scorePorCategoria.pronunciabilidade} />
          <CategoriaCard nome="Descritivo" valor={analise.scorePorCategoria.descritivo} />
          <CategoriaCard nome="Diferenciação" valor={analise.scorePorCategoria.diferenciacao} />
          <CategoriaCard nome="Facilidade de busca" valor={analise.scorePorCategoria.facilidadeBusca} />
        </div>
      </div>

      {/* Risco jurídico */}
      <div className={`rounded-xl p-5 border ${corRisco}`}>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="text-[0.65rem] tracking-[0.16em] uppercase opacity-80"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Risco jurídico (não é parecer formal)
          </div>
          <span
            className="text-[0.55rem] uppercase tracking-[0.12em] font-mono px-2 py-0.5 rounded border border-current bg-current/10"
          >
            {analise.riscoJuridico}
          </span>
        </div>
        <p className="text-sm text-primary-white/80 leading-relaxed">
          {analise.riscoJuridicoNota}
        </p>
      </div>

      {/* Alternativas */}
      <div>
        <div
          className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-3"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Alternativas sugeridas
        </div>
        <div className="space-y-3">
          {analise.alternativas.map((alt, i) => (
            <div key={i} className="glass rounded-xl p-4">
              <div className="font-semibold text-lime mb-1">{alt.nome}</div>
              <p className="text-sm text-primary-white/70">{alt.motivo}</p>
            </div>
          ))}
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

function HistoricoNaming({
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
          const n = a.analise as AnaliseNaming;
          return (
            <button
              key={a.id}
              onClick={() => onSelecionar(a)}
              className="w-full text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-lime/30 hover:bg-lime/[0.03] transition-all flex items-center gap-4"
            >
              <ScoreCircle valor={n.scoreGeral} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-primary-white truncate">
                  "{a.nome}"
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
