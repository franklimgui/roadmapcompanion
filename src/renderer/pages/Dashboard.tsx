import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  Perfil,
  Progresso,
  EntradaDiario,
  TermosAceite,
} from "../../lib/types";
import roadmapData from "../data/roadmap.json";

interface Props {
  perfil: Perfil;
}

interface Etapa {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  duracaoMin?: number;
  bloqueado?: boolean;
}

interface Fase {
  id: string;
  numero: string;
  titulo: string;
  etapas: Etapa[];
}

export function Dashboard({ perfil }: Props) {
  const navigate = useNavigate();
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [entradas, setEntradas] = useState<EntradaDiario[]>([]);
  const [termo, setTermo] = useState<TermosAceite | null>(null);

  useEffect(() => {
    window.api.getProgresso().then(setProgresso);
    window.api.getEntradas().then(setEntradas);
    window.api.getTermos().then(setTermo);
  }, []);

  const fases = roadmapData.fases as Fase[];
  const todasEtapas = useMemo(
    () => fases.flatMap((f) => f.etapas.filter((e) => !e.bloqueado)),
    [fases]
  );
  const totalEtapas = todasEtapas.length;
  const concluidas = progresso?.etapasCompletas.length ?? 0;
  const pct = totalEtapas > 0 ? Math.round((concluidas / totalEtapas) * 100) : 0;

  // Cláusula 50%, quando passa, marca reembolso encerrado no termo (idempotente)
  useEffect(() => {
    if (!termo || termo.reembolsoEncerradoEm) return;
    if (pct >= 50) {
      window.api.marcarReembolsoEncerrado().then((novo) => {
        if (novo) setTermo(novo);
      });
    }
  }, [pct, termo]);

  const proximaEtapa = useMemo(() => {
    if (!progresso) return null;
    return (
      todasEtapas.find((e) => !progresso.etapasCompletas.includes(e.id)) ?? null
    );
  }, [progresso, todasEtapas]);

  const streak = calcularStreak(entradas);
  const primeiroDia = concluidas === 0 && entradas.length === 0;
  const reembolsoEncerrado = !!termo?.reembolsoEncerradoEm;
  const proximoLimite = pct >= 35 && pct < 50; // banner de aviso entre 35% e 49%

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1 font-mono">
          Visão geral
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">
          Onde você está hoje
        </h2>
      </div>

      {primeiroDia && (
        <div className="rounded-2xl border border-lime/30 bg-lime/[0.05] p-5 flex items-start gap-4 animate-fade-up">
          <div className="size-10 rounded-lg bg-lime/15 border border-lime/30 flex items-center justify-center text-lime text-base font-mono shrink-0">
            ◇
          </div>
          <div className="flex-1">
            <div className="font-semibold text-lime mb-1">
              Bem-vindo ao Roadmap Companion
            </div>
            <p className="text-sm text-primary-white/70 leading-relaxed">
              Esse app é o seu painel de execução do produto. Comece pela primeira aula em <strong>Roadmap</strong>, copie prompts em <strong>Prompts</strong> conforme avança, e registre o que você fez nas <strong>Notas</strong> pra construir streak. Cada marco desbloqueia conquistas.
            </p>
          </div>
        </div>
      )}

      {proximoLimite && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-5 flex items-start gap-4 animate-fade-up">
          <div className="size-10 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 text-base font-mono shrink-0">
            !
          </div>
          <div className="flex-1">
            <div className="font-semibold text-amber-400 mb-1">
              Você está em {pct}% do conteúdo
            </div>
            <p className="text-sm text-primary-white/70 leading-relaxed">
              Conforme os termos aceitos (cláusula 03), ao atingir <strong className="text-primary-white">50% de consumo</strong> a garantia de reembolso se encerra automaticamente. Se está com alguma dúvida sobre o produto, é o momento de avaliar antes de continuar.
            </p>
          </div>
        </div>
      )}

      {reembolsoEncerrado && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 flex items-start gap-4 animate-fade-up">
          <div className="size-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-primary-white/50 text-base font-mono shrink-0">
            ✓
          </div>
          <div className="flex-1">
            <div className="font-semibold text-primary-white mb-1">
              Garantia encerrada · você consumiu 50%+ do conteúdo
            </div>
            <p className="text-sm text-primary-white/60 leading-relaxed">
              Conforme os termos aceitos em{" "}
              <span className="font-mono text-primary-white/80">
                {termo?.reembolsoEncerradoEm
                  ? new Date(termo.reembolsoEncerradoEm).toLocaleDateString(
                      "pt-BR"
                    )
                  : "..."}
              </span>
              . Você concordou que ao atingir esse marco o reembolso não é mais aplicável.
            </p>
          </div>
        </div>
      )}

      {/* Grid de cards principais */}
      <div className="grid grid-cols-12 gap-4">
        {/* Próximo passo (destaque) */}
        <div
          className="col-span-12 lg:col-span-7 glass-strong rounded-2xl p-6 cursor-pointer hover:bg-white/[0.08] transition-all group"
          onClick={() => navigate("/roadmap")}
        >
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-lime/80 font-mono mb-3">
            Próximo passo
          </div>
          {proximaEtapa ? (
            <>
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-[0.75rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono">
                  Aula {proximaEtapa.numero}
                </div>
                {proximaEtapa.duracaoMin && (
                  <div className="text-[0.65rem] uppercase text-primary-white/30 font-mono">
                    {proximaEtapa.duracaoMin} min
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-semibold tracking-tight mb-2">
                {proximaEtapa.titulo}
              </h3>
              <p className="text-primary-white/60 mb-6 line-clamp-2">
                {proximaEtapa.descricao}
              </p>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-semibold tracking-tight mb-2">
                Você concluiu todas as aulas 🎉
              </h3>
              <p className="text-primary-white/60 mb-6">
                Os bônus desbloqueiam após 7 dias do início. Hora de aplicar.
              </p>
            </>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-lime transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-[0.65rem] tracking-[0.12em] uppercase text-primary-white/60 font-mono">
              {concluidas} / {totalEtapas}
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-5 glass rounded-2xl p-6">
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono mb-3">
            Streak nas notas
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-5xl font-semibold text-lime tracking-tight">
              {streak}
            </div>
            <div className="text-primary-white/50">
              {streak === 1 ? "dia" : "dias"}
            </div>
          </div>
          <p className="text-sm text-primary-white/50">
            {streak === 0
              ? "Comece hoje. Registra o que você fez nas Notas."
              : streak < 7
              ? "Continua assim, hábito tá se formando."
              : "Pegou o ritmo. Não quebra a corrente."}
          </p>
        </div>

        {/* Progresso geral */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 glass rounded-2xl p-6">
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono mb-3">
            Progresso geral
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <div className="text-5xl font-semibold tracking-tight">{pct}</div>
            <div className="text-2xl text-primary-white/40">%</div>
          </div>
          <p className="text-sm text-primary-white/50">
            do roadmap completo
          </p>
        </div>

        {/* Última conquista */}
        <div className="col-span-12 lg:col-span-8 glass rounded-2xl p-6">
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono mb-3">
            Próxima conquista
          </div>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-2xl">
              ▣
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-0.5">
                {concluidas === 0 ? "Primeiro passo" : "Mais marcos vindo"}
              </div>
              <p className="text-sm text-primary-white/50">
                {concluidas === 0
                  ? "Marque a primeira aula como feita pra desbloquear."
                  : "Continue avançando, novos badges desbloqueiam conforme você progride."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Atalhos */}
      <div>
        <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono mb-3">
          Atalhos
        </div>
        <div className="grid grid-cols-3 gap-3">
          <ShortcutCard
            label="Ver Roadmap"
            description="18 aulas, 4 fases"
            onClick={() => navigate("/roadmap")}
          />
          <ShortcutCard
            label="Biblioteca de prompts"
            description="Atalhos validados pro Claude"
            onClick={() => navigate("/prompts")}
          />
          <ShortcutCard
            label="Registrar nas Notas"
            description="O que você fez hoje?"
            onClick={() => navigate("/diario")}
          />
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-lime/30 hover:bg-lime/[0.03] transition-all"
    >
      <div className="font-medium mb-1">{label}</div>
      <div className="text-sm text-primary-white/50">{description}</div>
    </button>
  );
}

function calcularStreak(entradas: EntradaDiario[]): number {
  if (entradas.length === 0) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const datas = new Set(
    entradas.map((e) => {
      const d = new Date(e.data);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let streak = 0;
  const cursor = new Date(hoje);
  while (datas.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
