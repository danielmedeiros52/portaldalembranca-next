"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import {
  ArrowLeft, CreditCard, QrCode, Check, Loader2, Shield, Lock,
  Sparkles, Heart, Image, Users, Star
} from "lucide-react";

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
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");

  // tRPC mutations
  const createPaymentMutation = api.payment.createPaymentIntent.useMutation();
  const confirmPaymentMutation = api.payment.confirmPayment.useMutation();

  const planFromUrl = searchParams.get("plan");
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

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

  const validatePaymentForm = (): boolean => {
    if (!customerEmail || !customerEmail.includes("@")) {
      toast.error("Email válido é obrigatório.");
      return false;
    }

    if (paymentMethod === "card") {
      if (!cardNumber || cardNumber.replace(/\s/g, "").length < 13) {
        toast.error("Número do cartão inválido.");
        return false;
      }
      if (!cardExp || cardExp.length < 5) {
        toast.error("Data de validade inválida (MM/AA).");
        return false;
      }
      if (!cardCvc || cardCvc.length < 3) {
        toast.error("CVV inválido.");
        return false;
      }
      if (!cardName || cardName.trim().length < 3) {
        toast.error("Nome do titular é obrigatório.");
        return false;
      }
    }

    return true;
  };

  const handleProcessPayment = async () => {
    if (!selectedPlanId || !validatePaymentForm()) {
      return;
    }

    setIsLoading(true);
    setStep("processing");

    try {
      // Step 1: Create payment intent with Stripe
      const toastId = toast.loading("Criando intenção de pagamento...");

      const paymentResult = await createPaymentMutation.mutateAsync({
        planId: selectedPlanId,
        customerEmail,
      });

      if (!paymentResult.id) {
        toast.error("Erro ao criar intenção de pagamento", { id: toastId });
        setStep("payment");
        setIsLoading(false);
        return;
      }

      setPaymentIntentId(paymentResult.id);
      toast.success("Intenção de pagamento criada", { id: toastId });

      // Step 2: Confirm payment with card details
      toast.loading("Processando pagamento com seu cartão...");

      // Confirm the payment with card details
      const confirmResult = await confirmPaymentMutation.mutateAsync({
        paymentIntentId: paymentResult.id,
        cardNumber,
        cardExp,
        cardCvc,
        cardName,
      });

      if (confirmResult.status === "succeeded") {
        toast.success("Pagamento processado com sucesso!");
        setStep("success");
      } else if (confirmResult.status === "requires_action") {
        // Payment requires additional action (e.g., 3D Secure)
        toast.error("Seu pagamento requer autenticação. Por favor, complete a verificação.");
        setStep("payment");
      } else {
        toast.error(`Pagamento pendente: ${confirmResult.status}`);
        setStep("payment");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Erro ao processar pagamento";
      console.error("Payment error:", error);
      toast.error(errorMessage);
      setStep("payment");
    } finally {
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
              Seu memorial está pronto para ser criado.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto btn-primary"
              >
                Ir para o Dashboard
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => step === "plan" ? router.push("/") : setStep("plan")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
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
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all ${
                    selectedPlanId === plan.id
                      ? "ring-2 ring-teal-600 shadow-lg"
                      : "hover:shadow-lg"
                  } ${plan.popular ? "border-teal-600" : ""}`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-teal-600 text-white text-sm font-medium rounded-full">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-center">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      </div>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-teal-600">
                          R$ {plan.price.toFixed(2)}
                        </span>
                        <span className="text-gray-500">/{plan.period}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                    <CardTitle>Detalhes do Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="seu@email.com"
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
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número do Cartão
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="0000 0000 0000 0000"
                              maxLength={19}
                              className="input-modern pl-10 w-full"
                            />
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Validade (MM/AA)
                            </label>
                            <input
                              type="text"
                              value={cardExp}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length >= 2) {
                                  val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                }
                                setCardExp(val);
                              }}
                              placeholder="MM/AA"
                              maxLength={5}
                              className="input-modern"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                              placeholder="123"
                              maxLength={4}
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
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Como está no cartão"
                            className="input-modern w-full"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Seu cartão é seguro com Stripe
                        </p>
                      </div>
                    )}

                    {/* PIX Info */}
                    {paymentMethod === "pix" && (
                      <div className="pt-4 border-t text-center">
                        <div className="bg-gray-100 rounded-xl p-8 mb-4">
                          <QrCode className="w-32 h-32 mx-auto text-gray-400 mb-4" />
                          <p className="text-sm text-gray-600">
                            O QR Code PIX será gerado após confirmar o pagamento
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleProcessPayment}
                      className="w-full btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
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
