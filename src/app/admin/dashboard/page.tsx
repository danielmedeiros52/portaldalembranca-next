"use client";

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { AdminLayout } from "~/components/admin/AdminLayout";
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Eye,
  ChevronRight,
  Loader2,
  Star,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();

  // Fetch real data
  const { data: memorials, isLoading: loadingMemorials } = api.memorial.list.useQuery();
  const { data: leads, isLoading: loadingLeads } = api.lead.getAll.useQuery();

  const isLoading = loadingMemorials || loadingLeads;

  // Calculate stats
  const stats = {
    totalMemorials: memorials?.length || 0,
    activeMemorials: memorials?.filter(m => m.status === "active").length || 0,
    pendingMemorials: memorials?.filter(m => m.status === "pending_data").length || 0,
    historicalMemorials: memorials?.filter(m => m.isHistorical).length || 0,
    totalLeads: leads?.length || 0,
    pendingLeads: leads?.filter(l => l.status === "pending").length || 0,
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
          <p className="text-gray-500">Visão geral do sistema</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalMemorials}</p>
            <p className="text-sm text-gray-500">Total de Memoriais</p>
          </Card>

          <Card className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.activeMemorials}</p>
            <p className="text-sm text-gray-500">Memoriais Ativos</p>
          </Card>

          <Card className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingMemorials}</p>
            <p className="text-sm text-gray-500">Pendentes de Dados</p>
          </Card>

          <Card className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
            <p className="text-sm text-gray-500">Leads Totais</p>
            {stats.pendingLeads > 0 && (
              <p className="text-xs text-orange-600 mt-1">{stats.pendingLeads} pendentes</p>
            )}
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Memorials */}
          <Card className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Memoriais Recentes</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/memorials")}
              >
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {memorials && memorials.length > 0 ? (
                memorials.slice(0, 5).map((memorial) => (
                  <div
                    key={memorial.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/memorial/${memorial.slug}`)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=0F766E&color=fff&size=40`}
                        alt={memorial.fullName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {memorial.fullName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatDate(memorial.createdAt)}</span>
                          {memorial.isHistorical && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              Histórico
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      memorial.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                    }`}>
                      {memorial.status === "active" ? "Ativo" : "Pendente"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  Nenhum memorial encontrado
                </p>
              )}
            </div>
          </Card>

          {/* Recent Leads */}
          <Card className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Leads Recentes</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/leads")}
              >
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {leads && leads.length > 0 ? (
                leads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
                      <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(lead.createdAt)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      lead.status === "pending"
                        ? "bg-orange-100 text-orange-700"
                        : lead.status === "contacted"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {lead.status === "pending" ? "Pendente" : lead.status === "contacted" ? "Contatado" : "Convertido"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  Nenhum lead encontrado
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push("/admin/historical-memorials")}
            >
              <Star className="w-5 h-5 text-amber-600" />
              <span className="text-sm">Memoriais Históricos</span>
              <span className="text-xs text-gray-500">{stats.historicalMemorials} registros</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push("/admin/leads")}
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Gerenciar Leads</span>
              <span className="text-xs text-gray-500">{stats.pendingLeads} pendentes</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push("/admin/memorials")}
            >
              <FileText className="w-5 h-5 text-teal-600" />
              <span className="text-sm">Todos Memoriais</span>
              <span className="text-xs text-gray-500">{stats.totalMemorials} total</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => router.push("/admin/funeral-homes")}
            >
              <Eye className="w-5 h-5 text-purple-600" />
              <span className="text-sm">Funerárias</span>
              <span className="text-xs text-gray-500">Gerenciar</span>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
