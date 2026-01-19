"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import {
  Shield,
  LogOut,
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  ClipboardList,
  Settings,
  Landmark,
} from "lucide-react";

const APP_TITLE = "Portal da Lembrança";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check admin session
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("adminSession");
      if (!session) {
        router.push("/admin/login");
        return;
      }

      try {
        const parsed = JSON.parse(session);
        const loginTime = new Date(parsed.loginTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) {
          localStorage.removeItem("adminSession");
          toast.error("Sessão expirada. Faça login novamente.");
          router.push("/admin/login");
        }
      } catch {
        localStorage.removeItem("adminSession");
        router.push("/admin/login");
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminSession");
    }
    toast.success("Logout realizado com sucesso");
    router.push("/admin/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">{APP_TITLE}</span>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive("/admin/dashboard")
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Início
              </button>

              <button
                onClick={() => router.push("/admin/historical-memorials")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive("/admin/historical-memorials")
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Landmark className="w-5 h-5" />
                Históricos
              </button>

              <button
                onClick={() => router.push("/admin/memorials")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive("/admin/memorials")
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FileText className="w-5 h-5" />
                Memoriais
              </button>

              <button
                onClick={() => router.push("/admin/leads")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive("/admin/leads")
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Users className="w-5 h-5" />
                Contatos
              </button>

              <button
                onClick={() => router.push("/admin/funeral-homes")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive("/admin/funeral-homes")
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Building2 className="w-5 h-5" />
                Parceiros
              </button>

              <button
                onClick={() => router.push("/admin/orders")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive("/admin/orders")
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                Produção
              </button>

              <button
                onClick={() => router.push("/admin/settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive("/admin/settings")
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Settings className="w-5 h-5" />
                Ajustes
              </button>
            </nav>
          </div>

          {/* User Info & Logout */}
          <div className="mt-auto p-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-teal-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">Administrador</p>
                <p className="text-xs text-gray-500 truncate">admin@portal.com</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-gray-600"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
