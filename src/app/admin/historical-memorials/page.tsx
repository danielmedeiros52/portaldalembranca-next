"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { AdminLayout } from "~/components/admin/AdminLayout";
import {
  Star, Upload, Search, Eye, Loader2, ChevronRight, Landmark
} from "lucide-react";

export default function AdminHistoricalMemorialsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [importJson, setImportJson] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: memorials, isLoading, refetch } = api.admin.getAllHistoricalMemorials.useQuery();

  const toggleHistoricalMutation = api.admin.toggleHistoricalStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const toggleFeaturedMutation = api.admin.toggleFeaturedStatus.useMutation({
    onSuccess: () => {
      toast.success("Status de destaque atualizado");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar destaque");
    },
  });

  const bulkImportMutation = api.admin.bulkImportMemorials.useMutation({
    onSuccess: (data) => {
      const created = data.results.filter(r => r.status === "created").length;
      const updated = data.results.filter(r => r.status === "updated").length;
      const errors = data.results.filter(r => r.status === "error").length;

      toast.success(`Importação concluída: ${created} criados, ${updated} atualizados, ${errors} erros`);
      setShowImportModal(false);
      setImportJson("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao importar memoriais");
    },
  });

  const handleImportJson = () => {
    try {
      const data = JSON.parse(importJson);
      const memorialsArray = Array.isArray(data) ? data : [data];

      // Transform and validate data
      const transformed = memorialsArray.map((m: Record<string, unknown>) => ({
        slug: (m.slug as string) || `${(m.full_name as string)?.toLowerCase().replace(/\s+/g, '-') || 'memorial'}-${Date.now()}`,
        fullName: (m.full_name || m.fullName) as string,
        popularName: (m.popular_name || m.popularName) as string | undefined,
        birthDate: (m.birth_date || m.birthDate) as string | undefined,
        deathDate: (m.death_date || m.deathDate) as string | undefined,
        birthplace: m.birthplace as string | undefined,
        filiation: m.filiation as string | undefined,
        biography: m.biography as string | undefined,
        mainPhoto: (m.main_photo || m.mainPhoto) as string | undefined,
        category: m.category as string | undefined,
        graveLocation: (m.grave_location || m.graveLocation) as string | undefined,
        isHistorical: (m.is_historical ?? m.isHistorical ?? true) as boolean,
        isFeatured: (m.is_featured ?? m.isFeatured ?? false) as boolean,
        visibility: (m.visibility || "public") as "public" | "private",
        status: (m.status || "active") as "active" | "pending_data" | "inactive",
      }));

      bulkImportMutation.mutate(transformed);
    } catch (error) {
      toast.error("JSON inválido. Verifique o formato.");
    }
  };

  const filteredMemorials = memorials?.filter((m) =>
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.popularName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Memoriais Históricos</h1>
            <p className="text-gray-500">Gerencie personalidades históricas de Pernambuco</p>
          </div>
          <div className="flex gap-3">
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
            <Button
              onClick={() => setShowImportModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar JSON
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Landmark className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{memorials?.length || 0}</p>
            <p className="text-sm text-gray-500">Memoriais Históricos</p>
          </Card>

          <Card className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {memorials?.filter((m) => m.isFeatured).length || 0}
            </p>
            <p className="text-sm text-gray-500">Em Destaque</p>
          </Card>

          <Card className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {memorials?.filter((m) => m.visibility === "public").length || 0}
            </p>
            <p className="text-sm text-gray-500">Públicos</p>
          </Card>
        </div>

        {/* Memorials Table */}
        <Card className="card-modern p-6">
          <div className="space-y-3">
            {filteredMemorials && filteredMemorials.length > 0 ? (
              filteredMemorials.map((memorial) => (
                <div
                  key={memorial.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all"
                >
                  <img
                    src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=D97706&color=fff&size=48`}
                    alt={memorial.fullName}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {memorial.popularName || memorial.fullName}
                      </h3>
                      {memorial.isFeatured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {memorial.popularName && (
                      <p className="text-xs text-gray-400">{memorial.fullName}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {memorial.category && <span className="font-medium">{memorial.category}</span>}
                      {memorial.birthplace && <span> • {memorial.birthplace}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFeaturedMutation.mutate({
                        memorialId: memorial.id,
                        isFeatured: !memorial.isFeatured
                      })}
                      disabled={toggleFeaturedMutation.isPending}
                    >
                      <Star className={`w-4 h-4 ${memorial.isFeatured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/memorial/${memorial.slug}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/memorial/${memorial.id}/edit`)}
                    >
                      Editar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum memorial histórico encontrado</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowImportModal(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Memoriais
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Importar Memoriais (JSON)</h2>
            <p className="text-gray-600 mb-4">
              Cole o JSON com os dados dos memoriais. Pode ser um array ou um único objeto.
            </p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='[{"slug": "chico-science", "full_name": "Francisco de Assis França", ...}]'
              className="w-full h-64 p-4 border border-gray-200 rounded-xl font-mono text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportModal(false);
                  setImportJson("");
                }}
                disabled={bulkImportMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImportJson}
                disabled={bulkImportMutation.isPending || !importJson.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {bulkImportMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
