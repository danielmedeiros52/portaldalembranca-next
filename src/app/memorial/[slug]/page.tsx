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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando memorial...</p>
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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

  // Find cover photo or use main photo as fallback
  const coverPhoto = photos.find((p: any) => p.isCover)?.fileUrl || memorial.mainPhoto;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Photo Background - Subdued and Respectful */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-300 via-gray-200 to-gray-100"></div>
        {coverPhoto && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.15]"
            style={{ backgroundImage: `url(${coverPhoto})` }}
          ></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-200/70 to-gray-100"></div>

        {/* Navigation */}
        <nav className="relative z-10 px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                    <div className="bg-gray-50 p-4 rounded-2xl shadow-lg border border-gray-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://portaldalembranca.com.br/memorial/' + slug)}`}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-4 text-center font-medium">{memorial.fullName}</p>
                    <p className="text-xs text-gray-400 mt-1">portaldalembranca.com.br</p>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent('https://portaldalembranca.com.br/memorial/' + slug)}`;
                        link.download = `qrcode-${memorial.fullName.replace(/\s+/g, '-').toLowerCase()}.png`;
                        link.click();
                      }}
                      className="mt-4 bg-gray-800 hover:bg-gray-900 text-white px-6 py-2.5 rounded-lg transition-colors"
                    >
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
                src={memorial.mainPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(memorial.fullName)}&background=f8fafc&color=475569&size=160`}
                alt={memorial.fullName}
                className="w-28 h-28 sm:w-40 sm:h-40 rounded-full mx-auto object-cover ring-4 ring-slate-200 shadow-xl"
              />
              {memorial.isHistorical && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                  <Landmark className="w-3.5 h-3.5" />
                  Memorial Histórico
                </div>
              )}
            </div>
            {memorial.isHistorical && memorial.popularName && (
              <p className="text-gray-700 text-lg sm:text-xl mb-2">{memorial.popularName}</p>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4">{memorial.fullName}</h1>
            {memorial.isHistorical && memorial.category && (
              <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-gray-700 text-sm mb-4">
                <Star className="w-4 h-4" />
                {memorial.category}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
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
            {age && <p className="text-gray-600 text-base sm:text-lg italic">{age} anos de vida</p>}
          </div>
        </div>

        {/* Wave Divider - Gray gradient transitioning to white */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-24">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#e5e7eb', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#f3f4f6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="url(#waveGradient)" />
          </svg>
        </div>
      </div>

      {/* Main Content - Digital Lapide Style */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 pb-12 sm:pb-16">

        {/* Video Section - Full Width */}
        {videoEmbedUrl && (
          <section className="card-modern p-6 sm:p-8 mb-8 fade-in">
            <p className="text-sm text-gray-500 mb-4 text-center uppercase tracking-wider">Vídeo</p>
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-900 shadow-lg">
              <iframe
                src={videoEmbedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </section>
        )}

        {/* 3-Column Layout */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">

          {/* Column 1 - Galeria, Família */}
          <div className="lg:col-span-3 space-y-6">
            {/* Photo Gallery */}
            {photos.length > 0 && (
              <section className="card-modern p-6 fade-in stagger-1">
                <p className="text-sm text-gray-500 mb-4 text-center uppercase tracking-wider">Galeria</p>
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo: any, index: number) => (
                    <button
                      key={photo.id}
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setCurrentPhotoIndex(index);
                      }}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
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
              <section className="card-modern p-6 fade-in stagger-2">
                <p className="text-sm text-gray-500 mb-4 text-center uppercase tracking-wider">Família</p>
                <div className="space-y-3">
                  {descendants.map((descendant: any) => (
                    <div
                      key={descendant.id}
                      className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <p className="font-medium text-gray-900 text-sm mb-1">{descendant.name}</p>
                      <p className="text-xs text-gray-500 capitalize italic">{descendant.relationship}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Column 2 - Biography, Homenagens */}
          <div className="lg:col-span-6 space-y-6">
            {/* Memorial Plaque - Biography */}
            {memorial.biography && (
              <div className="card-modern p-8 sm:p-10 fade-in">
                <div className="prose prose-gray prose-lg max-w-none">
                  {memorial.biography.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 leading-relaxed mb-6 text-center text-base sm:text-lg first:text-xl first:font-serif first:italic first:text-gray-600">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {memorial.filiation && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm sm:text-base text-gray-600 italic">
                      Filho(a) de {memorial.filiation}
                    </p>
                  </div>
                )}

                {memorial.isHistorical && memorial.graveLocation && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <p className="text-sm">{memorial.graveLocation}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dedications */}
            <section className="card-modern p-6 sm:p-8 fade-in stagger-3">
              <div className="max-w-3xl mx-auto">
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">Homenagens ({dedications.length})</p>
              <Dialog open={showDedicationDialog} onOpenChange={setShowDedicationDialog}>
                <DialogTrigger asChild>
                    <Button className="bg-gray-700 hover:bg-gray-800 text-white text-sm px-6 py-2.5 rounded-lg transition-colors">
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
                      <Button onClick={handleSubmitDedication} className="w-full bg-gray-700 hover:bg-gray-800 text-white py-2.5 rounded-lg transition-colors">
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Homenagem
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                {dedications.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500 text-sm italic">
                      Seja o primeiro a deixar uma homenagem
                    </p>
                  </div>
                ) : (
                  dedications.map((dedication: any) => (
                    <div
                      key={dedication.id}
                      className="p-5 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="mb-3">
                        <p className="font-medium text-gray-900 text-sm">{dedication.authorName}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(dedication.createdAt).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-sm italic">{dedication.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
          </div>

          {/* Column 3 - QR Code, Stats, CTA */}
          <div className="lg:col-span-3 space-y-6">
            {/* QR Code Card */}
            <section className="card-modern p-6 text-center fade-in stagger-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">QR Code</p>
              <div className="bg-gray-50 rounded-lg p-4 mb-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  alt="QR Code"
                  className="w-28 h-28 mx-auto"
                />
              </div>
              <p className="text-xs text-gray-500">Escaneie para acessar</p>
            </section>

            {/* Stats */}
            <section className="card-modern p-6 fade-in stagger-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Fotos</span>
                  <span className="text-lg font-semibold text-gray-900">{photos.length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Homenagens</span>
                  <span className="text-lg font-semibold text-gray-900">{dedications.length}</span>
                </div>
              </div>
            </section>

            {/* CTA - Create Family Memorial */}
            <section className="card-modern p-6 fade-in stagger-6 bg-gray-50 border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Crie seu memorial</p>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Preserve a memória de seus entes queridos com um memorial digital personalizado
                </p>
                <Button
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm py-2.5 rounded-lg transition-colors"
                >
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
