"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import {
  Shield, LogOut, LayoutDashboard, FileText, Users, Building2,
  ClipboardList, Settings, Search, Eye,
  TrendingUp, CheckCircle2, Clock, Package,
  ChevronRight, Loader2, Bell
} from "lucide-react";

const APP_TITLE = "Portal da Lembrança";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "memorials" | "leads">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: memorials, isLoading } = api.memorial.list.useQuery();

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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const stats = {
    totalMemorials: memorials?.length || 0,
    activeMemorials: memorials?.filter(m => m.status === "active").length || 0,
    pendingMemorials: memorials?.filter(m => m.status === "pending_data").length || 0,
    totalLeads: 8,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">{APP_TITLE}</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("memorials")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "memorials"
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-5 h-5" />
              Memoriais
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === "leads"
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Users className="w-5 h-5" />
              Leads
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
              <Building2 className="w-5 h-5" />
              Funerárias
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
              <ClipboardList className="w-5 h-5" />
              Pedidos
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
              <Settings className="w-5 h-5" />
              Configurações
            </button>
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
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
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
              <p className="text-gray-500">Visão geral do sistema</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <Card className="card-modern p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-teal-600" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">+12%</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMemorials}</p>
                <p className="text-sm text-gray-500">Total de Memoriais</p>
              </Card>

              <Card className="card-modern p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Ativo</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.activeMemorials}</p>
                <p className="text-sm text-gray-500">Memoriais Ativos</p>
              </Card>

              <Card className="card-modern p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-xs text-orange-600 font-medium">Aguardando</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingMemorials}</p>
                <p className="text-sm text-gray-500">Pendentes de Dados</p>
              </Card>

              <Card className="card-modern p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Novos</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                <p className="text-sm text-gray-500">Leads</p>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="card-modern p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Memoriais Recentes</h3>
                <div className="space-y-3">
                  {memorials?.slice(0, 5).map((memorial) => (
                    <div
                      key={memorial.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=0F766E&color=fff&size=40`}
                          alt={memorial.fullName}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{memorial.fullName}</p>
                          <p className="text-xs text-gray-500">{formatDate(memorial.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        memorial.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {memorial.status === "active" ? "Ativo" : "Pendente"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="card-modern p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fila de Produção</h3>
                <div className="space-y-3">
                  {[
                    { id: 1, title: "Memorial João Silva", status: "Em Produção", priority: "Alta" },
                    { id: 2, title: "Memorial Maria Santos", status: "Aguardando Dados", priority: "Normal" },
                    { id: 3, title: "Memorial Pedro Costa", status: "Pronto", priority: "Urgente" },
                    { id: 4, title: "Memorial Ana Oliveira", status: "Novo", priority: "Normal" },
                  ].map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{order.title}</p>
                        <p className="text-xs text-gray-500">Prioridade: {order.priority}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Memorials Tab */}
        {activeTab === "memorials" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Todos os Memoriais</h1>
                <p className="text-gray-500">Gerencie todos os memoriais do sistema</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none w-64"
                />
              </div>
            </div>

            <Card className="card-modern p-6">
              <div className="space-y-3">
                {memorials
                  ?.filter(m => m.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((memorial) => (
                    <div
                      key={memorial.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all cursor-pointer"
                      onClick={() => router.push(`/memorial/${memorial.slug}`)}
                    >
                      <img
                        src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=0F766E&color=fff&size=48`}
                        alt={memorial.fullName}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{memorial.fullName}</h3>
                        <p className="text-sm text-gray-500">
                          {memorial.birthDate?.split('-')[0]} - {memorial.deathDate?.split('-')[0]} • {memorial.birthplace || "N/A"}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        memorial.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {memorial.status === "active" ? "Ativo" : "Pendente"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/memorial/${memorial.slug}`);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === "leads" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads</h1>
              <p className="text-gray-500">Gerencie contatos e solicitações</p>
            </div>

            <Card className="card-modern p-6">
              <div className="space-y-3">
                {[
                  { id: 1, name: "Maria Santos", email: "maria@email.com", phone: "(11) 99999-1111", status: "Pendente", date: "Hoje" },
                  { id: 2, name: "João Oliveira", email: "joao@email.com", phone: "(11) 99999-2222", status: "Contatado", date: "Ontem" },
                  { id: 3, name: "Ana Costa", email: "ana@email.com", phone: "(11) 99999-3333", status: "Pendente", date: "2 dias atrás" },
                  { id: 4, name: "Pedro Silva", email: "pedro@email.com", phone: "(11) 99999-4444", status: "Convertido", date: "3 dias atrás" },
                ].map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                      <p className="text-sm text-gray-500">{lead.email} • {lead.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">{lead.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        lead.status === "Pendente"
                          ? "bg-orange-100 text-orange-700"
                          : lead.status === "Contatado"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {lead.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        Detalhes
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
