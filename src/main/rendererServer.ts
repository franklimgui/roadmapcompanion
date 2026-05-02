import { createServer, type Server } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { AddressInfo } from "node:net";

/**
 * Servidor HTTP loopback pra servir o bundle do renderer em prod.
 *
 * Por que: o YouTube IFrame Player API rejeita iframes embutidos em páginas
 * com origin file:// ou esquemas customizados (app://) com Erro 153. A origin
 * precisa ser HTTP(S) real. Servimos o bundle em 127.0.0.1:porta-aleatória,
 * que o YouTube aceita.
 *
 * Segurança:
 * - escuta só em 127.0.0.1 (loopback), nunca exposto pra rede
 * - porta aleatória escolhida pelo SO (porta 0)
 * - path traversal (..) é bloqueado, requisições só servem dentro de baseDir
 */

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json; charset=utf-8",
};

let server: Server | null = null;

export interface ServerInfo {
  url: string;
  port: number;
}

export async function iniciarServidorRenderer(
  baseDir: string
): Promise<ServerInfo> {
  if (server) {
    const addr = server.address() as AddressInfo;
    return { url: `http://127.0.0.1:${addr.port}`, port: addr.port };
  }

  const baseAbs = resolve(baseDir);

  server = createServer((req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const decodedPath = decodeURIComponent(url.pathname);
      const rel = decodedPath.replace(/^\/+/, "") || "index.html";
      const target = normalize(join(baseAbs, rel));

      // Sandbox: garante que o caminho final não escapa do baseDir.
      if (!target.startsWith(baseAbs)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      let stat;
      try {
        stat = statSync(target);
      } catch {
        // Fallback pra SPA: arquivo não existe, devolve index.html (rotas /diario etc)
        const indexPath = join(baseAbs, "index.html");
        const fallbackStat = statSync(indexPath);
        res.writeHead(200, {
          "Content-Type": MIME[".html"],
          "Content-Length": fallbackStat.size,
        });
        createReadStream(indexPath).pipe(res);
        return;
      }

      if (stat.isDirectory()) {
        const indexPath = join(target, "index.html");
        const indexStat = statSync(indexPath);
        res.writeHead(200, {
          "Content-Type": MIME[".html"],
          "Content-Length": indexStat.size,
        });
        createReadStream(indexPath).pipe(res);
        return;
      }

      const mime = MIME[extname(target).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": mime,
        "Content-Length": stat.size,
      });
      createReadStream(target).pipe(res);
    } catch (err) {
      res.writeHead(500);
      res.end(`Internal: ${(err as Error).message}`);
    }
  });

  return new Promise((resolveP, rejectP) => {
    // host 127.0.0.1 = loopback only, porta 0 = SO escolhe livre
    server!.listen(0, "127.0.0.1", () => {
      const addr = server!.address() as AddressInfo;
      resolveP({ url: `http://127.0.0.1:${addr.port}`, port: addr.port });
    });
    server!.on("error", rejectP);
  });
}

export function pararServidorRenderer() {
  if (server) {
    server.close();
    server = null;
  }
}
