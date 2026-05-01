import { useEffect, useState } from "react";

interface Props {
  email: string;
}

/**
 * Marca d'água sutil sempre visível no canto inferior direito.
 *
 * Renderiza email do aluno + device_id (curto). Aparece em screenshots e
 * gravações de tela. pointer-events:none não atrapalha interação.
 *
 * Posição fixa no viewport, fica acima de qualquer modal/overlay (z-index alto).
 */
export function Watermark({ email }: Props) {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    window.api.getDeviceId().then((id) => setDeviceId(id.slice(0, 8)));
  }, []);

  if (!email) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-2 right-3 z-[9999] select-none text-[0.55rem] tracking-[0.04em] text-primary-white/15 mix-blend-difference"
      style={{ fontFamily: "JetBrains Mono, monospace" }}
    >
      {email} · {deviceId}
    </div>
  );
}
