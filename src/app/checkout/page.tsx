"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import {
  ArrowLeft, CreditCard, QrCode, Check, Loader2, Shield, Lock,
  Sparkles, Heart, Image, Users, Star, Copy, CheckCircle2, XCircle
} from "lucide-react";

const APP_TITLE = "Portal da Lembrança";

// Declare Mercado Pago types for TypeScript
declare global {
  interface Window {
    MercadoPago: any;
  }
}

type PaymentMethod = "card" | "pix";
type CheckoutStep = "plan" | "payment" | "processing" | "success";

const plans = [
  {
    id: "essencial",
    name: "Memorial Essencial",
    price: 19.90,
    period: "ano",
    features: [
      "Página memorial personalizada",
      "Galeria com até 10 fotos",
      "Biografia e história completa",
      "QR Code para acesso digital",
      "Compartilhamento ilimitado",
      "Dedicações e homenagens"
    ],
    popular: true
  },
  {
    id: "premium",
    name: "Memorial Premium",
    price: 99.90,
    period: "ano",
    features: [
      "Tudo do plano Essencial",
      "Galeria ilimitada de fotos",
      "Vídeos e áudios",
      "Linha do tempo interativa",
      "Customização avançada",
      "Suporte prioritário"
    ],
    popular: false
  },
  {
    id: "familia",
    name: "Plano Família",
    price: 249.90,
    period: "ano",
    features: [
      "Tudo do plano Premium",
      "Até 5 memoriais",
      "Gestão compartilhada",
      "Árvore genealógica",
      "Backup em nuvem",
      "Consultoria personalizada"
    ],
    popular: false
  }
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [step, setStep] = useState<CheckoutStep>("plan");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  // Form data
  const [customerEmail, setCustomerEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");

  // Mercado Pago state
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [cardFormReady, setCardFormReady] = useState(false);
  const cardFormRef = useRef<any>(null);

  // PIX payment state
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState<string | null>(null);
  const [pixExpirationDate, setPixExpirationDate] = useState<string | null>(null);

  // Payment status
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // tRPC mutations and queries
  const createCardPayment = api.payment.createCardPayment.useMutation();
  const createPixPayment = api.payment.createPixPayment.useMutation();
  const addCreditsFromPayment = api.payment.addCreditsFromPayment.useMutation();

  // Poll for PIX payment status (only when we have a payment ID)
  const { data: paymentStatusData, refetch: refetchPaymentStatus } = api.payment.getPaymentStatus.useQuery(
    { paymentId: pixPaymentId! },
    {
      enabled: !!pixPaymentId && paymentMethod === "pix" && step === "processing",
      refetchInterval: 3000, // Poll every 3 seconds
    }
  );

  const planFromUrl = searchParams.get("plan");
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Handle plan selection from URL
  useEffect(() => {
    if (planFromUrl) {
      const urlPlan = plans.find(p => p.id === planFromUrl);
      if (urlPlan) {
        setSelectedPlanId(urlPlan.id);
        setStep("payment");
        return;
      }
    }

    // Auto-select the essencial plan if none selected
    if (plans.length > 0 && !selectedPlanId && plans[0]) {
      setSelectedPlanId(plans[0].id);
    }
  }, [planFromUrl]);

  // Load Mercado Pago SDK
  useEffect(() => {
    console.log("[Checkout] Loading Mercado Pago SDK...");

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;

    script.onload = () => {
      console.log("[Checkout] Mercado Pago SDK loaded");

      // Get public key from environment
      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

      if (!publicKey) {
        console.error("[Checkout] Mercado Pago public key not found");
        toast.error("Erro ao carregar sistema de pagamento. Chave pública não configurada.");
        return;
      }

      try {
        const mp = new window.MercadoPago(publicKey, {
          locale: 'pt-BR'
        });
        setMpInstance(mp);
        console.log("[Checkout] Mercado Pago initialized successfully");
      } catch (error) {
        console.error("[Checkout] Error initializing Mercado Pago:", error);
        toast.error("Erro ao inicializar Mercado Pago");
      }
    };

    script.onerror = () => {
      console.error("[Checkout] Failed to load Mercado Pago SDK");
      toast.error("Erro ao carregar Mercado Pago. Por favor, recarregue a página.");
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Initialize CardForm when MP is ready and card payment is selected
  useEffect(() => {
    if (!mpInstance || paymentMethod !== "card" || step !== "payment") {
      return;
    }

    // Wait for form elements to be in DOM
    const initCardForm = () => {
      const formElement = document.getElementById("form-checkout");
      if (!formElement) {
        console.log("[Checkout] Form element not found, retrying...");
        setTimeout(initCardForm, 100);
        return;
      }

      try {
        console.log("[Checkout] Initializing CardForm...");

        const cardForm = mpInstance.cardForm({
          amount: String(selectedPlan?.price || 19.90),
          iframe: true,
          form: {
            id: "form-checkout",
            cardNumber: {
              id: "form-checkout__cardNumber",
              placeholder: "Número do cartão",
            },
            expirationDate: {
              id: "form-checkout__expirationDate",
              placeholder: "MM/AA",
            },
            securityCode: {
              id: "form-checkout__securityCode",
              placeholder: "CVV",
            },
            cardholderName: {
              id: "form-checkout__cardholderName",
              placeholder: "Nome impresso no cartão",
            },
            issuer: {
              id: "form-checkout__issuer",
              placeholder: "Banco emissor",
            },
            installments: {
              id: "form-checkout__installments",
              placeholder: "Parcelas",
            },
            identificationType: {
              id: "form-checkout__identificationType",
            },
            identificationNumber: {
              id: "form-checkout__identificationNumber",
              placeholder: "CPF",
            },
            cardholderEmail: {
              id: "form-checkout__cardholderEmail",
              placeholder: "E-mail",
            },
          },
          callbacks: {
            onFormMounted: (error: any) => {
              if (error) {
                console.error("[Checkout] CardForm mount error:", error);
                toast.error("Erro ao carregar formulário de cartão");
                return;
              }
              console.log("[Checkout] CardForm mounted successfully");
              setCardFormReady(true);
            },
            onSubmit: async (event: Event) => {
              event.preventDefault();
              await handleCardPayment(cardForm);
            },
          },
        });

        cardFormRef.current = cardForm;
      } catch (error) {
        console.error("[Checkout] Error initializing CardForm:", error);
        toast.error("Erro ao inicializar formulário de pagamento");
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(initCardForm, 100);

    return () => {
      if (cardFormRef.current) {
        cardFormRef.current = null;
      }
      setCardFormReady(false);
    };
  }, [mpInstance, paymentMethod, step, selectedPlan]);

  // Monitor PIX payment status
  useEffect(() => {
    if (!paymentStatusData || !pixPaymentId) return;

    console.log("[Checkout] PIX payment status update:", paymentStatusData.status);

    if (paymentStatusData.status === "approved" || paymentStatusData.status === "authorized") {
      // Payment approved!
      console.log("[Checkout] PIX payment approved!");
      handleCreditsAddition(pixPaymentId).then(() => {
        setPaymentStatus("success");
        setStep("success");
        toast.success("Pagamento PIX confirmado!");
      });
    } else if (paymentStatusData.status === "rejected" || paymentStatusData.status === "cancelled") {
      console.error("[Checkout] PIX payment rejected/cancelled");
      setPaymentStatus("error");
      setErrorMessage("Pagamento PIX foi rejeitado ou cancelado");
      toast.error("Pagamento PIX foi rejeitado ou cancelado");
      setIsLoading(false);
    }
  }, [paymentStatusData, pixPaymentId]);

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

  const handleCardPayment = async (cardForm: any) => {
    try {
      setIsLoading(true);
      setPaymentStatus("processing");
      setStep("processing");

      console.log("[Checkout] Processing card payment...");

      // Get card form data
      const cardFormData = cardForm.getCardFormData();

      if (!cardFormData.token) {
        throw new Error("Token de cartão não foi gerado");
      }

      console.log("[Checkout] Card token generated, creating payment...");

      // Create payment with Mercado Pago
      const result = await createCardPayment.mutateAsync({
        planId: selectedPlanId!,
        cardToken: cardFormData.token,
        customerEmail: cardFormData.cardholderEmail || customerEmail,
        paymentMethodId: cardFormData.paymentMethodId,
        installments: parseInt(cardFormData.installments) || 1,
      });

      console.log("[Checkout] Payment result:", result);

      // Check payment status
      if (result.status === "approved" || result.status === "authorized") {
        console.log("[Checkout] Payment approved!");

        // Create subscription
        await handleCreditsAddition(result.id);

        setPaymentStatus("success");
        setStep("success");
        toast.success("Pagamento aprovado com sucesso!");

        // Redirect to dashboard after delay
        setTimeout(() => {
          router.push("/dashboard?payment=success");
        }, 3000);
      } else if (result.status === "pending" || result.status === "in_process") {
        setPaymentStatus("processing");
        toast.info("Pagamento em análise. Você receberá uma notificação quando for aprovado.");

        setTimeout(() => {
          router.push("/dashboard?payment=pending");
        }, 3000);
      } else {
        throw new Error(`Pagamento não autorizado: ${result.statusDetail || result.status}`);
      }
    } catch (error: any) {
      console.error("[Checkout] Card payment error:", error);
      setPaymentStatus("error");
      setErrorMessage(error.message || "Erro ao processar pagamento com cartão");
      toast.error(error.message || "Erro ao processar pagamento com cartão");
      setStep("payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePixPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!customerEmail || !firstName || !lastName || !cpf) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Validate email
    if (!customerEmail.includes("@")) {
      toast.error("E-mail inválido");
      return;
    }

    // Validate CPF format (11 digits)
    const cpfClean = cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return;
    }

    try {
      setIsLoading(true);
      setPaymentStatus("processing");
      setStep("processing");

      console.log("[Checkout] Creating PIX payment...");

      const result = await createPixPayment.mutateAsync({
        planId: selectedPlanId!,
        customerEmail,
        firstName,
        lastName,
        cpf: cpfClean,
      });

      console.log("[Checkout] PIX payment created:", result);

      // Store PIX data
      setPixPaymentId(result.id);
      setPixQrCode(result.pixQrCode ?? null);
      setPixQrCodeBase64(result.pixQrCodeBase64 ?? null);
      setPixExpirationDate(result.pixExpirationDate ?? null);

      toast.success("Código PIX gerado! Escaneie o QR Code para pagar.");
    } catch (error: any) {
      console.error("[Checkout] PIX payment error:", error);
      setPaymentStatus("error");
      setErrorMessage(error.message || "Erro ao gerar código PIX");
      toast.error(error.message || "Erro ao gerar código PIX");
      setIsLoading(false);
      setStep("payment");
    }
  };

  const handleCreditsAddition = async (paymentId: string) => {
    try {
      console.log("[Checkout] Adding credits for payment:", paymentId);

      const result = await addCreditsFromPayment.mutateAsync({
        planId: selectedPlanId!,
        paymentId: paymentId,
      });

      console.log("[Checkout] Credits added successfully:", result);
      toast.success(`${result.creditsAdded} crédito(s) adicionado(s) à sua conta!`);
    } catch (error: any) {
      console.error("[Checkout] Credits addition error:", error);
      // Don't fail the flow - payment was successful
      toast.warning("Pagamento confirmado. Créditos serão adicionados em breve.");
    }
  };

  const handleCopyPixCode = () => {
    if (pixQrCode) {
      navigator.clipboard.writeText(pixQrCode);
      toast.success("Código PIX copiado!");
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Render plan selection step
  const renderPlanSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Escolha seu plano
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Crie memoriais digitais eternos para seus entes queridos
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              selectedPlanId === plan.id
                ? "ring-2 ring-primary shadow-xl"
                : "hover:ring-1 hover:ring-gray-300"
            } ${plan.popular ? "border-primary" : ""}`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  POPULAR
                </span>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">
                  R$ {plan.price.toFixed(2)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlanId === plan.id && (
                <div className="mt-4 flex items-center justify-center gap-2 text-primary font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Selecionado
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleContinueToPayment}
          disabled={!selectedPlanId}
          className="min-w-[200px]"
        >
          Continuar para pagamento
        </Button>
      </div>
    </div>
  );

  // Render payment step
  const renderPaymentStep = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Pagamento</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedPlan?.name} - R$ {selectedPlan?.price.toFixed(2)}/{selectedPlan?.period}
          </p>
        </div>
      </div>

      {/* Payment method tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Escolha a forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                paymentMethod === "card"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CreditCard className={`w-8 h-8 ${paymentMethod === "card" ? "text-primary" : "text-gray-500"}`} />
              <span className="font-medium">Cartão de Crédito</span>
            </button>

            <button
              onClick={() => setPaymentMethod("pix")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                paymentMethod === "pix"
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <QrCode className={`w-8 h-8 ${paymentMethod === "pix" ? "text-primary" : "text-gray-500"}`} />
              <span className="font-medium">PIX</span>
            </button>
          </div>

          {/* Card payment form */}
          {paymentMethod === "card" && (
            <div>
              {!mpInstance ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Carregando Mercado Pago...</span>
                </div>
              ) : (
                <form id="form-checkout" className="space-y-4">
                  <div>
                    <Label htmlFor="form-checkout__cardholderEmail">E-mail *</Label>
                    <input
                      type="email"
                      id="form-checkout__cardholderEmail"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <Label>Número do Cartão *</Label>
                    <div id="form-checkout__cardNumber" className="border border-gray-300 rounded-md p-1 h-[38px]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data de Validade *</Label>
                      <div id="form-checkout__expirationDate" className="border border-gray-300 rounded-md p-1 h-[38px]" />
                    </div>
                    <div>
                      <Label>Código de Segurança *</Label>
                      <div id="form-checkout__securityCode" className="border border-gray-300 rounded-md p-1 h-[38px]" />
                    </div>
                  </div>

                  <div>
                    <Label>Nome do Titular *</Label>
                    <input
                      type="text"
                      id="form-checkout__cardholderName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nome como está no cartão"
                      required
                    />
                  </div>

                  <div>
                    <Label>CPF *</Label>
                    <input
                      type="text"
                      id="form-checkout__identificationNumber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>

                  <select id="form-checkout__identificationType" className="hidden">
                    <option value="CPF">CPF</option>
                  </select>

                  <div>
                    <Label>Banco Emissor *</Label>
                    <select
                      id="form-checkout__issuer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <Label>Parcelas *</Label>
                    <select
                      id="form-checkout__installments"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="w-4 h-4" />
                    <span>Pagamento 100% seguro via Mercado Pago</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!cardFormReady || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Pagar R$ {selectedPlan?.price.toFixed(2)}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* PIX payment form */}
          {paymentMethod === "pix" && (
            <form onSubmit={handlePixPayment} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="João"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Silva"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formatCPF(cpf)}
                  onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Pagamento instantâneo e seguro</span>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar PIX - R$ {selectedPlan?.price.toFixed(2)}
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          {paymentMethod === "pix" && pixQrCodeBase64 ? (
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-bold">Escaneie o QR Code para pagar</h3>

              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${pixQrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Ou copie o código PIX:</Label>
                <div className="flex gap-2">
                  <Input
                    value={pixQrCode || ""}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyPixCode}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {pixExpirationDate && (
                <p className="text-sm text-gray-600">
                  Expira em: {new Date(pixExpirationDate).toLocaleString('pt-BR')}
                </p>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">Aguardando pagamento...</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  O pagamento será confirmado automaticamente após a aprovação.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setStep("payment");
                  setPixPaymentId(null);
                  setPixQrCode(null);
                  setPixQrCodeBase64(null);
                  setIsLoading(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-12">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Processando pagamento...</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Por favor, aguarde enquanto processamos seu pagamento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                Pagamento confirmado!
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Sua assinatura foi ativada com sucesso.
              </p>
            </div>

            <div className="bg-primary/10 rounded-lg p-6 space-y-2">
              <p className="font-semibold text-primary">
                {selectedPlan?.name}
              </p>
              <p className="text-2xl font-bold">
                R$ {selectedPlan?.price.toFixed(2)}/{selectedPlan?.period}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Válido por 1 ano
              </p>
            </div>

            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push("/dashboard")}
              >
                <Heart className="mr-2 h-5 w-5" />
                Ir para o Dashboard
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/memorial/create")}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Criar Primeiro Memorial
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto">
        {step === "plan" && renderPlanSelection()}
        {step === "payment" && renderPaymentStep()}
        {step === "processing" && renderProcessingStep()}
        {step === "success" && renderSuccessStep()}

        {/* Error display */}
        {paymentStatus === "error" && errorMessage && step !== "success" && (
          <div className="max-w-2xl mx-auto mt-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100">
                    Erro no pagamento
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
