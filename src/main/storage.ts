import { app } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import type {
  Perfil,
  Progresso,
  EntradaDiario,
  ConquistasState,
  TermosAceite,
  AnaliseHistorico,
  Sessao,
  NotaAula,
} from "../lib/types";

// Resolve o diretório userData uma vez. Em dev é uma pasta separada do app instalado.
const dataDir = app.getPath("userData");

// Garante que o diretório existe
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const filePaths = {
  perfil: path.join(dataDir, "perfil.json"),
  progresso: path.join(dataDir, "progresso.json"),
  diario: path.join(dataDir, "diario.json"),
  conquistas: path.join(dataDir, "conquistas.json"),
  termos: path.join(dataDir, "termos.json"),
  analises: path.join(dataDir, "analises.json"),
  sessao: path.join(dataDir, "sessao.json"),
  notasAulas: path.join(dataDir, "notas_aulas.json"),
  lembretes: path.join(dataDir, "lembretes.json"),
  ultimaAbertura: path.join(dataDir, "ultima_abertura.json"),
};

// Helpers genéricos
async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "ENOENT"
    ) {
      return fallback;
    }
    throw err;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ===== Perfil =====
export async function getPerfil(): Promise<Perfil | null> {
  return readJson<Perfil | null>(filePaths.perfil, null);
}

export async function savePerfil(perfil: Perfil): Promise<void> {
  await writeJson(filePaths.perfil, perfil);
}

// ===== Progresso =====
const progressoVazio: Progresso = {
  etapasCompletas: [],
  fasesCompletas: [],
  ultimaAtualizacao: new Date().toISOString(),
};

export async function getProgresso(): Promise<Progresso> {
  return readJson<Progresso>(filePaths.progresso, progressoVazio);
}

export async function marcarEtapaFeita(etapaId: string): Promise<Progresso> {
  const atual = await getProgresso();
  if (!atual.etapasCompletas.includes(etapaId)) {
    atual.etapasCompletas.push(etapaId);
  }
  atual.ultimaAtualizacao = new Date().toISOString();
  await writeJson(filePaths.progresso, atual);
  return atual;
}

export async function desmarcarEtapa(etapaId: string): Promise<Progresso> {
  const atual = await getProgresso();
  atual.etapasCompletas = atual.etapasCompletas.filter((id) => id !== etapaId);
  atual.ultimaAtualizacao = new Date().toISOString();
  await writeJson(filePaths.progresso, atual);
  return atual;
}

// ===== Diário =====
export async function getEntradas(): Promise<EntradaDiario[]> {
  return readJson<EntradaDiario[]>(filePaths.diario, []);
}

export async function addEntrada(
  entrada: Omit<EntradaDiario, "id">
): Promise<EntradaDiario> {
  const atual = await getEntradas();
  const nova: EntradaDiario = {
    ...entrada,
    id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  atual.unshift(nova); // mais recentes primeiro
  await writeJson(filePaths.diario, atual);
  return nova;
}

// ===== Conquistas =====
const conquistasVazias: ConquistasState = {
  desbloqueadas: [],
};

export async function getConquistas(): Promise<ConquistasState> {
  return readJson<ConquistasState>(filePaths.conquistas, conquistasVazias);
}

export async function desbloquearConquista(
  id: string
): Promise<ConquistasState> {
  const atual = await getConquistas();
  if (!atual.desbloqueadas.includes(id)) {
    atual.desbloqueadas.push(id);
    atual.ultimaDesbloqueada = id;
    await writeJson(filePaths.conquistas, atual);
  }
  return atual;
}

// ===== Termos =====
export async function getTermos(): Promise<TermosAceite | null> {
  return readJson<TermosAceite | null>(filePaths.termos, null);
}

export async function saveTermos(termo: TermosAceite): Promise<void> {
  await writeJson(filePaths.termos, termo);
}

export async function marcarReembolsoEncerrado(): Promise<TermosAceite | null> {
  const atual = await getTermos();
  if (!atual) return null;
  if (!atual.reembolsoEncerradoEm) {
    atual.reembolsoEncerradoEm = new Date().toISOString();
    await writeJson(filePaths.termos, atual);
  }
  return atual;
}

// ===== Análises =====
const MAX_HISTORICO = 50;

export async function getHistoricoAnalises(): Promise<AnaliseHistorico[]> {
  return readJson<AnaliseHistorico[]>(filePaths.analises, []);
}

export async function addAnalise(
  entrada: Omit<AnaliseHistorico, "id">
): Promise<AnaliseHistorico> {
  const atual = await getHistoricoAnalises();
  const nova: AnaliseHistorico = {
    ...entrada,
    id: `an_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  atual.unshift(nova);
  // Mantém só os últimos N pra arquivo não crescer infinito
  const trimmed = atual.slice(0, MAX_HISTORICO);
  await writeJson(filePaths.analises, trimmed);
  return nova;
}

// ===== Notas por aula =====
type NotasMap = Record<string, NotaAula>;

export async function getTodasNotas(): Promise<NotasMap> {
  return readJson<NotasMap>(filePaths.notasAulas, {});
}

export async function getNotaAula(aulaId: string): Promise<NotaAula | null> {
  const todas = await getTodasNotas();
  return todas[aulaId] ?? null;
}

export async function saveNotaAula(
  aulaId: string,
  texto: string
): Promise<NotaAula | null> {
  const todas = await getTodasNotas();
  const trimmed = texto.trim();
  if (trimmed.length === 0) {
    delete todas[aulaId];
    await writeJson(filePaths.notasAulas, todas);
    return null;
  }
  const nota: NotaAula = {
    aulaId,
    texto,
    atualizadoEm: new Date().toISOString(),
  };
  todas[aulaId] = nota;
  await writeJson(filePaths.notasAulas, todas);
  return nota;
}

// ===== Lembretes (notificações desktop) =====
export async function getLembretesAtivados(): Promise<boolean> {
  const data = await readJson<{ ativados: boolean }>(filePaths.lembretes, {
    ativados: true,
  });
  return data.ativados;
}

export async function setLembretesAtivados(ativados: boolean): Promise<void> {
  await writeJson(filePaths.lembretes, { ativados });
}

export async function registrarAbertura(): Promise<void> {
  await writeJson(filePaths.ultimaAbertura, {
    em: new Date().toISOString(),
  });
}

export async function getUltimaAbertura(): Promise<Date | null> {
  const data = await readJson<{ em: string } | null>(
    filePaths.ultimaAbertura,
    null
  );
  if (!data) return null;
  return new Date(data.em);
}

// ===== Sessao (Auth Companion) =====
export async function getSessao(): Promise<Sessao | null> {
  return readJson<Sessao | null>(filePaths.sessao, null);
}

export async function saveSessao(sessao: Sessao): Promise<void> {
  await writeJson(filePaths.sessao, sessao);
}

export async function limparSessao(): Promise<void> {
  try {
    await fs.unlink(filePaths.sessao);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code !== "ENOENT"
    ) {
      throw err;
    }
    // ENOENT = arquivo não existe, ok
  }
}
