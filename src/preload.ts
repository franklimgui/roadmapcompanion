import { contextBridge, ipcRenderer } from "electron";
import type {
  Perfil,
  EntradaDiario,
  TermosAceite,
  AnaliseHistorico,
  ElectronAPI,
} from "./lib/types";

const api: ElectronAPI = {
  // Perfil
  getPerfil: () => ipcRenderer.invoke("perfil:get"),
  savePerfil: (perfil: Perfil) => ipcRenderer.invoke("perfil:save", perfil),

  // Progresso
  getProgresso: () => ipcRenderer.invoke("progresso:get"),
  marcarEtapaFeita: (etapaId: string) =>
    ipcRenderer.invoke("progresso:marcar", etapaId),
  desmarcarEtapa: (etapaId: string) =>
    ipcRenderer.invoke("progresso:desmarcar", etapaId),

  // Diário
  getEntradas: () => ipcRenderer.invoke("diario:get"),
  addEntrada: (entrada: Omit<EntradaDiario, "id">) =>
    ipcRenderer.invoke("diario:add", entrada),

  // Conquistas
  getConquistas: () => ipcRenderer.invoke("conquistas:get"),
  desbloquearConquista: (id: string) =>
    ipcRenderer.invoke("conquistas:desbloquear", id),

  // Termos
  getTermos: () => ipcRenderer.invoke("termos:get"),
  saveTermos: (termo: TermosAceite) => ipcRenderer.invoke("termos:save", termo),
  marcarReembolsoEncerrado: () =>
    ipcRenderer.invoke("termos:marcarReembolsoEncerrado"),

  // Contexto do dispositivo
  getContextoDispositivo: () => ipcRenderer.invoke("contexto:get"),

  // Análises
  getHistoricoAnalises: () => ipcRenderer.invoke("analise:historico"),
  addAnalise: (a: Omit<AnaliseHistorico, "id">) =>
    ipcRenderer.invoke("analise:add", a),
  getDeviceId: () => ipcRenderer.invoke("contexto:deviceId"),

  // Auth (Companion)
  authValidar: (email: string) => ipcRenderer.invoke("auth:validar", email),
  getSessao: () => ipcRenderer.invoke("sessao:get"),
  limparSessao: () => ipcRenderer.invoke("sessao:limpar"),

  // Auto-update
  getUpdateStatus: () => ipcRenderer.invoke("update:status"),
  checarUpdate: () => ipcRenderer.invoke("update:check"),
  instalarUpdate: () => ipcRenderer.invoke("update:install"),
  onUpdateStatus: (callback) => {
    const handler = (_: unknown, status: unknown) => callback(status as never);
    ipcRenderer.on("update:status", handler);
    return () => ipcRenderer.off("update:status", handler);
  },

  // Notas por aula
  getNotaAula: (aulaId: string) => ipcRenderer.invoke("notas:get", aulaId),
  saveNotaAula: (aulaId: string, texto: string) =>
    ipcRenderer.invoke("notas:save", aulaId, texto),
  getTodasNotas: () => ipcRenderer.invoke("notas:listar"),

  // Notificações
  configurarLembretes: (ativadas: boolean) =>
    ipcRenderer.invoke("lembretes:configurar", ativadas),
  getLembretesAtivados: () => ipcRenderer.invoke("lembretes:get"),

  // Sistema
  abrirLink: (url: string) => ipcRenderer.invoke("sistema:abrirLink", url),
  copiarTexto: (texto: string) => ipcRenderer.invoke("sistema:copiar", texto),
  getVersion: () => ipcRenderer.invoke("sistema:getVersion"),
};

contextBridge.exposeInMainWorld("api", api);
