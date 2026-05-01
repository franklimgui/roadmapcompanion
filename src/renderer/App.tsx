import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type {
  Perfil,
  TermosAceite as TermoAceiteType,
  Sessao,
} from "../lib/types";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { TermosAceite } from "./pages/TermosAceite";
import { Dashboard } from "./pages/Dashboard";
import { Roadmap } from "./pages/Roadmap";
import { Prompts } from "./pages/Prompts";
import { Analise } from "./pages/Analise";
import { Journal } from "./pages/Journal";
import { Achievements } from "./pages/Achievements";
import { Layout } from "./components/Layout";
import { ToastProvider } from "./components/Toast";

export function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

function AppRoutes() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [termo, setTermo] = useState<TermoAceiteType | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<{
    motivo: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    async function boot() {
      try {
        const sessaoLocal = await window.api.getSessao();

        if (sessaoLocal) {
          // Cenário A (puro online): revalida no servidor toda abertura
          try {
            const { resposta, sessao: novaSessao } =
              await window.api.authValidar(sessaoLocal.email);
            if (resposta.valido && novaSessao) {
              setSessao(novaSessao);
            } else {
              // Inválido, força re-login com mensagem
              setSessao(null);
              setAuthError({
                motivo:
                  resposta.motivo ||
                  "Acesso revogado. Faz login de novo se você acha que é engano.",
                email: sessaoLocal.email,
              });
            }
          } catch (err: unknown) {
            // Erro de rede, força re-login com mensagem de offline
            setSessao(null);
            setAuthError({
              motivo:
                "Sem conexão com o servidor. Verifica sua internet e tenta de novo.",
              email: sessaoLocal.email,
            });
          }
        }

        // Carrega perfil e termo em paralelo (existem ou não independente da sessão)
        const [p, t] = await Promise.all([
          window.api.getPerfil(),
          window.api.getTermos(),
        ]);
        setPerfil(p);
        setTermo(t);
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, []);

  function handleLogin(novaSessao: Sessao) {
    setSessao(novaSessao);
    setAuthError(null);
  }

  async function handleLogout() {
    await window.api.limparSessao();
    setSessao(null);
    setAuthError(null);
  }

  // Heartbeat: revalida a cada 6h enquanto app está aberto.
  // Se sessão revogou (refund, chargeback, limite de devices, etc), força re-login.
  useEffect(() => {
    if (!sessao) return;
    const HEARTBEAT_MS = 6 * 60 * 60 * 1000; // 6 horas
    const interval = setInterval(async () => {
      try {
        const { resposta, sessao: novaSessao } =
          await window.api.authValidar(sessao.email);
        if (resposta.valido && novaSessao) {
          setSessao(novaSessao);
        } else {
          setSessao(null);
          setAuthError({
            motivo:
              resposta.motivo ||
              "Sua sessão expirou. Faça login de novo pra continuar.",
            email: sessao.email,
          });
        }
      } catch {
        // Erro de rede no heartbeat, ignora. Se persistir, próxima abertura do app vai bloquear.
      }
    }, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [sessao?.email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-obsidian">
        <div className="size-2 rounded-full bg-lime animate-pulse-dot" />
      </div>
    );
  }

  // Estado 0, sem sessão validada → tela de login
  if (!sessao) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <Login
              onLogin={handleLogin}
              motivoInicial={authError?.motivo}
              emailPreenchido={authError?.email}
            />
          }
        />
      </Routes>
    );
  }

  // Estado 1, sessão ok, sem perfil → onboarding
  if (!perfil) {
    return (
      <Routes>
        <Route
          path="*"
          element={<Onboarding onComplete={(p) => setPerfil(p)} />}
        />
      </Routes>
    );
  }

  // Estado 2, sessão + perfil, sem termo → tela de termos
  if (!termo) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <TermosAceite perfil={perfil} onAceito={(t) => setTermo(t)} />
          }
        />
      </Routes>
    );
  }

  // Estado 3, tudo ok → app completo
  return (
    <Routes>
      <Route
        element={
          <Layout
            perfil={perfil}
            email={sessao.email}
            onLogout={handleLogout}
          />
        }
      >
        <Route path="/" element={<Dashboard perfil={perfil} />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/analise" element={<Analise />} />
        <Route path="/diario" element={<Journal />} />
        <Route path="/conquistas" element={<Achievements />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
