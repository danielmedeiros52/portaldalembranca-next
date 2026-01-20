"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { Calendar, MapPin, Search, Loader2, ArrowLeft, Heart, Sparkles, AlertCircle, Star } from "lucide-react";

export default function HistoricMemorialsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showDebug, setShowDebug] = useState(false);

  const { data: memorials, isLoading, error } = api.memorial.getHistoricMemorials.useQuery(undefined, {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: debugAllHistorical } = api.memorial.debugAllHistorical.useQuery(undefined, {
    enabled: showDebug,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const { data: debugAll } = api.memorial.debugAll.useQuery(undefined, {
    enabled: showDebug,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const filteredMemorials = memorials?.filter(m => {
    const matchesSearch = m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.popularName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (m.biography?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories from memorials
  const categories = Array.from(new Set(memorials?.map(m => m.category).filter(Boolean) as string[])).sort();

  // Separate featured and regular memorials
  const featuredMemorials = filteredMemorials?.filter(m => m.isFeatured) || [];
  const regularMemorials = filteredMemorials?.filter(m => !m.isFeatured) || [];

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 sm:px-6 py-8 sm:py-12 border-b border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-1 h-auto text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Preservando Histórias</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                Memoriais Históricos
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

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-gray-800 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {filteredMemorials && filteredMemorials.length > 0 ? (
          <>
            <div className="mb-8 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {filteredMemorials.length} memorial{filteredMemorials.length !== 1 ? 'is' : ''} encontrado{filteredMemorials.length !== 1 ? 's' : ''}
                {selectedCategory !== "all" && ` em ${selectedCategory}`}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Limpar filtros
                </Button>
              )}
            </div>

            {/* Featured Memorials Section */}
            {featuredMemorials.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Memoriais em Destaque</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  {featuredMemorials.map((memorial) => (
                    <Card
                      key={memorial.id}
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-gray-300 overflow-hidden flex flex-col h-full relative"
                      onClick={() => router.push(`/memorial/${memorial.slug}`)}
                    >
                      {/* Featured Badge */}
                      <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg">
                        <Star className="w-3.5 h-3.5 fill-white" />
                        Destaque
                      </div>

                      {/* Image Section */}
                      <div className="relative aspect-video bg-gray-100 overflow-hidden">
                        {memorial.mainPhoto ? (
                          <img
                            src={memorial.mainPhoto}
                            alt={memorial.fullName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <div className="text-7xl font-bold text-gray-300">
                              {memorial.fullName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      </div>

                      {/* Content Section */}
                      <CardContent className="p-5 sm:p-6 flex flex-col flex-grow">
                        <div className="mb-3">
                          {memorial.popularName ? (
                            <>
                              <h3 className="font-bold text-xl sm:text-2xl text-gray-900 line-clamp-1 group-hover:text-gray-700 transition-colors">
                                {memorial.popularName}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 mt-1">
                                {memorial.fullName}
                              </p>
                            </>
                          ) : (
                            <h3 className="font-bold text-xl sm:text-2xl text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors">
                              {memorial.fullName}
                            </h3>
                          )}
                        </div>

                        {memorial.birthDate && memorial.deathDate && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                            <Calendar className="w-4 h-4 flex-shrink-0 text-gray-500" />
                            <span className="flex-shrink-0 font-medium">
                              {formatDate(memorial.birthDate)} — {formatDate(memorial.deathDate)}
                            </span>
                          </div>
                        )}

                        {memorial.birthplace && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
                            <span className="line-clamp-1">{memorial.birthplace}</span>
                          </div>
                        )}

                        {memorial.biography && (
                          <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed flex-grow">
                            {memorial.biography}
                          </p>
                        )}

                        <Button
                          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium transition-all mt-auto"
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
              </section>
            )}

            {/* Regular Memorials Section */}
            {regularMemorials.length > 0 && (
              <section>
                {featuredMemorials.length > 0 && (
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Todos os Memoriais</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                  {regularMemorials.map((memorial) => (
                <Card
                  key={memorial.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden flex flex-col h-full"
                  onClick={() => router.push(`/memorial/${memorial.slug}`)}
                >
                  {/* Image Section */}
                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    {memorial.mainPhoto ? (
                      <img
                        src={memorial.mainPhoto}
                        alt={memorial.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <div className="text-7xl font-bold text-gray-300">
                          {memorial.fullName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <CardContent className="p-5 sm:p-6 flex flex-col flex-grow">
                    {/* Title with Popular Name - Show Popular Name as Main Title */}
                    <div className="mb-3">
                      {memorial.popularName ? (
                        <>
                          <h3 className="font-bold text-lg sm:text-xl text-gray-900 line-clamp-1 group-hover:text-gray-700 transition-colors">
                            {memorial.popularName}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 line-clamp-1 mt-1">
                            {memorial.fullName}
                          </p>
                        </>
                      ) : (
                        <h3 className="font-bold text-lg sm:text-xl text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors">
                          {memorial.fullName}
                        </h3>
                      )}
                    </div>

                    {/* Dates */}
                    {memorial.birthDate && memorial.deathDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-gray-500" />
                        <span className="flex-shrink-0 font-medium">
                          {formatDate(memorial.birthDate)} — {formatDate(memorial.deathDate)}
                        </span>
                      </div>
                    )}

                    {/* Birthplace */}
                    {memorial.birthplace && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
                        <span className="line-clamp-1">{memorial.birthplace}</span>
                      </div>
                    )}

                    {/* Biography */}
                    {memorial.biography && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed flex-grow">
                        {memorial.biography}
                      </p>
                    )}

                    {/* CTA Button */}
                    <Button
                      className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium transition-all mt-auto"
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
              </section>
            )}
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
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Limpar busca
              </Button>
            )}
            
            {/* Debug Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-gray-500"
              >
                {showDebug ? "Ocultar" : "Mostrar"} Informações de Debug
              </Button>
              
              {showDebug && (
                <div className="mt-6 text-left bg-gray-50 rounded-lg p-4 space-y-4 max-w-2xl mx-auto">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Memoriais Históricos (Filtrado):</p>
                    <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-48">
                      {JSON.stringify(memorials || [], null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Todos os Memoriais Históricos (Sem Status/Visibility):</p>
                    <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-48">
                      {JSON.stringify(debugAllHistorical || [], null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Todos os Memoriais (Sem Filtro):</p>
                    <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-auto max-h-48">
                      {JSON.stringify(debugAll?.slice(0, 5) || [], null, 2)}
                    </pre>
                    {debugAll && debugAll.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2">... e mais {debugAll.length - 5} memoriais</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
