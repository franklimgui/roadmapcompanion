import { app, autoUpdater, BrowserWindow } from "electron";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";

/**
 * Configura auto-update via update.electronjs.org (servidor mantido pelo Electron team).
 *
 * Pré-requisitos:
 * - Repo público no GitHub com Releases assinados via electron-forge publish
 * - Owner/repo configurado em forge.config.ts
 *
 * Custo: zero. Servidor é grátis e mantido pelo Electron foundation.
 *
 * Fluxo:
 * 1. App boota → checa updates a cada 6h
 * 2. Se versão nova → baixa em background
 * 3. Quando download termina → manda IPC pro renderer mostrar banner
 * 4. Aluno clica "Reiniciar e atualizar" → autoUpdater.quitAndInstall()
 */

const REPO_OWNER = "franklimgui";
const REPO_NAME = "roadmapcompanion";

export type UpdateStatus =
  | { tipo: "idle" }
  | { tipo: "checking" }
  | { tipo: "available"; versao: string }
  | { tipo: "downloading"; progresso: number }
  | { tipo: "downloaded"; versao: string }
  | { tipo: "up-to-date" }
  | { tipo: "error"; mensagem: string };

let janelaPrincipal: BrowserWindow | null = null;
let statusAtual: UpdateStatus = { tipo: "idle" };

function emitirStatus(novo: UpdateStatus) {
  statusAtual = novo;
  if (janelaPrincipal && !janelaPrincipal.isDestroyed()) {
    janelaPrincipal.webContents.send("update:status", novo);
  }
}

export function getStatusAtual(): UpdateStatus {
  return statusAtual;
}

export function setupAutoUpdate(mainWindow: BrowserWindow) {
  janelaPrincipal = mainWindow;

  // Em DEV (npm start), não roda. Em prod, ativa.
  if (!app.isPackaged) {
    console.log("[update] Modo DEV, auto-update desativado.");
    emitirStatus({ tipo: "idle" });
    return;
  }

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
  try {
    autoUpdater.checkForUpdates();
  } catch (err) {
    emitirStatus({
      tipo: "error",
      mensagem: err instanceof Error ? err.message : "Falha ao verificar",
    });
  }
}
