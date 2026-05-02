import { app, autoUpdater, BrowserWindow, net } from "electron";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";

/**
 * Configura auto-update.
 *
 * Windows: usa update.electronjs.org (servidor mantido pelo Electron team)
 * via update-electron-app. Baixa em background e instala on quit.
 *
 * Mac: NÃO usa auto-update silencioso. O Squirrel.Mac do Electron exige
 * assinatura Apple Developer ID válida pra atualizar (proteção da Apple).
 * Como não pagamos a assinatura, fazemos polling manual da API do GitHub
 * Releases e mostramos banner "baixar versão nova" que abre a página de
 * download. Aluno baixa o zip novo, troca o .app, reabre.
 *
 * Pré-requisitos:
 * - Repo público no GitHub com Releases assinados via electron-forge publish
 * - Owner/repo configurado em forge.config.ts
 */

const REPO_OWNER = "franklimgui";
const REPO_NAME = "roadmapcompanion";
// URL da página de download (LP) que mostra modal Mac com 2 zips
const URL_PAGINA_DOWNLOAD = "https://roadmapdevdeoferta.com/c-87a3x9k73h2m4n";

// Em horas. 6h = mesma cadência do Windows.
const POLL_INTERVAL_HORAS_MAC = 6;

export type UpdateStatus =
  | { tipo: "idle" }
  | { tipo: "checking" }
  | { tipo: "available"; versao: string }
  | { tipo: "downloading"; progresso: number }
  | { tipo: "downloaded"; versao: string }
  | { tipo: "up-to-date" }
  | { tipo: "error"; mensagem: string }
  | { tipo: "mac-update-disponivel"; versao: string; urlPagina: string };

let janelaPrincipal: BrowserWindow | null = null;
let statusAtual: UpdateStatus = { tipo: "idle" };
let timerPollMac: NodeJS.Timeout | null = null;

function emitirStatus(novo: UpdateStatus) {
  statusAtual = novo;
  if (janelaPrincipal && !janelaPrincipal.isDestroyed()) {
    janelaPrincipal.webContents.send("update:status", novo);
  }
}

export function getStatusAtual(): UpdateStatus {
  return statusAtual;
}

/**
 * Compara duas versões semver simples (ex: "1.0.3" > "1.0.2").
 * Retorna true se `nova` for maior que `atual`.
 */
function versaoMaior(nova: string, atual: string): boolean {
  const a = nova.split(".").map((n) => parseInt(n, 10) || 0);
  const b = atual.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

/**
 * Consulta a API do GitHub pra ver qual é a release Latest.
 * Retorna a versão (ex: "1.0.3") ou null em caso de erro.
 */
async function buscarVersaoLatestGithub(): Promise<string | null> {
  try {
    const resp = await net.fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "roadmap-companion",
        },
      }
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as { tag_name?: string };
    if (!data.tag_name) return null;
    // tag vem como "v1.0.3", removemos o "v"
    return data.tag_name.replace(/^v/, "");
  } catch {
    return null;
  }
}

async function checarUpdateMac() {
  const versaoAtual = app.getVersion();
  const versaoLatest = await buscarVersaoLatestGithub();
  if (!versaoLatest) return; // erro de rede, tenta de novo no próximo ciclo

  if (versaoMaior(versaoLatest, versaoAtual)) {
    emitirStatus({
      tipo: "mac-update-disponivel",
      versao: versaoLatest,
      urlPagina: URL_PAGINA_DOWNLOAD,
    });
  } else {
    emitirStatus({ tipo: "up-to-date" });
  }
}

function pararPollMac() {
  if (timerPollMac) {
    clearInterval(timerPollMac);
    timerPollMac = null;
  }
}

function iniciarPollMac() {
  // Checa imediatamente
  void checarUpdateMac();
  // Depois agenda recorrente
  pararPollMac();
  timerPollMac = setInterval(
    () => void checarUpdateMac(),
    POLL_INTERVAL_HORAS_MAC * 60 * 60 * 1000
  );
}

export function setupAutoUpdate(mainWindow: BrowserWindow) {
  janelaPrincipal = mainWindow;

  // Em DEV (npm start), não roda. Em prod, ativa.
  if (!app.isPackaged) {
    console.log("[update] Modo DEV, auto-update desativado.");
    emitirStatus({ tipo: "idle" });
    return;
  }

  if (process.platform === "darwin") {
    // Mac: polling manual da API do GitHub.
    iniciarPollMac();
    return;
  }

  // Windows (e Linux, no futuro): auto-update silencioso via update.electronjs.org
  try {
    updateElectronApp({
      updateSource: {
        type: UpdateSourceType.ElectronPublicUpdateService,
        repo: `${REPO_OWNER}/${REPO_NAME}`,
      },
      updateInterval: "6 hours",
      notifyUser: false, // UI custom, não usa o dialog nativo
      logger: console,
    });
  } catch (err) {
    emitirStatus({
      tipo: "error",
      mensagem: err instanceof Error ? err.message : "Falha ao iniciar updater",
    });
    return;
  }

  // Eventos do autoUpdater nativo (que update-electron-app configura por baixo)
  autoUpdater.on("checking-for-update", () => {
    emitirStatus({ tipo: "checking" });
  });

  autoUpdater.on("update-available", () => {
    emitirStatus({ tipo: "available", versao: "" });
  });

  autoUpdater.on("update-not-available", () => {
    emitirStatus({ tipo: "up-to-date" });
  });

  autoUpdater.on("error", (err) => {
    emitirStatus({
      tipo: "error",
      mensagem: err.message || "Erro desconhecido no updater",
    });
  });

  autoUpdater.on(
    "update-downloaded",
    (_event, _releaseNotes, releaseName) => {
      emitirStatus({
        tipo: "downloaded",
        versao: releaseName || "nova versão",
      });
    }
  );
}

/**
 * Disparado quando aluno clica "Reiniciar e atualizar" no banner.
 * Fecha o app e instala a nova versão. App reabre automaticamente.
 * Em Mac, não funciona, mas o banner Mac não chama isso (chama abrirLink).
 */
export function instalarUpdateAgora() {
  if (statusAtual.tipo === "downloaded") {
    autoUpdater.quitAndInstall();
  }
}

/**
 * Verifica updates manualmente (botão "Verificar agora" em /minha-conta).
 */
export function verificarUpdateManual() {
  if (!app.isPackaged) {
    emitirStatus({ tipo: "idle" });
    return;
  }
  if (process.platform === "darwin") {
    void checarUpdateMac();
    return;
  }
  try {
    autoUpdater.checkForUpdates();
  } catch (err) {
    emitirStatus({
      tipo: "error",
      mensagem: err instanceof Error ? err.message : "Falha ao verificar",
    });
  }
}
