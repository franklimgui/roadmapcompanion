import { useState } from "react";
import type { TipoAnalise } from "../../lib/types";
import { AnaliseLPTab } from "./analise/AnaliseLPTab";
import { AnaliseComparativoTab } from "./analise/AnaliseComparativoTab";
import { AnaliseNamingTab } from "./analise/AnaliseNamingTab";
import { AnaliseOfertaTab } from "./analise/AnaliseOfertaTab";

const TABS: Array<{ id: TipoAnalise; label: string }> = [
  { id: "lp", label: "Landing Page" },
  { id: "comparativo", label: "Comparativo A/B" },
  { id: "naming", label: "Naming" },
  { id: "oferta", label: "Oferta / Pitch" },
];

export function Analise() {
  const [tab, setTab] = useState<TipoAnalise>("lp");

  return (
    <div className="space-y-6 pb-12">
      <div className="no-print">
        <div
          className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 mb-1"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Auditoria consultiva
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">Análise</h2>
        <p className="text-primary-white/60 mt-2 max-w-2xl">
          Cole sua LP, compare com concorrente, valide nome ou descreva a
          oferta inteira. Receba parecer profissional com score, problemas
          concretos e o que mudar primeiro pra aumentar conversão.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06] no-print">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-3 text-sm transition-all whitespace-nowrap ${
                tab === t.id
                  ? "text-lime"
                  : "text-primary-white/60 hover:text-primary-white"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime" />
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "lp" && <AnaliseLPTab />}
      {tab === "comparativo" && <AnaliseComparativoTab />}
      {tab === "naming" && <AnaliseNamingTab />}
      {tab === "oferta" && <AnaliseOfertaTab />}
    </div>
  );
}
