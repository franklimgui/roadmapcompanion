import { app, BrowserWindow, ipcMain, shell, clipboard } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import * as storage from "./main/storage";
import { getContextoDispositivo, getDeviceId } from "./main/contexto";
import { validarAuth, notificarReembolsoEncerrado } from "./main/auth";
import {
  setupAutoUpdate,
  instalarUpdateAgora,
  verificarUpdateManual,
  getStatusAtual,
} from "./main/update";
import {
  iniciarNotificacoes,
  marcarAtivo,
} from "./main/notificacoes";
import type { Sessao } from "./lib/types";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#0c0c0c",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Mostra a janela depois que o conteúdo carregou (evita flash branco)
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    // Inicia auto-update após a janela estar pronta (em produção)
    setupAutoUpdate(mainWindow);
    // Inicia daemon de lembretes diários
    void iniciarNotificacoes();
  });

  // Quando aluno foca a janela, atualiza "ultima_abertura"
  mainWindow.on("focus", () => {
    void marcarAtivo();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

app.on("ready", () => {
  registerIpcHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ===== IPC handlers, ponte main ↔ renderer =====
function registerIpcHandlers() {
  // Perfil
  ipcMain.handle("perfil:get", () => storage.getPerfil());
  ipcMain.handle("perfil:save", (_, perfil) => storage.savePerfil(perfil));

  // Progresso
  ipcMain.handle("progresso:get", () => storage.getProgresso());
  ipcMain.handle("progresso:marcar", (_, etapaId: string) =>
    storage.marcarEtapaFeita(etapaId)
  );
  ipcMain.handle("progresso:desmarcar", (_, etapaId: string) =>
    storage.desmarcarEtapa(etapaId)
  );

  // Diário
  ipcMain.handle("diario:get", () => storage.getEntradas());
  ipcMain.handle("diario:add", (_, entrada) => storage.addEntrada(entrada));

  // Conquistas
  ipcMain.handle("conquistas:get", () => storage.getConquistas());
  ipcMain.handle("conquistas:desbloquear", (_, id: string) =>
    storage.desbloquearConquista(id)
  );

  // Termos
  ipcMain.handle("termos:get", () => storage.getTermos());
  ipcMain.handle("termos:save", (_, termo) => storage.saveTermos(termo));
  ipcMain.handle("termos:marcarReembolsoEncerrado", async () => {
    const antes = await storage.getTermos();
    const termo = await storage.marcarReembolsoEncerrado();
    // Detecta primeira chamada (transição de "garantia ativa" pra "garantia encerrada")
    const acabouDeMarcar =
      termo &&
      !antes?.reembolsoEncerradoEm &&
      !!termo.reembolsoEncerradoEm;
    if (acabouDeMarcar) {
      const sessao = await storage.getSessao();
      if (sessao) {
        await notificarReembolsoEncerrado(sessao.email);
      }
    }
    return termo;
  });

  // Contexto do dispositivo (geolocalização + hostname)
  ipcMain.handle("contexto:get", () => getContextoDispositivo());
  ipcMain.handle("contexto:deviceId", () => getDeviceId());

  // Análises (histórico local)
  ipcMain.handle("analise:historico", () => storage.getHistoricoAnalises());
  ipcMain.handle("analise:add", (_, entrada) => storage.addAnalise(entrada));

  // Auth (Companion), chama /webhook/auth-validar e gerencia sessão local
  ipcMain.handle("auth:validar", async (_, email: string) => {
    const resposta = await validarAuth(email);
    let sessao: Sessao | null = null;

    if (resposta.valido && resposta.perfil) {
      sessao = {
        email: resposta.perfil.email,
        produto: resposta.perfil.produto,
        validadoEm: resposta.perfil.criado_em,
        ultimaValidacao: new Date().toISOString(),
      };
      await storage.saveSessao(sessao);
    } else {
      // Inválido, se tinha sessão local, limpa pra forçar re-login
      await storage.limparSessao();
    }

    return { resposta, sessao };
  });

  ipcMain.handle("sessao:get", () => storage.getSessao());
  ipcMain.handle("sessao:limpar", () => storage.limparSessao());

  // Updates
  ipcMain.handle("update:status", () => getStatusAtual());
  ipcMain.handle("update:check", () => verificarUpdateManual());
  ipcMain.handle("update:install", () => instalarUpdateAgora());

  // Notas por aula
  ipcMain.handle("notas:get", (_, aulaId: string) =>
    storage.getNotaAula(aulaId)
  );
  ipcMain.handle("notas:save", (_, aulaId: string, texto: string) =>
    storage.saveNotaAula(aulaId, texto)
  );
  ipcMain.handle("notas:listar", () => storage.getTodasNotas());

  // Notificações / lembretes
  ipcMain.handle("lembretes:configurar", (_, ativadas: boolean) =>
    storage.setLembretesAtivados(ativadas)
  );
  ipcMain.handle("lembretes:get", () => storage.getLembretesAtivados());

  // Sistema
  ipcMain.handle("sistema:abrirLink", (_, url: string) =>
    shell.openExternal(url)
  );
  ipcMain.handle("sistema:copiar", (_, texto: string) => {
    clipboard.writeText(texto);
  });
  ipcMain.handle("sistema:getVersion", () => app.getVersion());
}
