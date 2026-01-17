"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Card } from "~/components/ui/card";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import {
  ArrowLeft, Save, User, Users, Image, MessageSquare,
  Plus, Trash2, Edit3, Calendar, MapPin, Heart, Upload, Loader2
} from "lucide-react";

export default function MemorialEditPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const { data: memorial, isLoading } = api.memorial.getBySlug.useQuery({ slug });
  const [activeTab, setActiveTab] = useState("info");
  const [showAddDescendant, setShowAddDescendant] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    deathDate: "",
    birthplace: "",
    filiation: "",
    biography: "",
  });

  const [descendantForm, setDescendantForm] = useState({
    name: "",
    relationship: "",
  });

  useEffect(() => {
    if (memorial) {
      setFormData({
        fullName: memorial.fullName,
        birthDate: memorial.birthDate || "",
        deathDate: memorial.deathDate || "",
        birthplace: memorial.birthplace || "",
        filiation: memorial.filiation || "",
        biography: memorial.biography || "",
      });
    }
  }, [memorial]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement memorial update API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Memorial atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar memorial.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDescendant = async () => {
    if (!descendantForm.name || !descendantForm.relationship) {
      toast.error("Preencha todos os campos.");
      return;
    }
    try {
      // TODO: Implement add descendant API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Familiar adicionado com sucesso!");
      setShowAddDescendant(false);
      setDescendantForm({ name: "", relationship: "" });
    } catch (error) {
      toast.error("Erro ao adicionar familiar.");
    }
  };

  const handleAddPhoto = async () => {
    try {
      // TODO: Implement add photo API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("Foto adicionada com sucesso!");
      setShowAddPhoto(false);
    } catch (error) {
      toast.error("Erro ao adicionar foto.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-500">Memorial não encontrado.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Editar Memorial</h1>
                <p className="text-sm text-gray-500">{memorial.fullName}</p>
              </div>
            </div>
            <Button onClick={handleSave} className="btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Memorial Header Card */}
        <div className="card-modern p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative group">
              <img
                src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=0F766E&color=fff&size=128`}
                alt={memorial.fullName}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover"
              />
              <button className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{memorial.fullName}</h2>
              <div className="flex items-center gap-6 text-gray-500 mb-4">
                {memorial.birthDate && memorial.deathDate && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {memorial.birthDate.split('-')[0]} - {memorial.deathDate.split('-')[0]}
                  </span>
                )}
                {memorial.birthplace && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {memorial.birthplace}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <span className="badge-success">Ativo</span>
                <span className="badge-info">Público</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-1">
            <TabsTrigger value="info" className="flex items-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 text-xs sm:text-sm px-2 sm:px-3">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Informações</span>
            </TabsTrigger>
            <TabsTrigger value="descendants" className="flex items-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 text-xs sm:text-sm px-2 sm:px-3">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Familiares</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 text-xs sm:text-sm px-2 sm:px-3">
              <Image className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="dedications" className="flex items-center gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 text-xs sm:text-sm px-2 sm:px-3">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Dedicações</span>
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info">
            <div className="card-modern p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Informações Pessoais</h3>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                  <input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Naturalidade</label>
                  <input
                    value={formData.birthplace}
                    onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Falecimento</label>
                  <input
                    type="date"
                    value={formData.deathDate}
                    onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                    className="input-modern"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filiação</label>
                  <input
                    value={formData.filiation}
                    onChange={(e) => setFormData({ ...formData, filiation: e.target.value })}
                    placeholder="Ex: Filho(a) de João Silva e Maria Santos"
                    className="input-modern"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Biografia</label>
                  <textarea
                    value={formData.biography}
                    onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                    rows={8}
                    className="input-modern resize-none"
                    placeholder="Conte a história de vida..."
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Descendants Tab */}
          <TabsContent value="descendants">
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Familiares</h3>
                <Dialog open={showAddDescendant} onOpenChange={setShowAddDescendant}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Adicionar Familiar</DialogTitle>
                      <DialogDescription>Adicione um membro da família ao memorial</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                        <input
                          value={descendantForm.name}
                          onChange={(e) => setDescendantForm({ ...descendantForm, name: e.target.value })}
                          className="input-modern"
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parentesco</label>
                        <select
                          value={descendantForm.relationship}
                          onChange={(e) => setDescendantForm({ ...descendantForm, relationship: e.target.value })}
                          className="input-modern"
                        >
                          <option value="">Selecione...</option>
                          <option value="Filho(a)">Filho(a)</option>
                          <option value="Neto(a)">Neto(a)</option>
                          <option value="Bisneto(a)">Bisneto(a)</option>
                          <option value="Cônjuge">Cônjuge</option>
                          <option value="Irmão(ã)">Irmão(ã)</option>
                          <option value="Sobrinho(a)">Sobrinho(a)</option>
                        </select>
                      </div>
                      <Button onClick={handleAddDescendant} className="w-full btn-primary">
                        Adicionar Familiar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(memorial as any).descendants && (memorial as any).descendants.length > 0 ? (
                  (memorial as any).descendants.map((descendant: any, index: number) => (
                    <div
                      key={descendant.id}
                      className="group p-4 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all duration-300 fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={descendant.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(descendant.name)}&background=0F766E&color=fff&size=48`}
                          alt={descendant.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{descendant.name}</p>
                          <p className="text-sm text-gray-500">{descendant.relationship}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                            <Edit3 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    Nenhum familiar adicionado ainda.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Galeria de Fotos</h3>
                <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Foto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Adicionar Foto</DialogTitle>
                      <DialogDescription>Faça upload de uma nova foto para o memorial</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-teal-500 transition-colors cursor-pointer">
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Arraste uma foto ou clique para selecionar</p>
                        <p className="text-sm text-gray-400">PNG, JPG até 10MB</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Legenda</label>
                        <input className="input-modern" placeholder="Descreva a foto..." />
                      </div>
                      <Button onClick={handleAddPhoto} className="w-full btn-primary">
                        Adicionar Foto
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(memorial as any).photos && (memorial as any).photos.length > 0 ? (
                  (memorial as any).photos.map((photo: any, index: number) => (
                    <div
                      key={photo.id}
                      className="group relative rounded-xl overflow-hidden fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || "Memorial photo"}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white text-sm">{photo.caption}</p>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button className="p-1.5 bg-white/90 rounded-lg hover:bg-white">
                            <Edit3 className="w-4 h-4 text-gray-700" />
                          </button>
                          <button className="p-1.5 bg-white/90 rounded-lg hover:bg-white">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    Nenhuma foto adicionada ainda.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Dedications Tab */}
          <TabsContent value="dedications">
            <div className="card-modern p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Dedicações Recebidas</h3>
              <div className="space-y-4">
                {(memorial as any).dedications && (memorial as any).dedications.length > 0 ? (
                  (memorial as any).dedications.map((dedication: any, index: number) => (
                    <div
                      key={dedication.id}
                      className="p-5 bg-gray-50 rounded-xl fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={dedication.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(dedication.authorName)}&background=0F766E&color=fff&size=48`}
                          alt={dedication.authorName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{dedication.authorName}</p>
                              <p className="text-sm text-gray-500">{formatDate(dedication.createdAt)}</p>
                            </div>
                            <Heart className="w-5 h-5 text-rose-400" />
                          </div>
                          <p className="text-gray-600 leading-relaxed">{dedication.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Nenhuma dedicação recebida ainda.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
