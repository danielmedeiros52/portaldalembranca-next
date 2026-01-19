"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Heart, QrCode, Users, Sparkles, ArrowRight, Star, X, Mail, User, Phone, CheckCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

const APP_TITLE = "Portal da Lembrança";

export default function HomePage() {
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    phone: "",
    acceptEmails: false
  });
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Fetch featured historical memorials
  const { data: featuredMemorials } = api.memorial.getFeaturedHistoricMemorials.useQuery();

  const createLeadMutation = api.lead.create.useMutation({
    onSuccess: () => {
      setInviteSuccess(true);
      toast.success("Solicitação enviada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar solicitação. Tente novamente.");
    },
  });

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteForm.name.trim()) {
      toast.error("Por favor, informe seu nome.");
      return;
    }
    if (!inviteForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) {
      toast.error("Por favor, informe um e-mail válido.");
      return;
    }
    if (!inviteForm.acceptEmails) {
      toast.error("Você precisa autorizar o recebimento de e-mails para continuar.");
      return;
    }

    createLeadMutation.mutate({
      name: inviteForm.name,
      email: inviteForm.email,
      phone: inviteForm.phone || undefined,
      acceptEmails: inviteForm.acceptEmails,
    });
  };

  const closeModal = () => {
    setShowInviteModal(false);
    setInviteSuccess(false);
    setInviteForm({ name: "", email: "", phone: "", acceptEmails: false });
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              className="hidden md:inline-flex text-gray-600 hover:text-teal-700"
              onClick={() => router.push("/historic-memorials")}
            >
              Memoriais Históricos
            </Button>
            <Button
              variant="ghost"
              className="hidden sm:inline-flex text-gray-600 hover:text-teal-700"
              onClick={() => {
                const pricingSection = document.getElementById("pricing");
                pricingSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Planos
            </Button>
            <Button
              onClick={() => router.push("/login")}
              variant="ghost"
              className="text-gray-600 hover:text-teal-700 text-sm sm:text-base"
            >
              Entrar
            </Button>
            <Button
              onClick={() => router.push("/checkout?plan=essencial")}
              className="btn-primary text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3"
            >
              Começar
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 float" style={{ animationDelay: '4s' }}></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full text-teal-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Preservando memórias em Pernambuco
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
                Eternize memórias com{" "}
                <span className="text-gradient">dignidade</span> e carinho
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8">
                Crie um memorial digital duradouro com fotos, história e homenagens. Acesso via QR Code permanente para familiares e amigos visitarem a qualquer momento.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => router.push("/checkout?plan=essencial")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Começar Agora
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    const pricingSection = document.getElementById("pricing");
                    pricingSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  variant="outline"
                  className="btn-outline"
                >
                  Ver Planos
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">Ilimitado</p>
                  <p className="text-xs sm:text-sm text-gray-500">Compartilhamento com familiares e amigos</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">QR Code</p>
                  <p className="text-xs sm:text-sm text-gray-500">Acesso permanente via celular</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">Seguro</p>
                  <p className="text-xs sm:text-sm text-gray-500">Dados protegidos e sempre disponíveis</p>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image/Card */}
            <div className="relative fade-in stagger-2 hidden md:block">
              <div className="relative">
                {/* Main Card */}
                <div className="card-modern p-6 max-w-md mx-auto">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
                      alt="Memorial"
                      className="w-16 h-16 avatar"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">Maria Silva Santos</h3>
                      <p className="text-sm text-gray-500">1945 - 2024</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    Maria foi uma mulher dedicada à família e à comunidade. Sua paixão pela jardinagem transformou sua casa em um verdadeiro jardim botânico...
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face" className="w-8 h-8 avatar" alt="" />
                      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face" className="w-8 h-8 avatar" alt="" />
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face" className="w-8 h-8 avatar" alt="" />
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-medium text-teal-700 ring-2 ring-white">+4</div>
                    </div>
                    <span className="text-sm text-gray-500">4 dedicações</span>
                  </div>
                </div>

                {/* Floating QR Code */}
                <div className="absolute -right-4 -bottom-4 card-modern p-4 pulse-glow">
                  <QrCode className="w-16 h-16 text-teal-600" />
                </div>

                {/* Floating Badge */}
                <div className="absolute -left-4 top-1/4 card-modern px-4 py-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-medium text-gray-700">Memorial Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Historical Memorials Section */}
      {featuredMemorials && featuredMemorials.length > 0 && (
        <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-12 fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-700 text-sm font-medium mb-4">
                <Star className="w-4 h-4 fill-amber-600" />
                Personalidades Históricas
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Preservando Legados de Pernambuco
              </h2>
              <div className="section-divider mb-6"></div>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Conheça as histórias de figuras que marcaram a história de Pernambuco e do Brasil
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredMemorials.map((memorial, index) => (
                <div
                  key={memorial.id}
                  className={`card-modern p-5 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 fade-in group`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => router.push(`/memorial/${memorial.slug}`)}
                >
                  {/* Image */}
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-amber-100 to-yellow-100">
                    {memorial.mainPhoto ? (
                      <img
                        src={memorial.mainPhoto}
                        alt={memorial.fullName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-6xl font-bold text-amber-300/40">
                          {memorial.fullName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    {/* Featured Badge */}
                    <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                      <Star className="w-3 h-3 fill-white" />
                      Destaque
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    {memorial.popularName ? (
                      <>
                        <h3 className="font-bold text-lg text-amber-700 group-hover:text-amber-800 transition-colors">
                          {memorial.popularName}
                        </h3>
                        <p className="text-sm text-gray-500">{memorial.fullName}</p>
                      </>
                    ) : (
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-amber-700 transition-colors">
                        {memorial.fullName}
                      </h3>
                    )}

                    {memorial.category && (
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                        {memorial.category}
                      </div>
                    )}

                    {memorial.biography && (
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {memorial.biography}
                      </p>
                    )}

                    <Button
                      variant="outline"
                      className="w-full mt-4 border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/memorial/${memorial.slug}`);
                      }}
                    >
                      Ver História Completa
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA to view all historical memorials */}
            <div className="text-center mt-10 sm:mt-12">
              <Button
                variant="outline"
                onClick={() => router.push("/historic-memorials")}
                className="btn-outline inline-flex items-center gap-2"
              >
                Ver Todos os Memoriais Históricos
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Plano Simples e Acessível</h2>
            <div className="section-divider mb-6"></div>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Memorial completo por apenas R$ 19,90 por ano. Sem complicação, sem custos escondidos.
            </p>
          </div>

          <div className="flex justify-center max-w-5xl mx-auto">
            {/* Plan 1 - Essencial */}
            <div className="card-modern p-6 fade-in stagger-1 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Memorial Essencial</h3>
                <p className="text-sm text-gray-500 mb-4">Ideal para preservar memórias de forma simples e acessível</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">R$ 19,90</span>
                  <span className="text-gray-500 text-sm">/ano</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Página memorial personalizada
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Galeria com até 10 fotos
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Biografia e história completa
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  QR Code para acesso digital
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Compartilhamento ilimitado
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Dedicações e homenagens
                </li>
              </ul>
              <Button
                onClick={() => router.push("/checkout?plan=essencial")}
                className="w-full btn-primary"
              >
                Começar Agora
              </Button>
              <p className="text-xs text-center text-gray-500 mt-4">
                Pagamento seguro via PIX ou cartão de crédito
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 gradient-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simples em 3 Passos</h2>
            <div className="section-divider mb-6"></div>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Criar um memorial é rápido e fácil. Comece agora mesmo.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="card-modern p-6 fade-in stagger-1 text-center">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Escolha o Plano</h3>
              <p className="text-gray-600">
                Selecione o plano Memorial Essencial por R$ 19,90/ano e inicie o processo
              </p>
            </div>

            {/* Step 2 */}
            <div className="card-modern p-6 fade-in stagger-2 text-center">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Preencha os Dados</h3>
              <p className="text-gray-600">
                Adicione fotos, biografia, datas importantes e homenagens especiais
              </p>
            </div>

            {/* Step 3 */}
            <div className="card-modern p-6 fade-in stagger-3 text-center">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Compartilhe</h3>
              <p className="text-gray-600">
                Receba seu QR Code e link para compartilhar com familiares e amigos
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              onClick={() => router.push("/checkout?plan=essencial")}
              className="btn-primary inline-flex items-center gap-2 px-8 py-4"
            >
              Criar Meu Memorial Agora
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Por Que Escolher o Portal da Lembrança?</h2>
            <div className="section-divider"></div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Benefit 1 */}
            <div className="card-modern p-6 fade-in stagger-1 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Preservação Digital</h3>
              <p className="text-gray-600">
                Suas memórias protegidas e acessíveis para sempre, sem risco de perda ou deterioração
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="card-modern p-6 fade-in stagger-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Acesso Familiar</h3>
              <p className="text-gray-600">
                Toda a família pode acessar e contribuir com fotos e homenagens de qualquer lugar
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="card-modern p-6 fade-in stagger-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">QR Code Prático</h3>
              <p className="text-gray-600">
                Acesse o memorial instantaneamente com o celular através do QR Code
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative gradient-hero rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"></div>

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Comece Seu Memorial Hoje</h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Preserve as memórias de quem você ama com dignidade e carinho. Processo simples e rápido.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={() => router.push("/checkout?plan=essencial")}
                  className="bg-white text-teal-700 font-semibold px-6 sm:px-10 py-3 sm:py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg text-sm sm:text-base inline-flex items-center gap-2"
                >
                  Criar Memorial Agora
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-white/80 text-sm mt-6">
                Apenas R$ 19,90/ano • Pagamento seguro • Cancele quando quiser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">{APP_TITLE}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-gray-400 text-sm sm:text-base">
              <a href="/support" className="hover:text-white transition-colors">Suporte</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacidade</a>
              <a href="/terms" className="hover:text-white transition-colors">Termos</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2024 {APP_TITLE}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 fade-in">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {!inviteSuccess ? (
              <>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Solicite um Convite</h3>
                  <p className="text-gray-600">
                    Preencha seus dados para receber acesso ao Portal da Lembrança
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Seu nome"
                        value={inviteForm.name}
                        onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                        className="input-modern pl-12"
                        disabled={createLeadMutation.isPending}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        className="input-modern pl-12"
                        disabled={createLeadMutation.isPending}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone (opcional)</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={inviteForm.phone}
                        onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                        className="input-modern pl-12"
                        disabled={createLeadMutation.isPending}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inviteForm.acceptEmails}
                        onChange={(e) => setInviteForm({ ...inviteForm, acceptEmails: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-0.5"
                        disabled={createLeadMutation.isPending}
                      />
                      <span className="text-sm text-gray-600">
                        Autorizo o recebimento de e-mails do Portal da Lembrança com novidades, atualizações e informações sobre o serviço.
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-primary py-3"
                    disabled={createLeadMutation.isPending}
                  >
                    {createLeadMutation.isPending ? "Enviando..." : "Solicitar Convite"}
                  </Button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Seus dados estão protegidos conforme nossa política de privacidade.
                </p>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h3>
                <p className="text-gray-600 mb-6">
                  Obrigado pelo interesse! Entraremos em contato em breve através do e-mail informado.
                </p>
                <Button
                  onClick={closeModal}
                  className="btn-primary px-8"
                >
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
