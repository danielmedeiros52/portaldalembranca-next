"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft, CreditCard, QrCode, Check, Loader2, Shield, Lock,
  Sparkles, Heart, Image, Users, Star
} from "lucide-react";
import { api } from "~/trpc/react";

const APP_TITLE = "Portal da Lembrança";

type PaymentMethod = "card" | "pix";
type CheckoutStep = "plan" | "payment" | "processing" | "success";

const plans = [
  {
    id: "essencial",
    name: "Memorial Essencial",
    price: 19.90,
    period: "ano",
    features: [
      "1 Memorial Digital",
      "Galeria de até 10 fotos",
      "QR Code personalizado",
      "Compartilhamento ilimitado",
      "Dedicações públicas"
    ],
    popular: false
  },
  {
    id: "premium",
    name: "Memorial Premium",
    price: 99.90,
    period: "ano",
    features: [
      "1 Memorial Digital",
      "Galeria ilimitada de fotos",
      "QR Code personalizado",
      "Linha do tempo interativa",
      "Vídeos e áudios",
      "Mapa de localização",
      "Dedicações públicas",
      "Suporte prioritário"
    ],
    popular: true
  },
  {
    id: "familia",
    name: "Plano Família",
    price: 249.90,
    period: "ano",
    features: [
      "Até 5 Memoriais",
      "Tudo do plano Premium",
      "Árvore genealógica",
      "Documentos históricos",
      "Acesso compartilhado",
      "Backup em nuvem",
      "Suporte dedicado"
    ],
    popular: false
  }
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<CheckoutStep>("plan");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [customerEmail, setCustomerEmail] = useState("");
  const [cardData, setCardData] = useState({
    number: "",
    expMonth: "",
    expYear: "",
    cvc: "",
    name: "",
  });

  const planFromUrl = searchParams.get("plan");
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const createPaymentMutation = api.payment.createPaymentIntent.useMutation();

  useEffect(() => {
    if (planFromUrl) {
      const urlPlan = plans.find(p => p.id === planFromUrl);
      if (urlPlan) {
        setSelectedPlanId(urlPlan.id);
        setStep("payment");
        return;
      }
    }

    // Pre-select popular plan
    const popularPlan = plans.find(p => p.popular);
    if (popularPlan) {
      setSelectedPlanId(popularPlan.id);
    }
  }, [planFromUrl]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleContinueToPayment = () => {
    if (!selectedPlanId) {
      toast.error("Por favor, selecione um plano.");
      return;
    }
    setStep("payment");
  };

  const handleProcessPayment = async () => {
    if (!selectedPlanId) {
      toast.error("Plano não selecionado");
      return;
    }

    if (!customerEmail) {
      toast.error("Por favor, insira seu email");
      return;
    }

    if (paymentMethod === "card") {
      if (!cardData.number || !cardData.expMonth || !cardData.expYear || !cardData.cvc || !cardData.name) {
        toast.error("Por favor, preencha todos os dados do cartão");
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await createPaymentMutation.mutateAsync({
        planId: selectedPlanId,
        customerEmail,
      });

      // Simulate payment success after creating intent
      setStep("processing");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Pagamento processado com sucesso!");
      setStep("success");
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
      setIsLoading(false);
    }
  };

  if (step === "processing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processando pagamento...</h2>
          <p className="text-gray-500">Aguarde enquanto confirmamos seu pagamento.</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pagamento Confirmado!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Seu memorial está pronto para ser criado. Um email de confirmação foi enviado para <strong>{customerEmail}</strong>.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="btn-primary w-full"
              >
                Ir para Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full"
              >
                Voltar para Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === "payment") {
                setStep("plan");
              } else {
                router.back();
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-600" />
            <span className="font-bold text-gray-900">{APP_TITLE}</span>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Plan Selection */}
        {step === "plan" && (
          <div>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Escolha seu plano
              </h1>
              <p className="text-lg text-gray-600">
                Selecione o plano ideal para preservar suas memórias
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {plans.map(plan => (
                <Card
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedPlanId === plan.id
                      ? "border-teal-600 shadow-lg scale-105"
                      : "border-gray-200 hover:border-teal-200"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span>{plan.name}</span>
                      {plan.popular && (
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-semibold">
                          Popular
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-teal-600">
                        R$ {plan.price.toFixed(2)}
                      </span>
                      <span className="text-gray-500">/{plan.period}</span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={handleContinueToPayment}
                className="btn-primary px-8 py-3 text-lg"
                disabled={!selectedPlanId}
              >
                Continuar para Pagamento
              </Button>
            </div>
          </div>
        )}

        {/* Payment */}
        {step === "payment" && selectedPlan && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Pagamento</h1>
              <p className="text-gray-600">
                Plano: <strong>{selectedPlan.name}</strong> - R$ {selectedPlan.price.toFixed(2)}/{selectedPlan.period}
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados do Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="input-modern w-full"
                      />
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Método de Pagamento
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setPaymentMethod("card")}
                          className={`p-4 border-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                            paymentMethod === "card"
                              ? "border-teal-600 bg-teal-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <CreditCard className="w-5 h-5" />
                          <span className="font-medium">Cartão</span>
                        </button>
                        <button
                          onClick={() => setPaymentMethod("pix")}
                          className={`p-4 border-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                            paymentMethod === "pix"
                              ? "border-teal-600 bg-teal-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <QrCode className="w-5 h-5" />
                          <span className="font-medium">PIX</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Form */}
                    {paymentMethod === "card" && (
                      <div className="pt-4 space-y-4 border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número do Cartão
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="0000 0000 0000 0000"
                              maxLength={19}
                              value={cardData.number}
                              onChange={(e) => setCardData({...cardData, number: e.target.value.replace(/\s/g, '')})}
                              className="input-modern pl-10 w-full"
                            />
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Mês
                            </label>
                            <input
                              type="text"
                              placeholder="MM"
                              maxLength={2}
                              value={cardData.expMonth}
                              onChange={(e) => setCardData({...cardData, expMonth: e.target.value})}
                              className="input-modern"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Ano
                            </label>
                            <input
                              type="text"
                              placeholder="AA"
                              maxLength={2}
                              value={cardData.expYear}
                              onChange={(e) => setCardData({...cardData, expYear: e.target.value})}
                              className="input-modern"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              placeholder="123"
                              maxLength={4}
                              value={cardData.cvc}
                              onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                              className="input-modern"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Titular
                          </label>
                          <input
                            type="text"
                            placeholder="Como está no cartão"
                            value={cardData.name}
                            onChange={(e) => setCardData({...cardData, name: e.target.value})}
                            className="input-modern w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* PIX Info */}
                    {paymentMethod === "pix" && (
                      <div className="pt-4 text-center border-t">
                        <div className="bg-gray-100 rounded-xl p-8 mb-4">
                          <QrCode className="w-32 h-32 mx-auto text-gray-400 mb-4" />
                          <p className="text-sm text-gray-600">
                            O QR Code PIX será gerado após confirmar
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleProcessPayment}
                      className="w-full btn-primary"
                      disabled={isLoading || createPaymentMutation.isPending}
                    >
                      {isLoading || createPaymentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Confirmar Pagamento
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <Shield className="w-4 h-4" />
                      <span>Pagamento 100% seguro e criptografado</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-900">{selectedPlan.name}</p>
                      <p className="text-sm text-gray-500">Renovação anual</p>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span>R$ {selectedPlan.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-teal-600">R$ {selectedPlan.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-4">
                      <p className="text-sm text-teal-800 font-medium mb-2">
                        ✓ Inclui neste plano:
                      </p>
                      <ul className="text-xs text-teal-700 space-y-1">
                        {selectedPlan.features.slice(0, 3).map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
