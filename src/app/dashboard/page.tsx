"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Card } from "~/components/ui/card";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import {
  QrCode, Plus, Eye, Edit3, LogOut, Search,
  LayoutGrid, List, Calendar, MapPin, Users,
  TrendingUp, FileText, Clock, ChevronRight, Loader2,
  Heart, MessageSquare, Bell, Settings, Image
} from "lucide-react";

const APP_TITLE = "Portal da Lembrança";

export default function DashboardPage() {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [userType, setUserType] = useState<"funeral" | "family" | null>(null);

  // Fetch memorials - works for both user types
  const { data: memorials, isLoading, refetch } = api.memorial.list.useQuery();

  // Form for creating new memorial (funeral homes only)
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    deathDate: "",
    birthplace: "",
    familyEmail: "",
  });

  // Detect user type from session/context
  useEffect(() => {
    // TODO: Get actual user type from session
    // For now, default to funeral home
    setUserType("funeral");
  }, []);

  const handleCreateMemorial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Implement memorial creation API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Memorial criado com sucesso!");
      setShowCreateDialog(false);
      setFormData({
        fullName: "",
        birthDate: "",
        deathDate: "",
        birthplace: "",
        familyEmail: "",
      });
      refetch();
    } catch (error) {
      toast.error("Erro ao criar memorial.");
    }
  };

  const handleLogout = () => {
    // TODO: Implement logout
    toast.success("Logout realizado com sucesso!");
    router.push("/login");
  };

  const filteredMemorials = memorials?.filter(m =>
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    return formatDate(dateStr);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Funeral Home Dashboard
  if (userType === "funeral") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm">{APP_TITLE}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="btn-primary text-xs px-3 py-1"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden md:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">{APP_TITLE}</span>
            </div>

            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-700 rounded-xl font-medium">
                <LayoutGrid className="w-5 h-5" />
                Dashboard
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <FileText className="w-5 h-5" />
                Memoriais
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <Users className="w-5 h-5" />
                Famílias
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <TrendingUp className="w-5 h-5" />
                Relatórios
              </a>
            </nav>
          </div>

          {/* Funeral Home Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-teal-700 font-semibold text-sm">FH</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">Funerária Demo</p>
                <p className="text-xs text-gray-500 truncate">demo@funeraria.com</p>
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
        <main className="md:ml-64 p-4 sm:p-6 md:p-8 pt-16 md:pt-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-500">Gerencie seus memoriais digitais</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="btn-primary hidden md:flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Memorial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white">
                <DialogHeader>
                  <DialogTitle className="text-xl">Criar Novo Memorial</DialogTitle>
                  <DialogDescription>Insira as informações da pessoa homenageada e o e-mail de um familiar responsável.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMemorial} className="space-y-5 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                    <input
                      placeholder="Ex: Maria Silva Santos"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="input-modern"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nascimento</label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="input-modern"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Falecimento</label>
                      <input
                        type="date"
                        value={formData.deathDate}
                        onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                        className="input-modern"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Naturalidade</label>
                    <input
                      placeholder="Ex: São Paulo, SP"
                      value={formData.birthplace}
                      onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail da Família</label>
                    <input
                      type="email"
                      placeholder="familia@email.com"
                      value={formData.familyEmail}
                      onChange={(e) => setFormData({ ...formData, familyEmail: e.target.value })}
                      required
                      className="input-modern"
                    />
                  </div>
                  <Button type="submit" className="w-full btn-primary">
                    Criar Memorial
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <span className="badge-success">+12%</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{memorials?.length || 0}</p>
              <p className="text-sm text-gray-500">Total de Memoriais</p>
            </div>
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="badge-success">Ativo</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{memorials?.length || 0}</p>
              <p className="text-sm text-gray-500">Memoriais Ativos</p>
            </div>
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-rose-600" />
                </div>
                <span className="badge-info">+5 hoje</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">24</p>
              <p className="text-sm text-gray-500">Dedicações</p>
            </div>
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">48</p>
              <p className="text-sm text-gray-500">Fotos Enviadas</p>
            </div>
          </div>

          {/* Memorials Section */}
          <div className="card-modern p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Memoriais Recentes</h2>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none w-full sm:w-48 md:w-64"
                  />
                </div>
                {/* View Toggle */}
                <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredMemorials.map((memorial, index) => (
                  <div
                    key={memorial.id}
                    className="group bg-gray-50 rounded-2xl p-5 hover:bg-white hover:shadow-lg border border-transparent hover:border-gray-200 transition-all duration-300 fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=0F766E&color=fff`}
                        alt={memorial.fullName}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{memorial.fullName}</h3>
                        <p className="text-sm text-gray-500">
                          {memorial.birthDate?.split('-')[0]} - {memorial.deathDate?.split('-')[0]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {memorial.birthplace || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="badge-success">Ativo</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/memorial/${memorial.slug}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/memorial/${memorial.slug}/edit`)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-teal-600"
                          onClick={() => router.push(`/memorial/${memorial.slug}`)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMemorials.map((memorial, index) => (
                  <div
                    key={memorial.id}
                    className="group flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all duration-300 fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <img
                      src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=0F766E&color=fff`}
                      alt={memorial.fullName}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{memorial.fullName}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {memorial.birthDate?.split('-')[0]} - {memorial.deathDate?.split('-')[0]}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {memorial.birthplace || "N/A"}
                        </span>
                      </div>
                    </div>
                    <span className="badge-success">Ativo</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/memorial/${memorial.slug}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/memorial/${memorial.slug}/edit`)}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            )}

            {filteredMemorials.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhum memorial encontrado
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Family Dashboard (simplified for now - will be rendered when userType === "family")
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Meus Memoriais</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memorials?.map((memorial) => (
            <Card key={memorial.id} className="hover:shadow-lg transition-shadow cursor-pointer p-6"
                  onClick={() => router.push(`/memorial/${memorial.slug}`)}>
              <h3 className="font-semibold text-lg mb-2">{memorial.fullName}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {memorial.biography || "Sem biografia"}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
