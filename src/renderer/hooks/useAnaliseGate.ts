import { useEffect, useState } from "react";

const DIAS_PARA_LIBERAR = 7;

export interface AnaliseGate {
  carregando: boolean;
  liberado: boolean;
  diasRestantes: number;
  dataLiberacao: Date | null;
}

export function useAnaliseGate(): AnaliseGate {
  const [gate, setGate] = useState<AnaliseGate>({
    carregando: true,
    liberado: false,
    diasRestantes: DIAS_PARA_LIBERAR,
    dataLiberacao: null,
  });

  useEffect(() => {
    window.api.getTermos().then((termo) => {
      if (!termo) {
        setGate({
          carregando: false,
          liberado: false,
          diasRestantes: DIAS_PARA_LIBERAR,
          dataLiberacao: null,
        });
        return;
      }
      const aceitoEm = new Date(termo.aceitoEm);
      const liberacao = new Date(aceitoEm);
      liberacao.setDate(liberacao.getDate() + DIAS_PARA_LIBERAR);
      const agora = new Date();
      const msRestantes = liberacao.getTime() - agora.getTime();
      const diasRestantes = Math.max(
        0,
        Math.ceil(msRestantes / (1000 * 60 * 60 * 24))
      );
      setGate({
        carregando: false,
        liberado: msRestantes <= 0,
        diasRestantes,
        dataLiberacao: liberacao,
      });
    });
  }, []);

  return gate;
}
