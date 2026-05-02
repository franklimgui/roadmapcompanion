import { useEffect, useRef, useState } from "react";

interface Props {
  url: string;
  titulo?: string;
}

/**
 * Embeda YouTube via IFrame Player API (JavaScript) em vez de iframe simples.
 *
 * Por que essa abordagem: alguns canais/vídeos do YouTube bloqueiam iframe
 * direto (Erro 153) mesmo com "Permitir incorporação" ativado. A IFrame Player
 * API contorna essa restrição porque carrega via script da própria YouTube,
 * não via iframe simples. É a mesma técnica que a Kiwify usa.
 *
 * Vimeo e Bunny seguem com iframe direto (não têm o problema).
 */

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        config: Record<string, unknown>
      ) => {
        destroy?: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const YT_API_SCRIPT_ID = "youtube-iframe-api";

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const existing = document.getElementById(YT_API_SCRIPT_ID);
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = YT_API_SCRIPT_ID;
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve();
    };
  });
}

interface FonteVideo {
  tipo: "youtube" | "vimeo" | "bunny" | "desconhecido";
  videoId?: string;
  embedUrl?: string;
}

function detectarFonte(url: string): FonteVideo {
  if (!url) return { tipo: "desconhecido" };

  const yt = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  if (yt) return { tipo: "youtube", videoId: yt[1] };

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) {
    return {
      tipo: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`,
    };
  }

  if (url.includes("iframe.mediadelivery.net")) {
    return { tipo: "bunny", embedUrl: url };
  }

  return { tipo: "desconhecido" };
}

export function VideoPlayer({ url, titulo }: Props) {
  const fonte = detectarFonte(url);

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

  if (fonte.tipo === "desconhecido") {
    return (
      <div className="aspect-video glass rounded-xl flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-primary-white/40 text-sm">
            Formato de URL não reconhecido
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-video rounded-xl overflow-hidden glass-strong">
        {fonte.tipo === "youtube" && fonte.videoId ? (
          <YouTubePlayer videoId={fonte.videoId} titulo={titulo} />
        ) : fonte.embedUrl ? (
          <iframe
            src={fonte.embedUrl}
            title={titulo || "Aula"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full border-0"
          />
        ) : null}
      </div>

      {/* Fallback sempre visível, se vídeo bugar aluno tem saída */}
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

function YouTubePlayer({
  videoId,
  titulo,
}: {
  videoId: string;
  titulo?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy?: () => void } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);

    loadYouTubeApi().then(() => {
      if (cancelado || !containerRef.current || !window.YT) return;

      // Destrói player anterior se aluno trocou de aula
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignora erro de destroy
        }
      }

      // Cria div novo dentro do container (a API substitui o div pelo iframe)
      const playerDiv = document.createElement("div");
      playerDiv.className = "w-full h-full";
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(playerDiv);

      playerRef.current = new window.YT.Player(playerDiv, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (!cancelado) setCarregando(false);
          },
          onError: () => {
            if (!cancelado) setCarregando(false);
          },
        },
      });
    });

    return () => {
      cancelado = true;
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignora erro de destroy
        }
        playerRef.current = null;
      }
    };
  }, [videoId]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" title={titulo} />
      {carregando && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="size-2 rounded-full bg-lime animate-pulse-dot" />
        </div>
      )}
    </div>
  );
}
