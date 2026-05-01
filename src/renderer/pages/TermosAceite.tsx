import { useEffect, useState } from "react";
import type {
  Perfil,
  TermosAceite as TermoAceiteType,
  ContextoDispositivo,
} from "../../lib/types";

interface Props {
  perfil: Perfil;
  onAceito: (termo: TermoAceiteType) => void;
}

const VERSAO_TERMOS = "1.0";

export function TermosAceite({ perfil, onAceito }: Props) {
  const [contexto, setContexto] = useState<ContextoDispositivo | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState(perfil.nome);
  const [aceitouCheck, setAceitouCheck] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    window.api
      .getContextoDispositivo()
      .then(setContexto)
      .finally(() => setCarregando(false));
  }, []);

  async function aceitar() {
    if (!aceitouCheck || !nomeCompleto.trim() || !contexto) return;
    setSalvando(true);
    const termo: TermoAceiteType = {
      versao: VERSAO_TERMOS,
      nomeCompleto: nomeCompleto.trim(),
      aceitoEm: new Date().toISOString(),
      cidade: contexto.cidade,
      estado: contexto.estado,
      pais: contexto.pais,
      ip: contexto.ip,
      hostname: contexto.hostname,
      plataforma: contexto.plataforma,
    };
    await window.api.saveTermos(termo);
    onAceito(termo);
  }

  const dataLocal = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const horaLocal = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const localizacao = contexto
    ? [contexto.cidade, contexto.estado, contexto.pais].filter(Boolean).join(", ")
    : null;

  return (
    <div className="min-h-screen w-full bg-obsidian relative overflow-y-auto">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #ccff00 0%, transparent 70%)" }}
      />

      <div className="relative max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[0.7rem] tracking-[0.18em] uppercase text-lime/80 mb-3 font-mono">
            Antes de continuar
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
            Bem-vindo,{" "}
            <span className="text-lime">{perfil.nome}</span>
          </h1>
          <p className="text-primary-white/60 leading-relaxed">
            O Roadmap Companion é seu, mas o conteúdo é uma licença pessoal. Não pode ser
            compartilhado. Lê com atenção, é rápido. Aceitando, você libera o app pra usar.
          </p>
        </div>

        {/* Card de termos */}
        <div className="glass-strong rounded-2xl p-6 mb-6 space-y-5">
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-primary-white/40 font-mono">
            Termos de uso · v{VERSAO_TERMOS}
          </div>

          <Clausula numero="01" titulo="Uso pessoal e individual">
            Este aplicativo e todo o conteúdo nele (vídeos, prompts, materiais) são licenciados pra <strong className="text-primary-white">uso individual seu</strong>. Não pode ser compartilhado, copiado, redistribuído ou usado por terceiros sob nenhuma circunstância.
          </Clausula>

          <Clausula numero="02" titulo="Limite de instalação: 1 máquina">
            Sua compra autoriza a instalação em <strong className="text-primary-white">1 (uma) máquina apenas</strong>. Se precisar trocar de computador, entre em contato pra resetar a licença. Detecção de uso simultâneo em mais de uma máquina pode resultar em suspensão imediata da conta.
          </Clausula>

          <Clausula numero="03" titulo="Garantia de reembolso até 50% do conteúdo" destaque>
            A garantia de 7 dias do produto se aplica enquanto você consumiu <strong className="text-primary-white">menos de 50% do conteúdo total</strong> (até 6 das 14 aulas principais marcadas como concluídas). Após atingir 50% ou mais, você concorda que <strong className="text-primary-white">consumiu valor suficiente</strong> e abre mão do direito de reembolso, conforme prática padrão de produtos digitais. Você verá um aviso no Dashboard sempre que se aproximar desse limite.
          </Clausula>

          <Clausula numero="04" titulo="Compartilhamento = perda de garantia">
            Caso seja detectado o compartilhamento do app (instalação em mais de uma máquina, distribuição do .exe, repasse de credenciais, etc), <strong className="text-primary-white">você perde a garantia automática</strong> e a conta pode ser suspensa sem direito a reembolso, independentemente do tempo de uso.
          </Clausula>
        </div>

        {/* Card de prova de credibilidade */}
        <div className="rounded-2xl border border-lime/20 bg-lime/[0.04] p-5 mb-6">
          <div className="text-[0.65rem] tracking-[0.16em] uppercase text-lime/80 mb-3 font-mono">
            Aceite registrado em
          </div>
          {carregando ? (
            <div className="flex items-center gap-2 text-primary-white/40 text-sm">
              <div className="size-2 rounded-full bg-lime animate-pulse-dot" />
              Capturando informações do dispositivo...
            </div>
          ) : (
            <div className="space-y-1.5 text-sm font-mono">
              <Linha label="Data" valor={dataLocal} />
              <Linha label="Hora" valor={horaLocal} />
              {localizacao && <Linha label="Local" valor={localizacao} />}
              {contexto?.ip && <Linha label="IP" valor={contexto.ip} />}
              {contexto?.hostname && (
                <Linha label="Device" valor={contexto.hostname} />
              )}
              {contexto?.plataforma && (
                <Linha label="Sistema" valor={contexto.plataforma} />
              )}
            </div>
          )}
        </div>

        {/* Aceite */}
        <div className="space-y-4">
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.12em] font-mono text-primary-white/50 mb-2">
              Digite seu nome completo pra confirmar
            </label>
            <input
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 outline-none focus:border-lime/40 transition-colors"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-colors">
            <input
              type="checkbox"
              checked={aceitouCheck}
              onChange={(e) => setAceitouCheck(e.target.checked)}
              className="mt-1 size-4 accent-lime"
            />
            <span className="text-sm text-primary-white/80 leading-relaxed">
              Li e aceito todos os termos acima. Concordo expressamente com a cláusula de 50% de consumo do conteúdo (item 03) e com o limite de 1 máquina por licença (item 02).
            </span>
          </label>

          <button
            onClick={aceitar}
            disabled={
              salvando ||
              carregando ||
              !aceitouCheck ||
              !nomeCompleto.trim() ||
              nomeCompleto.trim().split(" ").length < 2 ||
              !contexto
            }
            className="w-full px-6 py-3.5 rounded-lg bg-lime text-obsidian font-medium tracking-tight disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:lime-glow-strong transition-all"
          >
            {salvando
              ? "Salvando aceite..."
              : carregando
              ? "Aguarde..."
              : "Aceito e quero entrar →"}
          </button>

          {nomeCompleto.trim() &&
            nomeCompleto.trim().split(" ").length < 2 && (
              <div className="text-xs text-primary-white/40 text-center">
                Use seu nome completo (nome + sobrenome).
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function Clausula({
  numero,
  titulo,
  children,
  destaque,
}: {
  numero: string;
  titulo: string;
  children: React.ReactNode;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex gap-4 ${
        destaque ? "p-4 rounded-lg bg-lime/[0.05] border border-lime/20" : ""
      }`}
    >
      <div
        className={`shrink-0 size-8 rounded-md flex items-center justify-center text-xs font-mono font-semibold ${
          destaque
            ? "bg-lime/15 border border-lime/30 text-lime"
            : "bg-white/[0.04] border border-white/[0.06] text-primary-white/60"
        }`}
      >
        {numero}
      </div>
      <div className="flex-1">
        <div
          className={`font-semibold text-sm mb-1 ${
            destaque ? "text-lime" : "text-primary-white"
          }`}
        >
          {titulo}
        </div>
        <p className="text-sm text-primary-white/60 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex gap-3">
      <div className="text-[0.65rem] uppercase tracking-[0.12em] text-primary-white/40 w-16 shrink-0 mt-0.5">
        {label}
      </div>
      <div className="text-primary-white/85 break-all">{valor}</div>
    </div>
  );
}
