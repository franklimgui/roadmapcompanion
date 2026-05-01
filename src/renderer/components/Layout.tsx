import { Outlet } from "react-router-dom";
import type { Perfil } from "../../lib/types";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Watermark } from "./Watermark";
import { UpdateBanner } from "./UpdateBanner";

interface Props {
  perfil: Perfil;
  email?: string;
  onLogout: () => void;
}

export function Layout({ perfil, email, onLogout }: Props) {
  return (
    <div className="flex h-screen bg-obsidian text-primary-white">
      <Sidebar onLogout={onLogout} email={email} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <UpdateBanner />
        <Header perfil={perfil} />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <Outlet />
        </main>
      </div>
      {email && <Watermark email={email} />}
    </div>
  );
}
