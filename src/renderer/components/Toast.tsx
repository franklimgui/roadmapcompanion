import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastType = "info" | "success" | "achievement";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  icon?: string;
}

interface ToastContextValue {
  show: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((toast: Omit<Toast, "id">) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    const ttl = toast.type === "achievement" ? 5000 : 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ttl);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const isAchievement = toast.type === "achievement";

  return (
    <div
      className={`pointer-events-auto min-w-[280px] max-w-md rounded-xl border backdrop-blur-xl px-4 py-3 animate-fade-up ${
        isAchievement
          ? "bg-lime/10 border-lime/40 lime-glow-strong"
          : toast.type === "success"
          ? "bg-emerald-glow/10 border-emerald-glow/30"
          : "bg-white/[0.06] border-white/[0.12]"
      }`}
    >
      <div className="flex items-start gap-3">
        {toast.icon && (
          <div
            className={`size-9 rounded-lg flex items-center justify-center text-base shrink-0 font-mono ${
              isAchievement
                ? "bg-lime/20 text-lime border border-lime/40"
                : "bg-white/[0.04] border border-white/[0.06]"
            }`}
          >
            {toast.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {isAchievement && (
            <div
              className="text-[0.6rem] tracking-[0.16em] uppercase text-lime/80 mb-0.5 font-mono"
            >
              Conquista desbloqueada
            </div>
          )}
          <div
            className={`font-semibold text-sm ${
              isAchievement ? "text-lime" : "text-primary-white"
            }`}
          >
            {toast.title}
          </div>
          {toast.description && (
            <div className="text-xs text-primary-white/60 mt-0.5">
              {toast.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
