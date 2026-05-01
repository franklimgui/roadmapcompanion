import { useState } from "react";
import type { Perfil } from "../../lib/types";

interface Props {
  onComplete: (perfil: Perfil) => void;
}

const NICHOS = [
  "Marketing digital",
  "Educação / Cursos",
  "Saúde / Fitness",
  "E-commerce",
  "SaaS / Software",
  "Outro",
];

const OBJETIVOS = [
  { id: "saas", label: "Criar meu primeiro micro-SaaS" },
  { id: "oferta", label: "Construir uma oferta digital" },
  { id: "automatizar", label: "Automatizar minha operação" },
  { id: "explorar", label: "Aprender Claude Code" },
];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [nome, setNome] = useState("");
  const [nicho, setNicho] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function finalizar() {
    setSubmitting(true);
    const perfil: Perfil = {
      nome: nome.trim(),
      nicho,
      objetivo,
      criadoEm: new Date().toISOString(),
    };
    await window.api.savePerfil(perfil);
    onComplete(perfil);
  }

  function next() {
    if (step === 0 && nome.trim()) setStep(1);
    else if (step === 1 && nicho) setStep(2);
    else if (step === 2 && objetivo) finalizar();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-obsidian relative overflow-hidden">
      {/* Glow de fundo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #ccff00 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-xl px-8">
        {/* Indicador de progresso */}
        <div className="flex items-center gap-2 mb-12">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-all ${
                i <= step ? "bg-lime" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div
          className="text-[0.7rem] tracking-[0.16em] uppercase text-lime/80 mb-3"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          {step === 0 && "01 / Identidade"}
          {step === 1 && "02 / Contexto"}
          {step === 2 && "03 / Direção"}
        </div>

        {/* Step 0, Nome */}
        {step === 0 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight mb-3">
                Antes de começar,
                <br />
                como você se chama?
              </h1>
              <p className="text-primary-white/60">
                Seu nome aparece no Dashboard pra te lembrar que isso aqui é seu, não
                de outro aluno qualquer.
              </p>
            </div>

            <input
              type="text"
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="Guilherme"
              className="w-full bg-transparent border-b border-white/20 focus:border-lime outline-none py-3 text-2xl placeholder:text-white/20 transition-colors"
            />
          </div>
        )}

        {/* Step 1, Nicho */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight mb-3">
                Qual o seu nicho hoje?
              </h1>
              <p className="text-primary-white/60">
                Vou usar isso pra priorizar prompts e exemplos relevantes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {NICHOS.map((n) => (
                <button
                  key={n}
                  onClick={() => setNicho(n)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    nicho === n
                      ? "border-lime bg-lime/5 text-lime"
                      : "border-white/10 hover:border-white/20 text-primary-white/80"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2, Objetivo */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight mb-3">
                O que você quer construir primeiro?
              </h1>
              <p className="text-primary-white/60">
                Não precisa ser definitivo. Você pode mudar depois.
              </p>
            </div>

            <div className="space-y-2">
              {OBJETIVOS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setObjetivo(o.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                    objetivo === o.id
                      ? "border-lime bg-lime/5 text-lime"
                      : "border-white/10 hover:border-white/20 text-primary-white/80"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      objetivo === o.id ? "bg-lime" : "bg-white/20"
                    }`}
                  />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 flex items-center justify-between">
          <div
            className="text-[0.65rem] tracking-[0.12em] uppercase text-primary-white/30"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {step === 2 ? "Aperte para entrar" : "Enter pra avançar"}
          </div>

          <button
            onClick={next}
            disabled={
              submitting ||
              (step === 0 && !nome.trim()) ||
              (step === 1 && !nicho) ||
              (step === 2 && !objetivo)
            }
            className="px-6 py-3 rounded-lg bg-lime text-obsidian font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:lime-glow transition-all"
          >
            {submitting ? "..." : step === 2 ? "Entrar →" : "Avançar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
