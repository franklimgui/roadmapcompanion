import os from "node:os";
import crypto from "node:crypto";
import { net } from "electron";
import type { ContextoDispositivo } from "../lib/types";

/**
 * DeviceId estável: hash do hostname + plataforma + arch + MAC primário.
 * Determinístico, mesmo device sempre devolve o mesmo ID.
 * Não-reversível, não dá pra extrair info do device a partir do hash.
 */
let cachedDeviceId: string | null = null;
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  const fingerprint = [
    os.hostname(),
    os.platform(),
    os.arch(),
    primaryMac() ?? "no-mac",
  ].join("::");

  cachedDeviceId = crypto
    .createHash("sha256")
    .update(fingerprint)
    .digest("hex")
    .slice(0, 32);

  return cachedDeviceId;
}

function primaryMac(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const addrs = interfaces[name] ?? [];
    for (const addr of addrs) {
      if (!addr.internal && addr.mac && addr.mac !== "00:00:00:00:00:00") {
        return addr.mac;
      }
    }
  }
  return null;
}

/**
 * Captura contexto do dispositivo no momento do aceite dos termos.
 * - hostname e plataforma vêm do SO (sempre disponíveis)
 * - cidade/estado/país vêm de geolocalização por IP (precisa internet)
 *
 * Se a geolocalização falhar (sem internet, API offline), retorna só hostname e plataforma.
 * Não bloqueia o aceite, apenas registra menos dados.
 */
export async function getContextoDispositivo(): Promise<ContextoDispositivo> {
  const hostname = os.hostname();
  const plataforma = `${os.type()} ${os.release()}`;

  const geo = await tryGetGeolocation();

  return {
    hostname,
    plataforma,
    ...(geo ?? {}),
  };
}

/**
 * Usa ipapi.co (free tier 1000 requests/dia, sem auth) pra capturar
 * cidade/estado/país a partir do IP público.
 */
async function tryGetGeolocation(): Promise<Partial<ContextoDispositivo> | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      request.abort();
      resolve(null);
    }, 5000);

    const request = net.request({
      method: "GET",
      url: "https://ipapi.co/json/",
    });

    let body = "";

    request.on("response", (response) => {
      response.on("data", (chunk) => {
        body += chunk.toString();
      });
      response.on("end", () => {
        clearTimeout(timeout);
        try {
          const data = JSON.parse(body);
          resolve({
            cidade: data.city,
            estado: data.region,
            pais: data.country_name,
            ip: data.ip,
          });
        } catch {
          resolve(null);
        }
      });
      response.on("error", () => {
        clearTimeout(timeout);
        resolve(null);
      });
    });

    request.on("error", () => {
      clearTimeout(timeout);
      resolve(null);
    });

    request.end();
  });
}
