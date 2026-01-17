"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { Calendar, MapPin, Search, Filter, Loader2, ArrowLeft } from "lucide-react";

export default function HistoricMemorialsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: memorials, isLoading } = api.memorial.getHistoricMemorials.useQuery();

  const filteredMemorials = memorials?.filter(m =>
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.biography?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-1 h-auto"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Memoriais Históricos</h1>
          </div>
          <p className="text-gray-600 mb-6">
            Conheça as histórias preservadas de figuras e famílias históricas
          </p>

          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou história..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full input-modern pl-12"
              />
            </div>
            <Button variant="outline" className="hidden sm:flex">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {filteredMemorials && filteredMemorials.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {filteredMemorials.length} memorial{filteredMemorials.length !== 1 ? 'is' : ''} encontrado{filteredMemorials.length !== 1 ? 's' : ''}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMemorials.map((memorial) => (
                <Card
                  key={memorial.id}
                  className="cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                  onClick={() => router.push(`/memorial/${memorial.slug}`)}
                >
                  <div className="aspect-video bg-gradient-to-br from-teal-100 to-cyan-100 relative overflow-hidden">
                    {memorial.mainPhoto ? (
                      <img
                        src={memorial.mainPhoto}
                        alt={memorial.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-6xl text-teal-300 font-bold">
                          {memorial.fullName.charAt(0)}
                        </div>
                      </div>
                    )}
                    {memorial.isHistorical && (
                      <div className="absolute top-3 right-3 bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Histórico
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {memorial.fullName}
                    </h3>
                    {memorial.birthDate && memorial.deathDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-shrink-0">
                          {formatDate(memorial.birthDate)} - {formatDate(memorial.deathDate)}
                        </span>
                      </div>
                    )}
                    {memorial.birthplace && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">{memorial.birthplace}</span>
                      </div>
                    )}
                    {memorial.biography && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {memorial.biography}
                      </p>
                    )}
                    <Button
                      className="w-full mt-4"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/memorial/${memorial.slug}`);
                      }}
                    >
                      Ver Memorial Completo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? "Nenhum memorial histórico encontrado com essa busca"
                : "Nenhum memorial histórico disponível no momento"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                Limpar busca
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
