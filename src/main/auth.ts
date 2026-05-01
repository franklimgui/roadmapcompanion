import { net } from "electron";
import type { AuthValidarResponse } from "../lib/types";
import { getDeviceId } from "./contexto";

const AUTH_VALIDAR_URL =
  "https://n8n.roadmapdevdeoferta.com/webhook/auth-validar";
const MARCAR_REEMBOLSO_ENCERRADO_URL =
  "https://n8n.roadmapdevdeoferta.com/webhook/marcar-reembolso-encerrado";

export async function validarAuth(email: string): Promise<AuthValidarResponse> {
  const deviceId = getDeviceId();
  const response = await net.fetch(AUTH_VALIDAR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.toLowerCase().trim(),
      device_id: deviceId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Servidor respondeu ${response.status}`);
  }

  const data = (await response.json()) as AuthValidarResponse;
  return data;
}

/**
 * Notifica o servidor que o aluno consumiu 50%+ do conteúdo.
 * Best-effort: falhas de rede não bloqueiam o fluxo local (o estado já está salvo).
 */
export async function notificarReembolsoEncerrado(
  email: string
): Promise<void> {
  try {
    await net.fetch(MARCAR_REEMBOLSO_ENCERRADO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });
  } catch {
    // Falha silenciosa. O estado local já foi gravado, próxima abertura tenta de novo.
  }
}
