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
  Plus, Trash2, Edit3, Calendar, MapPin, Heart, Upload, Loader2, Video,
  CheckCircle, XCircle, AlertCircle
} from "lucide-react";

export default function MemorialEditPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const { data: memorial, isLoading, refetch } = api.memorial.getBySlug.useQuery({ slug });
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
    videoUrl: "",
    visibility: "public" as "public" | "private",
  });

  const [descendantForm, setDescendantForm] = useState({
    name: "",
    relationship: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<{ id: number; caption: string } | null>(null);
  const [showEditPhoto, setShowEditPhoto] = useState(false);

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

  useEffect(() => {
    if (memorial) {
      setFormData({
        fullName: memorial.fullName,
        birthDate: memorial.birthDate || "",
        deathDate: memorial.deathDate || "",
        birthplace: memorial.birthplace || "",
        filiation: memorial.filiation || "",
        biography: memorial.biography || "",
        videoUrl: memorial.videoUrl || "",
        visibility: memorial.visibility || "public",
      });
    }
  }, [memorial]);

  // Mutations
  const updateMemorialMutation = api.memorial.update.useMutation();
  const createDescendantMutation = api.descendant.create.useMutation();
  const createPhotoMutation = api.photo.create.useMutation();
  const deletePhotoMutation = api.photo.delete.useMutation();
  const updatePhotoMutation = api.photo.update.useMutation();
  const setAsMainPhotoMutation = api.photo.setAsMainPhoto.useMutation();
  const setAsCoverMutation = api.photo.setAsCover.useMutation();
  const approveDedicationMutation = api.dedication.approve.useMutation();
  const rejectDedicationMutation = api.dedication.reject.useMutation();

  // Fetch pending dedications
  const { data: pendingDedications, refetch: refetchPending } = api.dedication.getPending.useQuery(
    { memorialId: memorial?.id || 0 },
    { enabled: !!memorial?.id }
  );

  const handleSave = async () => {
    if (!memorial) return;

    setIsSaving(true);
    try {
      // Ensure dates are in ISO format before saving
      const birthDateISO = formData.birthDate ?
        (formData.birthDate.includes("-") ? formData.birthDate : convertBRToISO(formData.birthDate)) :
        undefined;
      const deathDateISO = formData.deathDate ?
        (formData.deathDate.includes("-") ? formData.deathDate : convertBRToISO(formData.deathDate)) :
        undefined;

      await updateMemorialMutation.mutateAsync({
        id: memorial.id,
        fullName: formData.fullName,
        birthDate: birthDateISO,
        deathDate: deathDateISO,
        birthplace: formData.birthplace || undefined,
        filiation: formData.filiation || undefined,
        biography: formData.biography || undefined,
        visibility: formData.visibility,
      });
      toast.success("Memorial atualizado com sucesso!");
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Erro ao atualizar memorial.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDescendant = async () => {
    if (!memorial) return;
    if (!descendantForm.name || !descendantForm.relationship) {
      toast.error("Preencha todos os campos.");
      return;
    }
    try {
      await createDescendantMutation.mutateAsync({
        memorialId: memorial.id,
        name: descendantForm.name,
        relationship: descendantForm.relationship,
      });
      toast.success("Familiar adicionado com sucesso!");
      setShowAddDescendant(false);
      setDescendantForm({ name: "", relationship: "" });
    } catch (error: any) {
      console.error("Add descendant error:", error);
      toast.error(error.message || "Erro ao adicionar familiar.");
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB for base64)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Tamanho máximo: 5MB");
        return;
      }
      setPhotoFile(file);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhoto = async () => {
    if (!memorial || !photoFile) {
      toast.error("Selecione uma foto.");
      return;
    }

    // Check photo limit
    const currentPhotoCount = (memorial as any).photos?.length || 0;
    if (currentPhotoCount >= 5) {
      toast.error("Limite máximo de 5 fotos atingido.");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(photoFile);

      await createPhotoMutation.mutateAsync({
        memorialId: memorial.id,
        fileUrl: base64Image,
        caption: photoCaption || undefined,
      });

      toast.success("Foto adicionada com sucesso!");
      setShowAddPhoto(false);
      setPhotoFile(null);
      setPhotoCaption("");
      refetch();
    } catch (error: any) {
      console.error("Add photo error:", error);
      toast.error(error.message || "Erro ao adicionar foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return;

    try {
      await deletePhotoMutation.mutateAsync({ id: photoId });
      toast.success("Foto excluída com sucesso!");
      refetch();
    } catch (error: any) {
      console.error("Delete photo error:", error);
      toast.error(error.message || "Erro ao excluir foto.");
    }
  };

  const handleEditPhoto = (photo: any) => {
    setEditingPhoto({ id: photo.id, caption: photo.caption || "" });
    setShowEditPhoto(true);
  };

  const handleUpdatePhoto = async () => {
    if (!editingPhoto) return;

    try {
      await updatePhotoMutation.mutateAsync({
        id: editingPhoto.id,
        caption: editingPhoto.caption,
      });
      toast.success("Legenda atualizada com sucesso!");
      setShowEditPhoto(false);
      setEditingPhoto(null);
      refetch();
    } catch (error: any) {
      console.error("Update photo error:", error);
      toast.error(error.message || "Erro ao atualizar legenda.");
    }
  };

  const handleSetAsMainPhoto = async (photoId: number) => {
    if (!memorial) return;

    try {
      await setAsMainPhotoMutation.mutateAsync({
        photoId,
        memorialId: memorial.id,
      });
      toast.success("Foto de perfil atualizada com sucesso!");
      refetch();
    } catch (error: any) {
      console.error("Set main photo error:", error);
      toast.error(error.message || "Erro ao definir foto de perfil.");
    }
  };

  const handleSetAsCover = async (photoId: number) => {
    if (!memorial) return;

    try {
      await setAsCoverMutation.mutateAsync({
        photoId,
        memorialId: memorial.id,
      });
      toast.success("Foto de capa definida com sucesso!");
      refetch();
    } catch (error: any) {
      console.error("Set cover photo error:", error);
      toast.error(error.message || "Erro ao definir foto de capa.");
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Falecimento</label>
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
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link do Vídeo (YouTube ou Vimeo)</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="input-modern"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-2">Cole o link completo do vídeo do YouTube ou Vimeo</p>
                  {formData.videoUrl && (
                    <div className="mt-4 aspect-video rounded-xl overflow-hidden border border-gray-200">
                      <iframe
                        src={formData.videoUrl.replace("watch?v=", "embed/")}
                        className="w-full h-full"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibilidade</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as "public" | "private" })}
                    className="input-modern"
                  >
                    <option value="public">Público - Qualquer pessoa pode ver</option>
                    <option value="private">Privado - Apenas familiares convidados</option>
                  </select>
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Galeria de Fotos</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {(memorial as any).photos?.length || 0} de 5 fotos
                  </p>
                </div>
                <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
                  <DialogTrigger asChild>
                    <Button
                      className="btn-primary"
                      disabled={((memorial as any).photos?.length || 0) >= 5}
                    >
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
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileChange}
                          className="hidden"
                        />
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-teal-500 transition-colors">
                          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">
                            {photoFile ? photoFile.name : "Arraste uma foto ou clique para selecionar"}
                          </p>
                          <p className="text-sm text-gray-400">PNG, JPG até 5MB</p>
                        </div>
                      </label>
                      {photoFile && (
                        <div className="aspect-video rounded-xl overflow-hidden border border-gray-200">
                          <img
                            src={URL.createObjectURL(photoFile)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Legenda</label>
                        <input
                          value={photoCaption}
                          onChange={(e) => setPhotoCaption(e.target.value)}
                          className="input-modern"
                          placeholder="Descreva a foto..."
                        />
                      </div>
                      <Button
                        onClick={handleAddPhoto}
                        disabled={!photoFile || uploadingPhoto}
                        className="w-full btn-primary"
                      >
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          "Adicionar Foto"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {((memorial as any).photos?.length || 0) >= 5 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Limite atingido:</strong> Você atingiu o limite máximo de 5 fotos. Para adicionar uma nova foto, exclua uma foto existente primeiro.
                  </p>
                </div>
              )}

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
                          <p className="text-white text-sm">{photo.caption || "Sem legenda"}</p>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => handleSetAsCover(photo.id)}
                            className={`p-1.5 rounded-lg transition-colors ${photo.isCover ? 'bg-blue-500 text-white' : 'bg-white/90 hover:bg-white text-blue-600'}`}
                            title={photo.isCover ? "Foto de capa atual" : "Definir como foto de capa"}
                          >
                            <Image className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSetAsMainPhoto(photo.id)}
                            className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                            title="Definir como foto de perfil"
                          >
                            <User className="w-4 h-4 text-teal-600" />
                          </button>
                          <button
                            onClick={() => handleEditPhoto(photo)}
                            className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                            title="Editar legenda"
                          >
                            <Edit3 className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                            title="Excluir foto"
                          >
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

            {/* Edit Photo Dialog */}
            <Dialog open={showEditPhoto} onOpenChange={setShowEditPhoto}>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Editar Legenda</DialogTitle>
                  <DialogDescription>Atualize a legenda da foto</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Legenda</label>
                    <input
                      value={editingPhoto?.caption || ""}
                      onChange={(e) => setEditingPhoto(prev => prev ? { ...prev, caption: e.target.value } : null)}
                      className="input-modern"
                      placeholder="Descreva a foto..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdatePhoto}
                      className="flex-1 btn-primary"
                    >
                      Salvar
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEditPhoto(false);
                        setEditingPhoto(null);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Dedications Tab */}
          <TabsContent value="dedications">
            <div className="space-y-6">
              {/* Pending Dedications */}
              {pendingDedications && pendingDedications.length > 0 && (
                <div className="card-modern p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Homenagens Pendentes ({pendingDedications.length})
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    Revise e aprove as homenagens antes que elas sejam exibidas publicamente.
                  </p>
                  <div className="space-y-4">
                    {pendingDedications.map((dedication: any, index: number) => (
                      <div
                        key={dedication.id}
                        className="p-5 bg-amber-50 border border-amber-100 rounded-xl fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                            <Heart className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-semibold text-gray-900">{dedication.authorName}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(dedication.createdAt).toLocaleDateString('pt-BR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed mb-4">{dedication.message}</p>
                            <div className="flex gap-2">
                              <Button
                                onClick={async () => {
                                  try {
                                    await approveDedicationMutation.mutateAsync({ id: dedication.id });
                                    toast.success("Homenagem aprovada!");
                                    refetchPending();
                                  } catch (error: any) {
                                    toast.error(error.message || "Erro ao aprovar");
                                  }
                                }}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Aprovar
                              </Button>
                              <Button
                                onClick={async () => {
                                  try {
                                    await rejectDedicationMutation.mutateAsync({ id: dedication.id });
                                    toast.success("Homenagem rejeitada");
                                    refetchPending();
                                  } catch (error: any) {
                                    toast.error(error.message || "Erro ao rejeitar");
                                  }
                                }}
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeitar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Dedications */}
              <div className="card-modern p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Homenagens Aprovadas</h3>
                <div className="space-y-4">
                  {(memorial as any).dedications && (memorial as any).dedications.length > 0 ? (
                    (memorial as any).dedications.map((dedication: any, index: number) => (
                      <div
                        key={dedication.id}
                        className="p-5 bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                            <Heart className="w-6 h-6 text-rose-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{dedication.authorName}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(dedication.createdAt).toLocaleDateString('pt-BR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Aprovada
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{dedication.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Nenhuma homenagem aprovada ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
