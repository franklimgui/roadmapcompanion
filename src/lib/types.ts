// Tipos compartilhados entre main e renderer

export interface Perfil {
  nome: string;
  nicho: string;
  objetivo: string;
  criadoEm: string; // ISO date
}

export interface Progresso {
  etapasCompletas: string[]; // IDs das etapas
  fasesCompletas: string[];
  ultimaAtualizacao: string;
}

export interface EntradaDiario {
  id: string;
  data: string; // ISO date
  texto: string;
  screenshot?: string; // base64 ou path
  etapaId?: string;
}

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  desbloqueadaEm?: string;
}

export interface ConquistasState {
  desbloqueadas: string[];
  ultimaDesbloqueada?: string;
}

// Aceite de termos, prova jurídica do usuário ter concordado
export interface TermosAceite {
  versao: string; // ex: "1.0", pra invalidar aceite se termos mudarem
  nomeCompleto: string; // o que o usuário digitou
  aceitoEm: string; // ISO timestamp
  cidade?: string;
  estado?: string;
  pais?: string;
  ip?: string;
  hostname?: string;
  plataforma?: string;
  // Gate da cláusula 50%, se passou de 50% de etapas, garantia se encerra
  reembolsoEncerradoEm?: string; // ISO timestamp (registrado quando passa do gate)
}

// Contexto do dispositivo capturado no momento do aceite
export interface ContextoDispositivo {
  cidade?: string;
  estado?: string;
  pais?: string;
  ip?: string;
  hostname: string;
  plataforma: string;
}

// Análises, espelham os tipos do backend pra type-safety no renderer
export interface AnaliseLP {
  scoreGeral: number;
  resumo: string;
  pontosFortes: string[];
  topMudancas: Array<{
    titulo: string;
    impacto: "alto" | "medio" | "baixo";
    problema: string;
    solucao: string;
    promptSugerido?: string | null;
  }>;
  scorePorCategoria: {
    headline: number;
    aboveTheFold: number;
    provaSocial: number;
    cta: number;
    ofertaEPreco: number;
    mobile: number;
  };
  observacoesExtras?: string | null;
}

export interface AnaliseComparativo {
  vencedor: "a" | "b" | "empate";
  confianca: "alta" | "media" | "baixa";
  resumo: string;
  ladoA: {
    url: string;
    score: number;
    pontosFortes: string[];
    pontosFracos: string[];
  };
  ladoB: {
    url: string;
    score: number;
    pontosFortes: string[];
    pontosFracos: string[];
  };
  pontosCriticos: Array<{
    aspecto: string;
    impacto: "alto" | "medio" | "baixo";
    ladoA: string;
    ladoB: string;
    veredito: string;
  }>;
  comoSuperarVencedor: string[];
  observacoesExtras?: string | null;
}

export interface AnaliseNaming {
  nome: string;
  scoreGeral: number;
  resumo: string;
  pontosFortes: string[];
  pontosFracos: string[];
  scorePorCategoria: {
    memorabilidade: number;
    pronunciabilidade: number;
    descritivo: number;
    diferenciacao: number;
    facilidadeBusca: number;
  };
  riscoJuridico: "baixo" | "medio" | "alto";
  riscoJuridicoNota: string;
  alternativas: Array<{
    nome: string;
    motivo: string;
  }>;
  observacoesExtras?: string | null;
}

export interface AnaliseOferta {
  scoreGeral: number;
  resumo: string;
  pontosFortes: string[];
  topMudancas: Array<{
    titulo: string;
    impacto: "alto" | "medio" | "baixo";
    problema: string;
    solucao: string;
    promptSugerido?: string | null;
  }>;
  scorePorCategoria: {
    promessa: number;
    persona: number;
    mecanismo: number;
    prova: number;
    urgenciaGarantia: number;
    posicionamento: number;
  };
  riscos: string[];
  observacoesExtras?: string | null;
}

export type TipoAnalise = "lp" | "comparativo" | "naming" | "oferta";

export interface AnaliseHistorico {
  id: string;
  tipo: TipoAnalise;
  // Campos de input (preenchidos conforme o tipo)
  url?: string; // tipo lp
  urlA?: string; // tipo comparativo
  urlB?: string; // tipo comparativo
  nome?: string; // tipo naming
  contexto?: string; // tipo naming
  descricao?: string; // tipo oferta
  // Resultado da análise
  analise: AnaliseLP | AnaliseComparativo | AnaliseNaming | AnaliseOferta;
  feitaEm: string; // ISO
}

