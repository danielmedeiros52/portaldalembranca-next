"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { toast } from "sonner";
import {
  QrCode, Heart, Calendar, MapPin, Users, Image as ImageIcon,
  MessageSquare, Share2, ArrowLeft, Send, Download,
  Landmark, Star, Play, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";

const APP_TITLE = "Portal da Lembrança";

export default function PublicMemorialPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [showDedicationDialog, setShowDedicationDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const [dedicationForm, setDedicationForm] = useState({
    authorName: "",
    message: "",
  });

  // Fetch memorial data
  const { data: memorial, isLoading } = api.memorial.getBySlug.useQuery({ slug });

  const createDedicationMutation = api.dedication.create.useMutation();

  const handleSubmitDedication = async () => {
    if (!memorial || !dedicationForm.authorName || !dedicationForm.message) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    try {
      const result = await createDedicationMutation.mutateAsync({
        memorialId: memorial.id,
        authorName: dedicationForm.authorName,
        message: dedicationForm.message,
      });

      toast.success(result.message || "Homenagem enviada! Ela será exibida após aprovação da família.");
      setShowDedicationDialog(false);
      setDedicationForm({ authorName: "", message: "" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar homenagem");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `Memorial de ${memorial?.fullName}`,
        url: url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const calculateAge = (birthDate: string, deathDate: string) => {
    const birth = new Date(birthDate);
    const death = new Date(deathDate);
    let age = death.getFullYear() - birth.getFullYear();
    const m = death.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando memorial...</p>
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Memorial não encontrado</h2>
          <p className="text-gray-600 mb-6">Este memorial pode ter sido removido ou o link está incorreto.</p>
          <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  const age = memorial.birthDate && memorial.deathDate ? calculateAge(memorial.birthDate, memorial.deathDate) : null;
  const photos = (memorial as any).photos || [];
  const descendants = (memorial as any).descendants || [];
  const dedications = (memorial as any).dedications || [];
  const videoEmbedUrl = memorial.videoUrl ? getYouTubeEmbedUrl(memorial.videoUrl) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Background */}
        <div className="absolute inset-0 gradient-hero opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

        {/* Navigation */}
        <nav className="relative z-10 px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
              <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <QrCode className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">QR Code</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-center">QR Code do Memorial</DialogTitle>
                    <DialogDescription className="text-center">
                      Escaneie para acessar este memorial
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center py-6">
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-4 text-center">{memorial.fullName}</p>
                    <Button className="mt-4 btn-primary">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar QR Code
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-4 sm:px-6 pb-24 sm:pb-32 pt-8 sm:pt-12">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6 relative inline-block">
              <img
                src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=ffffff&color=0F766E&size=160`}
                alt={memorial.fullName}
                className="w-28 h-28 sm:w-40 sm:h-40 rounded-full mx-auto object-cover ring-4 ring-white shadow-2xl"
              />
              {memorial.isHistorical && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                  <Landmark className="w-3.5 h-3.5" />
                  Memorial Histórico
                </div>
              )}
            </div>
            {memorial.isHistorical && memorial.popularName && (
              <p className="text-white/90 text-lg sm:text-xl mb-2">{memorial.popularName}</p>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">{memorial.fullName}</h1>
            {memorial.isHistorical && memorial.category && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm mb-4">
                <Star className="w-4 h-4" />
                {memorial.category}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-white/80 mb-4 sm:mb-6 text-sm sm:text-base">
              {memorial.birthDate && memorial.deathDate && (
                <>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {formatDate(memorial.birthDate)} - {formatDate(memorial.deathDate)}
                  </span>
                  {memorial.birthplace && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {memorial.birthplace}
                    </span>
                  )}
                </>
              )}
            </div>
            {age && <p className="text-white/90 text-base sm:text-lg">{age} anos de vida</p>}
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 pb-12 sm:pb-16">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Biography */}
            {memorial.biography && (
              <section className="card-modern p-5 sm:p-8 fade-in">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6 text-teal-600" />
                  Biografia
                </h2>
                <div className="prose prose-gray max-w-none">
                  {memorial.biography.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 leading-relaxed mb-4 text-base">{paragraph}</p>
                  ))}
                </div>
                {memorial.filiation && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-800">Filiação:</span> {memorial.filiation}
                    </p>
                  </div>
                )}
                {memorial.isHistorical && memorial.graveLocation && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">Local de Sepultamento</p>
                        <p className="text-gray-600">{memorial.graveLocation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Video Section */}
            {videoEmbedUrl && (
              <section className="card-modern p-5 sm:p-8 fade-in stagger-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <Play className="w-6 h-6 text-purple-600" />
                  Vídeo Memorial
                </h2>
                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-xl">
                  <iframe
                    src={videoEmbedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </section>
            )}

            {/* Photo Gallery */}
            {photos.length > 0 && (
              <section className="card-modern p-5 sm:p-8 fade-in stagger-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                  Galeria de Fotos ({photos.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {photos.map((photo: any, index: number) => (
                    <button
                      key={photo.id}
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setCurrentPhotoIndex(index);
                      }}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || `Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          {photo.caption && (
                            <p className="text-white text-xs font-medium line-clamp-2">{photo.caption}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Descendants */}
            {descendants.length > 0 && (
              <section className="card-modern p-5 sm:p-8 fade-in stagger-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                  Família
                </h2>
                <div className="space-y-3">
                  {descendants.map((descendant: any) => (
                    <div
                      key={descendant.id}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-teal-200 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-teal-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{descendant.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{descendant.relationship}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Dedications */}
            <section className="card-modern p-5 sm:p-8 fade-in stagger-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                  Homenagens ({dedications.length})
                </h2>
                <Dialog open={showDedicationDialog} onOpenChange={setShowDedicationDialog}>
                  <DialogTrigger asChild>
                    <Button className="btn-secondary text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3 w-full sm:w-auto">
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Homenagem
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white">
                    <DialogHeader>
                      <DialogTitle>Enviar uma Homenagem</DialogTitle>
                      <DialogDescription>
                        Compartilhe uma lembrança ou mensagem de carinho.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Seu Nome</label>
                        <input
                          value={dedicationForm.authorName}
                          onChange={(e) => setDedicationForm({ ...dedicationForm, authorName: e.target.value })}
                          className="input-modern"
                          placeholder="Como deseja ser identificado"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sua Mensagem</label>
                        <textarea
                          value={dedicationForm.message}
                          onChange={(e) => setDedicationForm({ ...dedicationForm, message: e.target.value })}
                          rows={5}
                          className="input-modern resize-none"
                          placeholder="Compartilhe uma lembrança, uma mensagem de carinho..."
                        />
                      </div>
                      <Button onClick={handleSubmitDedication} className="w-full btn-secondary">
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Homenagem
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {dedications.length === 0 ? (
                  <div className="p-8 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl text-center border border-rose-100">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Heart className="w-8 h-8 text-rose-400" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      Seja o primeiro a deixar uma homenagem
                    </p>
                    <p className="text-sm text-gray-500">
                      Compartilhe uma lembrança especial
                    </p>
                  </div>
                ) : (
                  dedications.map((dedication: any) => (
                    <div
                      key={dedication.id}
                      className="p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                          <Heart className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{dedication.authorName}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(dedication.createdAt).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed pl-13">{dedication.message}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code Card */}
            <section className="card-modern p-4 sm:p-6 text-center fade-in stagger-4">
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  alt="QR Code"
                  className="w-32 h-32 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mb-2">Escaneie para acessar</p>
              <p className="text-xs text-gray-400">memorial.qr/{memorial.slug}</p>
            </section>

            {/* Stats */}
            <section className="card-modern p-4 sm:p-6 fade-in stagger-5">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="group hover:scale-105 transition-transform duration-300">
                  <div className="mb-2">
                    <ImageIcon className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {photos.length}
                  </p>
                  <p className="text-sm text-gray-500">Fotos</p>
                </div>
                <div className="group hover:scale-105 transition-transform duration-300">
                  <div className="mb-2">
                    <Heart className="w-5 h-5 mx-auto text-rose-500 mb-1" />
                  </div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                    {dedications.length}
                  </p>
                  <p className="text-sm text-gray-500">Homenagens</p>
                </div>
              </div>
            </section>

            {/* CTA - Create Family Memorial */}
            <section className="card-modern p-5 sm:p-6 fade-in stagger-6 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Crie um memorial para sua família
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Preserve a memória de seus entes queridos com um memorial digital personalizado, assim como este.
                </p>
                <Button
                  onClick={() => router.push('/checkout')}
                  className="btn-primary w-full sm:w-auto"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Criar Memorial
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  A partir de R$ 19,90/ano
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhoto(null);
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          {currentPhotoIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = currentPhotoIndex - 1;
                setCurrentPhotoIndex(newIndex);
                setSelectedPhoto(photos[newIndex]);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {currentPhotoIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = currentPhotoIndex + 1;
                setCurrentPhotoIndex(newIndex);
                setSelectedPhoto(photos[newIndex]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110 text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={selectedPhoto.fileUrl}
                alt={selectedPhoto.caption || "Foto do memorial"}
                className="w-full h-auto max-h-[75vh] object-contain bg-black/50"
              />
            </div>
            {selectedPhoto.caption && (
              <div className="mt-6 text-center">
                <p className="text-white text-lg font-medium">{selectedPhoto.caption}</p>
                <p className="text-white/60 text-sm mt-2">
                  {currentPhotoIndex + 1} / {photos.length}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-teal-400" />
            <span className="font-semibold">{APP_TITLE}</span>
          </div>
          <p className="text-gray-400 text-sm">Um lugar para recordar e homenagear.</p>
        </div>
      </footer>
    </div>
  );
}
