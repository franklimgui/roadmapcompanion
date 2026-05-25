import { useEffect, useMemo, useState } from "react";
import roadmapData from "../data/roadmap.json";
import promptsData from "../data/prompts.json";
import type { Progresso, Sessao } from "../../lib/types";
import { VideoPlayer } from "../components/VideoPlayer";
import { NotaAulaEditor } from "../components/NotaAulaEditor";
import { verificarDesbloqueios } from "../hooks/useConquistas";
import { useToast } from "../components/Toast";

interface Etapa {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  videoUrl?: string;
  materialUrl?: string;
  duracaoMin?: number;
  promptIds?: string[];
  bloqueado?: boolean;
  desbloqueiaAposDias?: number;
}

interface Fase {
  id: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  etapas: Etapa[];
}

/**
 * Calcula quantos dias se passaram desde a data da compra.
 * validadoEm vem da Sessao, é o criado_em do registro app_usuarios no n8n
 * (data real da compra, fonte de verdade do servidor).
 */
function diasDesdeCompra(validadoEm: string | undefined): number {
  if (!validadoEm) return 0;
  const inicio = new Date(validadoEm).getTime();
  const agora = Date.now();
  if (isNaN(inicio)) return 0;
  return Math.floor((agora - inicio) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna quantos dias faltam pra etapa desbloquear, ou 0 se já tá liberada.
 * Etapas sem `bloqueado` retornam 0.
 * Default de dias quando bloqueado=true mas desbloqueiaAposDias não setado: 7.
 */
function diasRestantes(etapa: Etapa, dias: number): number {
  if (!etapa.bloqueado) return 0;
  const limite = etapa.desbloqueiaAposDias ?? 7;
  return Math.max(0, limite - dias);
}

export function Roadmap() {
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [etapaAberta, setEtapaAberta] = useState<Etapa | null>(null);
  const [faseExpandida, setFaseExpandida] = useState<string | null>(
    "fase-1-setup"
  );
  const toast = useToast();

  useEffect(() => {
    window.api.getProgresso().then(setProgresso);
    window.api.getSessao().then(setSessao);
  }, []);

  const diasComConta = useMemo(
    () => diasDesdeCompra(sessao?.validadoEm),
    [sessao]
  );

  const fases = roadmapData.fases as Fase[];

  async function toggleEtapa(etapaId: string) {
    if (!progresso) return;
    const jaCompleta = progresso.etapasCompletas.includes(etapaId);
    const novo = jaCompleta
      ? await window.api.desmarcarEtapa(etapaId)
      : await window.api.marcarEtapaFeita(etapaId);
    setProgresso(novo);
    if (!jaCompleta) {
      toast.show({
        type: "success",
        title: "Etapa concluída",
        icon: "✓",
      });
    }
    const novas = await verificarDesbloqueios({ progresso: novo });
    novas.forEach((c) => {
      toast.show({
        type: "achievement",
        title: c.titulo,
        icon: c.icone,
      });
    });
  }

  function isEtapaCompleta(id: string): boolean {
    return progresso?.etapasCompletas.includes(id) ?? false;
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1 font-mono">
          Trilha completa
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">
          {roadmapData.titulo}
        </h2>
        <p className="text-primary-white/60 mt-2 max-w-2xl">
          {roadmapData.descricao}
        </p>
      </div>

      <div className="space-y-4">
        {fases.map((fase) => {
          const expandida = faseExpandida === fase.id;
          const totalEtapas = fase.etapas.length;
          const completas = fase.etapas.filter((e) =>
            isEtapaCompleta(e.id)
          ).length;
          const pct = Math.round((completas / totalEtapas) * 100);

          return (
            <div
              key={fase.id}
              className="glass rounded-2xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setFaseExpandida(expandida ? null : fase.id)
                }
                className="w-full px-6 py-5 flex items-center gap-5 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="text-[0.7rem] tracking-[0.18em] uppercase text-lime/80 font-mono shrink-0">
                  Fase {fase.numero}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg">{fase.titulo}</div>
                  <div className="text-sm text-primary-white/50">
                    {fase.subtitulo}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium text-primary-white/70 mb-1">
                    {completas} / {totalEtapas}
                  </div>
                  <div className="w-24 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div
                  className={`text-primary-white/40 transition-transform ${
                    expandida ? "rotate-90" : ""
                  }`}
                >
                  ▸
                </div>
              </button>

              {expandida && (
                <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                  {fase.etapas.map((etapa) => {
                    const completa = isEtapaCompleta(etapa.id);
                    const restantes = diasRestantes(etapa, diasComConta);
                    const bloqueada = restantes > 0;
                    return (
                      <div
                        key={etapa.id}
                        className={`flex items-center gap-4 px-6 py-4 transition-colors group ${
                          bloqueada
                            ? "opacity-50"
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (bloqueada) {
                              toast.show({
                                type: "info",
                                title:
                                  restantes === 1
                                    ? "Libera amanhã"
                                    : `Libera em ${restantes} dias`,
                                icon: "🔒",
                              });
                              return;
                            }
                            toggleEtapa(etapa.id);
                          }}
                          disabled={bloqueada}
                          className={`shrink-0 size-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            bloqueada
                              ? "border-white/10 cursor-not-allowed"
                              : completa
                              ? "bg-lime border-lime"
                              : "border-white/20 hover:border-lime/60"
                          }`}
                        >
                          {completa && !bloqueada && (
                            <span className="text-obsidian text-xs font-bold">
                              ✓
                            </span>
                          )}
                          {bloqueada && (
                            <span className="text-xs">🔒</span>
                          )}
                        </button>

                        <div
                          className="text-[0.65rem] tracking-[0.12em] uppercase text-primary-white/40 font-mono shrink-0 w-8"
                        >
                          {etapa.numero}
                        </div>

                        <button
                          onClick={() => {
                            if (bloqueada) {
                              toast.show({
                                type: "info",
                                title:
                                  restantes === 1
                                    ? "Libera amanhã"
                                    : `Libera em ${restantes} dias`,
                                icon: "🔒",
                              });
                              return;
                            }
                            setEtapaAberta(etapa);
                          }}
                          className="flex-1 text-left min-w-0"
                        >
                          <div
                            className={`font-medium truncate ${
                              completa
                                ? "text-primary-white/50 line-through"
                                : ""
                            }`}
                          >
                            {etapa.titulo}
                          </div>
                          {etapa.duracaoMin && (
                            <div className="text-xs text-primary-white/40 mt-0.5">
                              {etapa.duracaoMin} min
                              {bloqueada &&
                                ` · 🔒 ${
                                  restantes === 1
                                    ? "libera amanhã"
                                    : `libera em ${restantes} dias`
                                }`}
                            </div>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (bloqueada) {
                              toast.show({
                                type: "info",
                                title:
                                  restantes === 1
                                    ? "Libera amanhã"
                                    : `Libera em ${restantes} dias`,
                                icon: "🔒",
                              });
                              return;
                            }
                            setEtapaAberta(etapa);
                          }}
                          className={`text-xs shrink-0 transition-colors ${
                            bloqueada
                              ? "text-primary-white/30"
                              : "text-primary-white/40 group-hover:text-lime"
                          }`}
                        >
                          {bloqueada ? "Bloqueada" : "Abrir →"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {etapaAberta && (
        <EtapaModal
          etapa={etapaAberta}
          completa={isEtapaCompleta(etapaAberta.id)}
          onClose={() => setEtapaAberta(null)}
          onToggle={() => toggleEtapa(etapaAberta.id)}
        />
      )}
    </div>
  );
}

function EtapaModal({
  etapa,
  completa,
  onClose,
  onToggle,
}: {
  etapa: Etapa;
  completa: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  const [foco, setFoco] = useState(false);

  const promptsRelacionados = useMemo(() => {
    if (!etapa.promptIds || etapa.promptIds.length === 0) return [];
    return promptsData.prompts.filter((p) =>
      etapa.promptIds!.includes(p.id)
    );
  }, [etapa.promptIds]);

  // Modo foco: adiciona classe no body pra esconder sidebar+header globalmente
  useEffect(() => {
    if (foco) {
      document.body.classList.add("modo-foco");
    } else {
      document.body.classList.remove("modo-foco");
    }
    return () => {
      document.body.classList.remove("modo-foco");
    };
  }, [foco]);

  // ESC sai do modo foco (e fecha modal se não tava em foco)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (foco) {
          setFoco(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [foco, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-up ${
        foco ? "p-0" : "p-6 flex items-center justify-center"
      }`}
      onClick={foco ? undefined : onClose}
    >
      <div
        className={`bg-obsidian-soft border border-white/[0.08] overflow-y-auto ${
          foco
            ? "w-full h-full max-w-none max-h-none rounded-none"
            : "rounded-2xl max-w-3xl w-full max-h-[90vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={foco ? "max-w-4xl mx-auto p-12 space-y-6" : "p-8 space-y-6"}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-[0.65rem] tracking-[0.16em] uppercase text-lime/80 font-mono mb-2">
                Aula {etapa.numero}
                {etapa.duracaoMin && ` · ${etapa.duracaoMin} min`}
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {etapa.titulo}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setFoco(!foco)}
                title={foco ? "Sair do modo foco (Esc)" : "Modo foco: tela cheia, sem distrações"}
                className="px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider border border-white/[0.08] text-primary-white/60 hover:text-lime hover:border-lime/30 transition-all"
              >
                {foco ? "↙ sair foco" : "↗ foco"}
              </button>
              <button
                onClick={onClose}
                className="text-primary-white/40 hover:text-primary-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Vídeo ou Material */}
          {etapa.materialUrl && !etapa.videoUrl ? (
            <MaterialLink url={etapa.materialUrl} titulo={etapa.titulo} />
          ) : (
            <VideoPlayer url={etapa.videoUrl || ""} titulo={etapa.titulo} />
          )}

          {/* Descrição */}
          <p className="text-primary-white/70 leading-relaxed">
            {etapa.descricao}
          </p>

          {/* Notas da aula (auto-save) */}
          <NotaAulaEditor aulaId={etapa.id} />

          {/* Prompts relacionados */}
          {promptsRelacionados.length > 0 && (
            <div>
              <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono mb-3">
                Prompts pra usar nessa etapa
              </div>
              <div className="space-y-2">
                {promptsRelacionados.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]"
                  >
                    <div className="font-medium mb-1">{p.titulo}</div>
                    <div className="text-sm text-primary-white/50">
                      {p.descricao}
                    </div>
                    <button
                      onClick={() => window.api.copiarTexto(p.conteudo)}
                      className="mt-3 text-xs text-lime hover:underline font-mono"
                    >
                      Copiar prompt →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4">
            <button
              onClick={onToggle}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                completa
                  ? "bg-white/[0.05] text-primary-white/70 hover:bg-white/[0.08]"
                  : "bg-lime text-obsidian hover:lime-glow"
              }`}
            >
              {completa ? "↶ Desmarcar" : "✓ Marcar como feito"}
            </button>
            {etapa.videoUrl ? (
              <button
                onClick={() => window.api.abrirLink(etapa.videoUrl!)}
                className="text-sm text-primary-white/50 hover:text-lime transition-colors"
              >
                Abrir vídeo no navegador ↗
              </button>
            ) : etapa.materialUrl ? (
              <button
                onClick={() => window.api.abrirLink(etapa.materialUrl!)}
                className="text-sm text-primary-white/50 hover:text-lime transition-colors"
              >
                Abrir material no navegador ↗
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function MaterialLink({ url, titulo }: { url: string; titulo: string }) {
  return (
    <div className="space-y-2">
      <div className="aspect-video glass-strong rounded-xl flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">📄</div>
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-lime/80 font-mono mb-2">
            Material externo
          </div>
          <h3 className="text-xl font-semibold tracking-tight mb-3">
            {titulo}
          </h3>
          <p className="text-sm text-primary-white/60 mb-5">
            Conteúdo hospedado no Notion. Clica embaixo pra abrir no navegador
            e salva nos favoritos pra acessar quando precisar.
          </p>
          <button
            onClick={() => window.api.abrirLink(url)}
            className="px-5 py-2.5 rounded-lg bg-lime text-obsidian font-medium hover:lime-glow transition-all"
          >
            Abrir no Notion →
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="text-primary-white/30 font-mono truncate pr-3">
          {url}
        </div>
        <button
          onClick={() => window.api.copiarTexto(url)}
          className="text-primary-white/50 hover:text-lime transition-colors px-3 py-1.5 rounded-md border border-white/[0.06] hover:border-lime/30 shrink-0"
        >
          Copiar link
        </button>
      </div>
    </div>
  );
}
