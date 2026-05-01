import { Notification, app } from "electron";
import {
  getLembretesAtivados,
  getUltimaAbertura,
  registrarAbertura,
} from "./storage";

/**
 * Notificações desktop nativas.
 *
 * Comportamento:
 * - Toda abertura do app, registra timestamp de "ultima_abertura.json"
 * - Daemon roda a cada 4h (intervalo curto pra cobrir vários horários)
 * - Quando hora bate entre 9h e 10h da manhã, verifica:
 *   - Se ultima_abertura > 24h atrás → dispara notificação
 *   - Se lembretes desativados pelo aluno → não dispara
 *
 * Aluno pode desativar em /minha-conta (handler IPC já preparado).
 */

const INTERVALO_MS = 4 * 60 * 60 * 1000; // 4h
const HORA_NOTIFICACAO_INICIO = 9; // 9h
const HORA_NOTIFICACAO_FIM = 11; // 11h (janela de 2h pra disparar)

let timer: NodeJS.Timeout | null = null;

export async function iniciarNotificacoes() {
  await registrarAbertura();
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    void verificarEDisparar();
  }, INTERVALO_MS);
  // Primeira checagem rápida 30s após abrir
  setTimeout(() => void verificarEDisparar(), 30_000);
}

export function pararNotificacoes() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function verificarEDisparar() {
  if (!Notification.isSupported()) return;

  const ativados = await getLembretesAtivados();
  if (!ativados) return;

  const agora = new Date();
  const hora = agora.getHours();
  if (hora < HORA_NOTIFICACAO_INICIO || hora >= HORA_NOTIFICACAO_FIM) return;

  const ultima = await getUltimaAbertura();
  if (ultima) {
    const horasDesde = (agora.getTime() - ultima.getTime()) / (1000 * 60 * 60);
    if (horasDesde < 20) return; // entrou nas últimas 20h, não incomoda
  }

  new Notification({
    title: "Continua de onde parou",
    body: "Sua próxima aula do Roadmap Dev de Oferta tá esperando. Bora avançar 5 min hoje?",
    silent: false,
  }).show();
}

// Quando app fica em foco/aberto, atualiza ultima_abertura
export async function marcarAtivo() {
  await registrarAbertura();
}

// Garante que daemon não fica rodando após app fechar
app.on("before-quit", () => pararNotificacoes());
