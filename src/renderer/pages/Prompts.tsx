import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import promptsData from "../data/prompts.json";
import { verificarDesbloqueios } from "../hooks/useConquistas";
import { useToast } from "../components/Toast";

interface Variavel {
  nome: string;
  exemplo: string;
  descricao: string;
}

interface Prompt {
  id: string;
  categoria: string;
  titulo: string;
  descricao: string;
  conteudo: string;
  variaveis?: Variavel[];
  etapasRelacionadas?: string[];
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
}

export function Prompts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("all");
  const [busca, setBusca] = useState("");
  const [promptAberto, setPromptAberto] = useState<Prompt | null>(null);

  const categorias = promptsData.categorias as Categoria[];
  const todosPrompts = promptsData.prompts as Prompt[];

  // Se chegou via deep-link (?id=xxx), abre o prompt direto.
  // Útil pra fechar o circuito Análise → Prompt sugerido → Abrir na biblioteca.
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    const p = todosPrompts.find((x) => x.id === id);
    if (p) {
      setPromptAberto(p);
      // Limpa o query param pra não reabrir ao fechar e voltar pra essa rota
      const next = new URLSearchParams(searchParams);
      next.delete("id");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, todosPrompts, setSearchParams]);

  const promptsFiltrados = useMemo(() => {
    let lista = todosPrompts;
    if (categoriaAtiva !== "all") {
      lista = lista.filter((p) => p.categoria === categoriaAtiva);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.titulo.toLowerCase().includes(q) ||
          p.descricao.toLowerCase().includes(q) ||
          p.conteudo.toLowerCase().includes(q)
      );
    }
    return lista;
  }, [todosPrompts, categoriaAtiva, busca]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1 font-mono">
          Atalhos validados
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">
          Biblioteca de prompts
        </h2>
        <p className="text-primary-white/60 mt-2 max-w-2xl">
          Os prompts que uso pra construir checkout, webhook, player, recuperação. Copia, ajusta as variáveis, cola no Claude Code.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar de categorias */}
        <div className="w-56 shrink-0 space-y-1">
          <button
            onClick={() => setCategoriaAtiva("all")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
              categoriaAtiva === "all"
                ? "bg-lime/10 text-lime border border-lime/20"
                : "text-primary-white/70 hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            <span className="text-base font-mono opacity-80">★</span>
            <span>Todos</span>
            <span className="ml-auto text-xs opacity-60">
              {todosPrompts.length}
            </span>
          </button>
          {categorias.map((cat) => {
            const count = todosPrompts.filter(
              (p) => p.categoria === cat.id
            ).length;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  categoriaAtiva === cat.id
                    ? "bg-lime/10 text-lime border border-lime/20"
                    : "text-primary-white/70 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <span className="text-base font-mono opacity-80">
                  {cat.icone}
                </span>
                <span className="flex-1 truncate">{cat.nome}</span>
                <span className="text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Lista principal */}
        <div className="flex-1 min-w-0 space-y-4">
          <input
            type="text"
            placeholder="Buscar por palavra-chave..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 outline-none focus:border-lime/40 transition-colors placeholder:text-white/30"
          />

          {promptsFiltrados.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="text-primary-white/40 text-sm">
                Nenhum prompt encontrado nesse filtro.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {promptsFiltrados.map((p) => {
                const categoria = categorias.find(
                  (c) => c.id === p.categoria
                );
                return (
                  <button
                    key={p.id}
                    onClick={() => setPromptAberto(p)}
                    className="w-full text-left p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-lime/30 hover:bg-lime/[0.03] transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="size-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-base font-mono opacity-80 shrink-0 group-hover:border-lime/30 group-hover:text-lime transition-all">
                        {categoria?.icone}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold mb-1">{p.titulo}</div>
                        <div className="text-sm text-primary-white/50 line-clamp-2">
                          {p.descricao}
                        </div>
                        {p.variaveis && p.variaveis.length > 0 && (
                          <div className="mt-2 flex gap-1.5 flex-wrap">
                            {p.variaveis.slice(0, 4).map((v) => (
                              <span
                                key={v.nome}
                                className="text-[0.6rem] tracking-[0.08em] uppercase font-mono px-1.5 py-0.5 rounded bg-lime/10 text-lime/80"
                              >
                                {v.nome}
                              </span>
                            ))}
                            {p.variaveis.length > 4 && (
                              <span className="text-[0.6rem] text-primary-white/40 font-mono">
                                +{p.variaveis.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {promptAberto && (
        <PromptModal
          prompt={promptAberto}
          onClose={() => setPromptAberto(null)}
        />
      )}
    </div>
  );
}

function PromptModal({
  prompt,
  onClose,
}: {
  prompt: Prompt;
  onClose: () => void;
}) {
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    prompt.variaveis?.forEach((v) => {
      init[v.nome] = v.exemplo;
    });
    return init;
  });
  const [copiado, setCopiado] = useState(false);
  const toast = useToast();

  const conteudoFinal = useMemo(() => {
    let result = prompt.conteudo;
    Object.entries(valores).forEach(([nome, valor]) => {
      const regex = new RegExp(`\\[${nome}\\]`, "g");
      result = result.replace(regex, valor || `[${nome}]`);
    });
    return result;
  }, [prompt.conteudo, valores]);

  async function copiar() {
    await window.api.copiarTexto(conteudoFinal);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    const novas = await verificarDesbloqueios({ copiouPrompt: true });
    novas.forEach((c) => {
      toast.show({
        type: "achievement",
        title: c.titulo,
        icon: c.icone,
      });
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-obsidian-soft border border-white/[0.08] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-[0.65rem] tracking-[0.16em] uppercase text-lime/80 font-mono mb-2">
                Prompt validado
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {prompt.titulo}
              </h2>
              <p className="text-primary-white/60 mt-2">{prompt.descricao}</p>
            </div>
            <button
              onClick={onClose}
              className="text-primary-white/40 hover:text-primary-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Variáveis editáveis */}
          {prompt.variaveis && prompt.variaveis.length > 0 && (
            <div>
              <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono mb-3">
                Ajuste as variáveis
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prompt.variaveis.map((v) => (
                  <div key={v.nome}>
                    <label className="block text-[0.7rem] uppercase tracking-wider font-mono text-primary-white/50 mb-1.5">
                      {v.nome}
                      {v.descricao && (
                        <span className="ml-2 text-primary-white/30 normal-case tracking-normal">
                          · {v.descricao}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={valores[v.nome] || ""}
                      onChange={(e) =>
                        setValores({ ...valores, [v.nome]: e.target.value })
                      }
                      placeholder={v.exemplo}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 outline-none focus:border-lime/40 text-sm transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview do prompt */}
          <div>
            <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono mb-3">
              Preview
            </div>
            <div className="bg-obsidian border border-white/[0.06] rounded-lg p-5 max-h-96 overflow-y-auto">
              <pre className="text-sm text-primary-white/80 whitespace-pre-wrap font-mono leading-relaxed">
                {conteudoFinal}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer fixo */}
        <div className="px-8 py-5 border-t border-white/[0.06] bg-obsidian-soft flex items-center justify-between gap-4">
          <div className="text-xs text-primary-white/40">
            {conteudoFinal.length} caracteres
          </div>
          <button
            onClick={copiar}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              copiado
                ? "bg-emerald-glow text-obsidian"
                : "bg-lime text-obsidian hover:lime-glow"
            }`}
          >
            {copiado ? "✓ Copiado" : "Copiar prompt"}
          </button>
        </div>
      </div>
    </div>
  );
}
