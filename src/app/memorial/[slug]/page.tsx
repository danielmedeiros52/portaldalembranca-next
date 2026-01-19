"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { toast } from "sonner";
import {
  QrCode, Heart, Calendar, MapPin, Users, Image,
  MessageSquare, Share2, ArrowLeft, Send, Download,
  FileText, BookOpen, Newspaper, Video, Building2, GraduationCap, ExternalLink, Landmark
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

  const [dedicationForm, setDedicationForm] = useState({
    authorName: "",
    message: "",
  });

  // Fetch memorial data
  const { data: memorial, isLoading } = api.memorial.getBySlug.useQuery({ slug });

  const handleSubmitDedication = () => {
    toast.success("Sua dedicação foi enviada.");
    setShowDedicationDialog(false);
    setDedicationForm({ authorName: "", message: "" });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Memorial não encontrado</p>
      </div>
    );
  }

  const age = memorial.birthDate && memorial.deathDate ? calculateAge(memorial.birthDate, memorial.deathDate) : null;

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
            <section className="card-modern p-5 sm:p-8 fade-in">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Biografia</h2>
              <div className="prose prose-gray max-w-none">
                {memorial.biography?.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-600 leading-relaxed mb-4">{paragraph}</p>
                ))}
              </div>
              {memorial.filiation && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Filiação:</span> {memorial.filiation}
                  </p>
                </div>
              )}
              {memorial.isHistorical && memorial.graveLocation && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Local de Sepultamento</p>
                      <p className="text-gray-600">{memorial.graveLocation}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Dedications */}
            <section className="card-modern p-5 sm:p-8 fade-in stagger-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                  Homenagens
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
                <div className="p-5 bg-gray-50 rounded-xl text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Seja o primeiro a deixar uma homenagem
                  </p>
                </div>
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
                <div>
                  <p className="text-2xl font-bold text-teal-600">0</p>
                  <p className="text-sm text-gray-500">Fotos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-rose-500">0</p>
                  <p className="text-sm text-gray-500">Dedicações</p>
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
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={selectedPhoto.fileUrl}
              alt={selectedPhoto.caption}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-white text-center mt-4">{selectedPhoto.caption}</p>
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
