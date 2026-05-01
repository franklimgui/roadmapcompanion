interface Props {
  url: string;
  titulo?: string;
}

/**
 * Embeda YouTube/Vimeo/Bunny dentro do Electron.
 * O CSP no index.html já libera youtube.com, vimeo.com e Bunny.
 *
 * Se o vídeo bloqueia embed (Erro 153 do YouTube, vídeos marcados como "Made for Kids"
 * ou com incorporação desativada), aluno pode clicar no botão pra abrir no navegador.
 */
export function VideoPlayer({ url, titulo }: Props) {
  const embedUrl = toEmbedUrl(url);

  if (!url) {
    return (
      <div className="aspect-video glass rounded-xl flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-primary-white/40 text-sm mb-2">
            Vídeo ainda não disponível
          </div>
          <div className="text-primary-white/30 text-xs">
            URL não configurada pra essa etapa.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-video rounded-xl overflow-hidden glass-strong">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={titulo || "Aula"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full border-0"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-6">
              <div className="text-primary-white/40 text-sm">
                Formato de URL não reconhecido
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fallback sempre visível, se embed falhar, aluno tem saída */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-primary-white/30">
          Vídeo não carregou? Use o botão ao lado.
        </div>
        <button
          onClick={() => window.api.abrirLink(url)}
          className="text-primary-white/50 hover:text-lime transition-colors px-3 py-1.5 rounded-md border border-white/[0.06] hover:border-lime/30"
        >
          Assistir no navegador ↗
        </button>
      </div>
    </div>
  );
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube watch URL, usar youtube-nocookie.com (domínio "embed-friendly")
  // + origin parameter pra YouTube reconhecer requisição válida
  // Resolve Erro 153 em Electron (file:// não é origem aceita pelo YouTube normal)
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      origin: "https://www.youtube-nocookie.com",
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Bunny CDN iframe (já em formato embed)
  if (url.includes("iframe.mediadelivery.net")) {
    return url;
  }

  return null;
}
