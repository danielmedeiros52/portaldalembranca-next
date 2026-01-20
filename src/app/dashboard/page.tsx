"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { logout } from "~/app/actions/auth";
import {
  QrCode, Plus, Eye, Edit3, LogOut, Search,
  Heart, MessageSquare, Loader2, User,
  Calendar, MapPin, Settings, AlertCircle
} from "lucide-react";

const APP_TITLE = "Portal da Lembrança";

export default function DashboardPage() {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState("");

  // Fetch memorials
  const { data: memorials, isLoading, refetch } = api.memorial.list.useQuery();

  // Fetch subscription status
  const { data: subscriptionStatus } = api.auth.getSubscriptionStatus.useQuery();

  // Get user info from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userSession = localStorage.getItem("userSession");
      if (userSession) {
        try {
          const session = JSON.parse(userSession);
          setUserName(session.name || "");
        } catch (e) {
          // Ignore
        }
      }
    }
  }, []);

  // Form for creating new memorial
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    deathDate: "",
    birthplace: "",
  });

  // Helper functions for date conversion
  const convertISOToBR = (isoDate: string): string => {
    if (!isoDate) return "";
    // Check if already in BR format (contains /)
    if (isoDate.includes("/")) return isoDate;
    // Check if in ISO format (contains -)
    if (isoDate.includes("-")) {
      const [year, month, day] = isoDate.split("-");
      if (day && month && year) {
        return `${day}/${month}/${year}`;
      }
    }
    return isoDate;
  };

  const convertBRToISO = (brDate: string): string => {
    if (!brDate) return "";
    const cleaned = brDate.replace(/\D/g, "");
    if (cleaned.length !== 8) return "";
    const day = cleaned.substring(0, 2);
    const month = cleaned.substring(2, 4);
    const year = cleaned.substring(4, 8);
    return `${year}-${month}-${day}`;
  };

  const formatDateInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4, 8)}`;
  };

  const createMemorialMutation = api.memorial.create.useMutation();

  const handleCreateMemorial = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Ensure dates are in ISO format before saving
      const birthDateISO = formData.birthDate ?
        (formData.birthDate.includes("-") ? formData.birthDate : convertBRToISO(formData.birthDate)) :
        undefined;
      const deathDateISO = formData.deathDate ?
        (formData.deathDate.includes("-") ? formData.deathDate : convertBRToISO(formData.deathDate)) :
        undefined;

      const result = await createMemorialMutation.mutateAsync({
        fullName: formData.fullName,
        birthDate: birthDateISO,
        deathDate: deathDateISO,
        birthplace: formData.birthplace || undefined,
      });

      toast.success("Memorial criado com sucesso!");
      setShowCreateDialog(false);
      setFormData({
        fullName: "",
        birthDate: "",
        deathDate: "",
        birthplace: "",
      });
      refetch();

      // Redirect to edit page to add more details
      if (result.slug) {
        router.push(`/memorial/${result.slug}/edit`);
      }
    } catch (error: any) {
      console.error("Create memorial error:", error);
      toast.error(error.message || "Erro ao criar memorial.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== "undefined") {
        localStorage.removeItem("userSession");
        localStorage.removeItem("adminSession");
      }
      toast.success("Até breve!");
      router.push("/login");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  const filteredMemorials = memorials?.filter(m =>
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg">{APP_TITLE}</h1>
                <p className="text-xs text-gray-500">Preservando memórias</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/family")}
                className="hidden sm:flex text-gray-600 hover:text-gray-900"
              >
                <User className="w-4 h-4 mr-2" />
                Familiares
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile")}
                className="hidden sm:flex text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {userName ? `Olá, ${userName.split(' ')[0]}` : 'Olá'}
          </h2>
          <p className="text-gray-600">
            {memorials && memorials.length > 0
              ? `Você tem ${memorials.length} ${memorials.length === 1 ? 'memorial' : 'memoriais'} para honrar e preservar`
              : 'Crie seu primeiro memorial para preservar memórias especiais'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Heart className="w-7 h-7 text-gray-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{memorials?.length || 0}</p>
                <p className="text-sm text-gray-600">Memoriais</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <User className="w-7 h-7 text-blue-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {subscriptionStatus?.personalWallet ?? 0}
                </p>
                <p className="text-sm text-gray-600">Carteira Pessoal</p>
              </div>
            </div>
          </div>

          {subscriptionStatus?.familyWallet !== null && subscriptionStatus?.familyWallet !== undefined && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-green-700" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {subscriptionStatus.familyWallet}
                  </p>
                  <p className="text-sm text-gray-600">Carteira Familiar</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Memorial Credits Banner */}
        {subscriptionStatus && subscriptionStatus.memorialCredits !== null && subscriptionStatus.memorialCredits !== undefined && (
          <div className={`border rounded-2xl p-6 shadow-sm mb-8 ${subscriptionStatus.memorialCredits === 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${subscriptionStatus.memorialCredits === 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                <Heart className={`w-6 h-6 ${subscriptionStatus.memorialCredits === 0 ? 'text-amber-600' : 'text-green-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {subscriptionStatus.memorialCredits === 0 ? "Nenhum Memorial Disponível" : `${subscriptionStatus.memorialCredits} Memorial${subscriptionStatus.memorialCredits > 1 ? 'is' : ''} Disponível${subscriptionStatus.memorialCredits > 1 ? 'is' : ''}`}
                </h3>
                <p className="text-gray-700 mb-4">
                  {subscriptionStatus.memorialCredits === 0
                    ? "Você não possui memoriais disponíveis para criar. Adquira créditos para criar novos memoriais permanentes."
                    : `Você pode criar ${subscriptionStatus.memorialCredits} memorial${subscriptionStatus.memorialCredits > 1 ? 'is' : ''} com seu saldo atual (${subscriptionStatus.personalWallet || 0} pessoal${subscriptionStatus.familyWallet ? ` + ${subscriptionStatus.familyWallet} familiar` : ''}).`}
                </p>
                {subscriptionStatus.memorialCredits === 0 && (
                  <Button
                    className="bg-gray-800 hover:bg-gray-900 text-white"
                    onClick={() => router.push("/checkout?plan=essencial")}
                  >
                    Comprar Memorial
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Memorials Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Seus Memoriais</h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar memorial..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 transition-all outline-none w-full sm:w-64"
                />
              </div>
              {subscriptionStatus && subscriptionStatus.canCreateMemorials ? (
                <Dialog
                  open={showCreateDialog}
                  onOpenChange={(open) => {
                    setShowCreateDialog(open);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-gray-800 hover:bg-gray-900 text-white shadow-lg">
                      <Plus className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Novo Memorial</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-lg bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Criar Memorial</DialogTitle>
                    <DialogDescription>
                      Crie um espaço especial para preservar a memória de quem você ama
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateMemorial} className="space-y-5 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        placeholder="Ex: Maria Silva Santos"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="input-modern"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Nome completo da pessoa homenageada
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nascimento
                        </label>
                        <input
                          type="text"
                          value={formData.birthDate ? convertISOToBR(formData.birthDate) : ""}
                          onChange={(e) => {
                            const formatted = formatDateInput(e.target.value);
                            const iso = convertBRToISO(formatted);
                            // Store ISO if complete (8 digits), otherwise store formatted for display
                            setFormData({ ...formData, birthDate: iso || formatted });
                          }}
                          onBlur={(e) => {
                            // On blur, try to convert to ISO format
                            const formatted = formatDateInput(e.target.value);
                            const iso = convertBRToISO(formatted);
                            if (iso) {
                              setFormData({ ...formData, birthDate: iso });
                            }
                          }}
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          className="input-modern"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Falecimento
                        </label>
                        <input
                          type="text"
                          value={formData.deathDate ? convertISOToBR(formData.deathDate) : ""}
                          onChange={(e) => {
                            const formatted = formatDateInput(e.target.value);
                            const iso = convertBRToISO(formatted);
                            // Store ISO if complete (8 digits), otherwise store formatted for display
                            setFormData({ ...formData, deathDate: iso || formatted });
                          }}
                          onBlur={(e) => {
                            // On blur, try to convert to ISO format
                            const formatted = formatDateInput(e.target.value);
                            const iso = convertBRToISO(formatted);
                            if (iso) {
                              setFormData({ ...formData, deathDate: iso });
                            }
                          }}
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          className="input-modern"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Naturalidade
                      </label>
                      <input
                        placeholder="Ex: São Paulo, SP"
                        value={formData.birthplace}
                        onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                        className="input-modern"
                      />
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-sm text-gray-700">
                        <strong>Próximo passo:</strong> Após criar, você poderá adicionar biografia, fotos, vídeos e outras informações na página de edição.
                      </p>
                    </div>
                    <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Memorial
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              ) : (
                <Button
                  className="bg-gray-800 hover:bg-gray-900 text-white shadow-lg"
                  onClick={() => router.push("/checkout?plan=essencial")}
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Comprar Memorial</span>
                </Button>
              )}
            </div>
          </div>

          {/* Memorials Grid */}
          {filteredMemorials.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMemorials.map((memorial) => (
                <div
                  key={memorial.id}
                  className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 hover:shadow-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/memorial/${memorial.slug}`)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=4B5563&color=fff&size=80`}
                        alt={memorial.fullName}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <Heart className="w-3 h-3 text-gray-500 fill-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                        {memorial.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{memorial.birthDate?.split('-')[0]} - {memorial.deathDate?.split('-')[0]}</span>
                      </div>
                      {memorial.birthplace && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{memorial.birthplace}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/memorial/${memorial.slug}`);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/memorial/${memorial.slug}/edit`);
                      }}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-10 h-10 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/memorial/${memorial.slug}`);
                      }}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'Nenhum memorial encontrado' : 'Nenhum memorial ainda'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Tente buscar com outro termo'
                  : 'Crie seu primeiro memorial para começar a preservar memórias'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gray-800 hover:bg-gray-900 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Memorial
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
