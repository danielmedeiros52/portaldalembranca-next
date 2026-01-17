"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { Calendar, MapPin, Search, Loader2, ArrowLeft, Heart, Sparkles } from "lucide-react";

export default function HistoricMemorialsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: memorials, isLoading } = api.memorial.getHistoricMemorials.useQuery();

  const filteredMemorials = memorials?.filter(m =>
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.popularName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (m.biography?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDisplayName = (memorial: any) => {
    if (memorial.popularName) {
      return `${memorial.popularName} • ${memorial.fullName}`;
    }
    return memorial.fullName;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative px-4 sm:px-6 py-8 sm:py-12 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-1 h-auto text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full text-teal-700 text-sm font-medium mb-3">
                <Heart className="w-4 h-4 fill-teal-600" />
                Preservando Histórias
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Memoriais <span className="text-gradient">Históricos</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                Conheça as histórias e legados preservados de figuras que deixaram suas marcas em Pernambuco e na história do Brasil
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-3 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, história ou legado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full input-modern pl-12 bg-white"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {filteredMemorials && filteredMemorials.length > 0 ? (
          <>
            <div className="mb-8 flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>
                {filteredMemorials.length} memorial{filteredMemorials.length !== 1 ? 'is' : ''} encontrado{filteredMemorials.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMemorials.map((memorial) => (
                <Card
                  key={memorial.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-gray-200/50 overflow-hidden"
                  onClick={() => router.push(`/memorial/${memorial.slug}`)}
                >
                  {/* Image Section */}
                  <div className="relative aspect-video bg-gradient-to-br from-teal-100 to-cyan-100 overflow-hidden">
                    {memorial.mainPhoto ? (
                      <img
                        src={memorial.mainPhoto}
                        alt={memorial.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-teal-100 to-cyan-100">
                        <div className="text-7xl font-bold text-teal-300/40">
                          {memorial.fullName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    {/* Historical Badge */}
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-teal-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                      <Heart className="w-3.5 h-3.5 fill-teal-600" />
                      Histórico
                    </div>
                  </div>

                  {/* Content Section */}
                  <CardContent className="p-5 sm:p-6">
                    {/* Title with Popular Name */}
                    <div className="mb-3">
                      <h3 className="font-bold text-lg sm:text-xl text-gray-900 line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {getDisplayName(memorial)}
                      </h3>
                    </div>

                    {/* Dates */}
                    {memorial.birthDate && memorial.deathDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-teal-600" />
                        <span className="flex-shrink-0 font-medium">
                          {formatDate(memorial.birthDate)} — {formatDate(memorial.deathDate)}
                        </span>
                      </div>
                    )}

                    {/* Birthplace */}
                    {memorial.birthplace && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-teal-600" />
                        <span className="line-clamp-1">{memorial.birthplace}</span>
                      </div>
                    )}

                    {/* Biography */}
                    {memorial.biography && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                        {memorial.biography}
                      </p>
                    )}

                    {/* CTA Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
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
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? "Nenhum memorial encontrado" : "Nenhum memorial disponível"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Tente uma busca diferente ou explore todos os memoriais"
                : "Os memoriais históricos estarão disponíveis em breve"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="border-teal-200 text-teal-700 hover:bg-teal-50"
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