// ===== Notas por aula =====
export interface NotaAula {
  aulaId: string;
  texto: string;
  atualizadoEm: string; // ISO
}

// ===== Auto-update =====
export type UpdateStatus =
  | { tipo: "idle" }
  | { tipo: "checking" }
  | { tipo: "available"; versao: string }
  | { tipo: "downloading"; progresso: number }
  | { tipo: "downloaded"; versao: string }
  | { tipo: "up-to-date" }
  | { tipo: "error"; mensagem: string };

// ===== Auth (Companion) =====
// Sessão local persistida, só guarda dado após validação online bem-sucedida
export interface Sessao {
  email: string;
  produto: string;
  validadoEm: string; // ISO, primeira validação (criadoEm da compra)
  ultimaValidacao: string; // ISO, atualizada a cada revalidação online
}

// Resposta crua do endpoint /webhook/auth-validar (n8n)
export interface AuthValidarResponse {
  valido: boolean;
  motivo: string | null;
  perfil: {
    email: string;
    produto: string;
    criado_em: string;
  } | null;
  deviceIdRecebido?: string;
}

// Resultado do IPC auth:validar, inclui sessão se válido
export interface AuthValidarResultado {
  resposta: AuthValidarResponse;
  sessao: Sessao | null;
}

// Estrutura do roadmap (vem do bundle, não de userData)
export interface Etapa {
  id: string;
  titulo: string;
  descricao: string;
  videoUrl?: string;
  promptIds?: string[];
  duracaoMin?: number;
}

export interface Fase {
  id: string;
  titulo: string;
  subtitulo: string;
  etapas: Etapa[];
}

export interface Prompt {
  id: string;
  titulo: string;
  categoria: string;
  conteudo: string;
  variaveis?: string[];
  etapasRelacionadas?: string[];
}

// API exposta no window pelo preload
export interface ElectronAPI {
  // Perfil
  getPerfil: () => Promise<Perfil | null>;
  savePerfil: (perfil: Perfil) => Promise<void>;

  // Progresso
  getProgresso: () => Promise<Progresso>;
  marcarEtapaFeita: (etapaId: string) => Promise<Progresso>;
  desmarcarEtapa: (etapaId: string) => Promise<Progresso>;

  // Diário
  getEntradas: () => Promise<EntradaDiario[]>;
  addEntrada: (entrada: Omit<EntradaDiario, "id">) => Promise<EntradaDiario>;

  // Conquistas
  getConquistas: () => Promise<ConquistasState>;
  desbloquearConquista: (id: string) => Promise<ConquistasState>;

  // Termos
  getTermos: () => Promise<TermosAceite | null>;
  saveTermos: (termo: TermosAceite) => Promise<void>;
  marcarReembolsoEncerrado: () => Promise<TermosAceite | null>;

  // Contexto do dispositivo (geolocalização + hostname)
  getContextoDispositivo: () => Promise<ContextoDispositivo>;

  // Análises (histórico local)
  getHistoricoAnalises: () => Promise<AnaliseHistorico[]>;
  addAnalise: (a: Omit<AnaliseHistorico, "id">) => Promise<AnaliseHistorico>;
  getDeviceId: () => Promise<string>;

  // Auth (Companion)
  authValidar: (email: string) => Promise<AuthValidarResultado>;
  getSessao: () => Promise<Sessao | null>;
  limparSessao: () => Promise<void>;

  // Auto-update
  getUpdateStatus: () => Promise<UpdateStatus>;
  checarUpdate: () => Promise<void>;
  instalarUpdate: () => Promise<void>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;

  // Notas por aula
  getNotaAula: (aulaId: string) => Promise<NotaAula | null>;
  saveNotaAula: (aulaId: string, texto: string) => Promise<NotaAula | null>;
  getTodasNotas: () => Promise<Record<string, NotaAula>>;

  // Notificações
  configurarLembretes: (ativadas: boolean) => Promise<void>;
  getLembretesAtivados: () => Promise<boolean>;

  // Sistema
  abrirLink: (url: string) => Promise<void>;
  copiarTexto: (texto: string) => Promise<void>;
  getVersion: () => Promise<string>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
