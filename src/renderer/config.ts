/**
 * Configurações centrais do app.
 *
 * Em dev: aponta pro localhost da LP (Next dev server)
 * Em produção: aponta pra LP em produção (roadmapdevdeoferta.com)
 */

const isDev = import.meta.env?.DEV ?? false;

export const config = {
  apiBaseUrl: isDev
    ? "http://localhost:3000"
    : "https://roadmapdevdeoferta.com",
} as const;
