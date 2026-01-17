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
              className="hidden sm:inline-flex text-gray-600 hover:text-teal-700"
              onClick={() => router.push("/memorials")}
            >
              Ver Demo
            </Button>
            <Button
              onClick={() => router.push("/login")}
              className="btn-primary text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3"
            >
              Entrar
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
                Versão piloto em Pernambuco
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6">
                Preserve memórias com{" "}
                <span className="text-gradient">tecnologia</span> e sensibilidade
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8">
                Crie memoriais digitais para preservar as histórias de quem você ama. Uma solução sensível e duradoura, desenvolvida em Pernambuco para as famílias e funerárias locais.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => router.push("/login")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Criar Memorial
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => router.push("/memorials")}
                  variant="outline"
                  className="btn-outline"
                >
                  Ver Exemplo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">15 min</p>
                  <p className="text-xs sm:text-sm text-gray-500">Tempo médio para ativar um memorial</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">4 parceiros</p>
                  <p className="text-xs sm:text-sm text-gray-500">Funerárias e cemitérios em Recife/RMR</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">Placa + QR</p>
                  <p className="text-xs sm:text-sm text-gray-500">Entrega pronta para ser fixada no túmulo</p>
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

      {/* Pricing Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Nossos Planos</h2>
            <div className="section-divider mb-6"></div>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para preservar as memórias de quem você ama
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Plan 1 - Essencial */}
            <div className="card-modern p-6 fade-in stagger-1">
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
                  Até 10 fotos
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Biografia completa
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  QR Code digital
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Compartilhamento ilimitado
                </li>
              </ul>
              <Button
                onClick={() => router.push("/login?plan=essencial")}
                variant="outline"
                className="w-full btn-outline"
              >
                Criar Memorial
              </Button>
            </div>

            {/* Plan 2 - Premium (Popular) */}
            <div className="card-modern p-6 fade-in stagger-2 relative border-2 border-teal-600 sm:-mt-4 sm:mb-4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                Mais Popular
              </div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Memorial Premium</h3>
                <p className="text-sm text-gray-500 mb-4">Recursos completos com placa física para homenagens especiais</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">R$ 99,90</span>
                  <span className="text-gray-500 text-sm">/ano</span>
                </div>
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  A partir do 2º ano: R$ 29,90/ano
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Tudo do plano Essencial
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Fotos ilimitadas
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Galeria de vídeos
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Árvore genealógica
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <strong>Placa física com QR Code</strong>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Suporte prioritário
                </li>
              </ul>
              <Button
                onClick={() => router.push("/login?plan=premium")}
                className="w-full btn-primary"
              >
                Escolher Premium
              </Button>
            </div>

            {/* Plan 3 - Família */}
            <div className="card-modern p-6 fade-in stagger-3">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-rose-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Plano Família</h3>
                <p className="text-sm text-gray-500 mb-4">Para famílias que desejam preservar múltiplas memórias</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">R$ 249,90</span>
                  <span className="text-gray-500 text-sm">/ano</span>
                </div>
                <p className="text-xs text-emerald-600 mt-2 font-medium">
                  A partir do 2º ano: R$ 59,90/ano
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Até 5 memoriais completos
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Árvore genealógica conectada
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Backup em nuvem
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Domínio personalizado
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <strong>5 placas físicas com QR Code</strong>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  Suporte VIP 24/7
                </li>
              </ul>
              <Button
                onClick={() => router.push("/login?plan=familia")}
                variant="outline"
                className="w-full btn-outline"
              >
                Escolher Família
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 gradient-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16 fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Como Funciona</h2>
            <div className="section-divider mb-6"></div>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Uma solução completa para funerárias e famílias criarem memoriais digitais significativos
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Feature 1 */}
            <div className="card-modern p-5 sm:p-8 fade-in stagger-1">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-6">
                <QrCode className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Para Funerárias</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                  </div>
                  Ative um memorial junto com o contrato do funeral
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                  </div>
                  Gere código QR e acompanhe a produção da placa
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-teal-600"></div>
                  </div>
                  Painel com comissões e status dos memoriais
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="card-modern p-5 sm:p-8 fade-in stagger-2">
              <div className="w-14 h-14 rounded-2xl gradient-secondary flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Para Famílias</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-rose-600"></div>
                  </div>
                  Preencha biografia, fotos e homenagens com segurança
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-rose-600"></div>
                  </div>
                  Registre descendentes e mantenha a árvore da família
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-rose-600"></div>
                  </div>
                  Compartilhe o link ou QR para toda a rede de afetos
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">Depoimentos</h2>
            <div className="section-divider"></div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Testimonial 1 */}
            <div className="card-modern p-6 fade-in stagger-1">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Conseguimos organizar fotos, biografia e descendentes da minha avó em poucas horas. A placa com QR Code já está no túmulo e a família inteira consegue acessar sem complicação."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face"
                  alt="Ana Paula"
                  className="w-12 h-12 avatar"
                />
                <div>
                  <p className="font-medium text-gray-900">Ana Paula Silva</p>
                  <p className="text-sm text-gray-500">Família</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="card-modern p-6 fade-in stagger-2">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "Apresentamos o memorial durante a contratação e a família costuma aceitar na hora. O painel com status e comissões ajuda nossa equipe a acompanhar cada caso."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face"
                  alt="Roberto"
                  className="w-12 h-12 avatar"
                />
                <div>
                  <p className="font-medium text-gray-900">Roberto Mendes</p>
                  <p className="text-sm text-gray-500">Funerária Paz Eterna</p>
                </div>
              </div>
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
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Conheça o Portal da Lembrança</h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Conecte sua funerária ou família ao Portal da Lembrança em Pernambuco e valide a experiência com QR Codes, placas físicas e suporte dedicado.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-white text-teal-700 font-semibold px-4 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg text-sm sm:text-base"
                >
                  Solicite um convite
                </Button>
                <Button
                  onClick={() => router.push("/memorial/maria-silva-santos")}
                  variant="outline"
                  className="border-2 border-white text-white font-semibold px-4 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-white/10 transition-all duration-300 text-sm sm:text-base"
                >
                  Ver Demonstração
                </Button>
              </div>
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
              <a href="#" className="hover:text-white transition-colors">Sobre</a>
              <a href="#" className="hover:text-white transition-colors">Contato</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos</a>
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
