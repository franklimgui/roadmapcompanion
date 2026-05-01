import roadmapData from "../data/roadmap.json";
import type { Progresso, EntradaDiario } from "../../lib/types";

interface ConquistaInfo {
  id: string;
  titulo: string;
  icone: string;
}

const CATALOGO: Record<string, ConquistaInfo> = {
  "primeiro-passo": { id: "primeiro-passo", titulo: "Primeiro passo", icone: "▣" },
  "fase-1-completa": { id: "fase-1-completa", titulo: "Setup pronto", icone: "◇" },
  "fase-2-completa": { id: "fase-2-completa", titulo: "Fundação técnica", icone: "◈" },
  "fase-3-completa": { id: "fase-3-completa", titulo: "Construindo o produto", icone: "❖" },
  "diario-3d": { id: "diario-3d", titulo: "3 dias seguidos", icone: "✦" },
  "diario-7d": { id: "diario-7d", titulo: "Uma semana inteira", icone: "✧" },
  "primeiro-prompt": { id: "primeiro-prompt", titulo: "Primeiro prompt copiado", icone: "❯_" },
  "primeiro-saas": { id: "primeiro-saas", titulo: "Primeiro SaaS rodando", icone: "★" },
};

/**
 * Verifica condições e desbloqueia conquistas que se aplicam.
 * Retorna lista de conquistas que foram NOVAS nesta chamada (pra disparar toast).
 * Idempotente: chamar várias vezes não duplica.
 */
export async function verificarDesbloqueios(opts: {
  progresso?: Progresso | null;
  entradas?: EntradaDiario[] | null;
  copiouPrompt?: boolean;
}): Promise<ConquistaInfo[]> {
  const { progresso, entradas, copiouPrompt } = opts;

  const estado = await window.api.getConquistas();
  const jaDesbloqueadas = new Set(estado.desbloqueadas);
  const candidatas: string[] = [];

  if (copiouPrompt) candidatas.push("primeiro-prompt");

  if (progresso && progresso.etapasCompletas.length > 0) {
    candidatas.push("primeiro-passo");
  }

  if (progresso) {
    const map: Record<string, string> = {
      "fase-1-setup": "fase-1-completa",
      "fase-2-fundacao": "fase-2-completa",
      "fase-3-construindo": "fase-3-completa",
    };
    for (const fase of roadmapData.fases) {
      const id = map[fase.id];
      if (!id) continue;
      const todasFeitas = fase.etapas.every((e) =>
        progresso.etapasCompletas.includes(e.id)
      );
      if (todasFeitas) candidatas.push(id);
    }
  }

  if (entradas) {
    const streak = calcularStreakDiario(entradas);
    if (streak >= 3) candidatas.push("diario-3d");
    if (streak >= 7) candidatas.push("diario-7d");
  }

  // Filtra só as que são novas
  const novas: ConquistaInfo[] = [];
  for (const id of candidatas) {
    if (!jaDesbloqueadas.has(id) && CATALOGO[id]) {
      await window.api.desbloquearConquista(id);
      novas.push(CATALOGO[id]);
    }
  }

  return novas;
}

function calcularStreakDiario(entradas: EntradaDiario[]): number {
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
