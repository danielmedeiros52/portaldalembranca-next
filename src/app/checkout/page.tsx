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
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const APP_TITLE = "Portal da Lembrança";

// Load Stripe outside of component to avoid recreating on every render
// Use process.env directly for client-side access to NEXT_PUBLIC_ variables
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
console.log("[Checkout] Stripe publishable key configured:", !!stripePublishableKey, stripePublishableKey?.substring(0, 7) + "...");
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

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
  const [cardholderName, setCardholderName] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [isCardReady, setIsCardReady] = useState(false);

  // Stripe hooks
  const stripe = useStripe();
  const elements = useElements();

  // Debug: Log when Stripe loads
  useEffect(() => {
    console.log("[Checkout] Stripe instance:", !!stripe, "Elements instance:", !!elements);
  }, [stripe, elements]);

  // tRPC mutations
  const createPaymentMutation = api.payment.createPaymentIntent.useMutation();
  const confirmPaymentMutation = api.payment.confirmPayment.useMutation();
  const createSubscriptionMutation = api.payment.createSubscription.useMutation();

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

    // Auto-select the only available plan (essencial)
    if (plans.length > 0 && !selectedPlanId && plans[0]) {
      setSelectedPlanId(plans[0].id);
    }
  }, [planFromUrl]);

  // Check if CardElement is ready when on payment step with card method
  useEffect(() => {
    if (step === "payment" && paymentMethod === "card" && stripe && elements) {
      // Small delay to ensure CardElement has mounted
      const timer = setTimeout(() => {
        const cardElement = elements.getElement(CardElement);
        setIsCardReady(!!cardElement);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsCardReady(false);
    }
  }, [step, paymentMethod, stripe, elements]);

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
      if (!stripe || !elements) {
        toast.error("Stripe não foi carregado. Recarregue a página.");
        return false;
      }

      if (!cardholderName || cardholderName.trim().length < 3) {
        toast.error("Nome do titular é obrigatório.");
        return false;
      }

      // Check if CardElement is available
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        toast.error("Formulário do cartão não está carregado. Por favor, aguarde um momento e tente novamente.");
        return false;
      }
    }

    return true;
  };

  const handleProcessPayment = async () => {
    console.log("[Checkout] ===== Starting payment process =====");
    console.log("[Checkout] Plan:", selectedPlanId, "Payment method:", paymentMethod);
    console.log("[Checkout] Customer email:", customerEmail, "Cardholder name:", cardholderName);
    console.log("[Checkout] Stripe available:", !!stripe, "Elements available:", !!elements);

    if (!selectedPlanId || !validatePaymentForm()) {
      console.error("[Checkout] Validation failed");
      return;
    }

    // Check if PIX is selected (not yet implemented)
    if (paymentMethod === "pix") {
      toast.error("Pagamento via PIX ainda não está disponível. Por favor, selecione pagamento com cartão.");
      return;
    }

    if (!stripe || !elements) {
      console.error("[Checkout] Stripe or Elements not loaded");
      toast.error("Stripe não foi carregado. Recarregue a página.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Get CardElement FIRST before any state changes that might unmount it
      const cardElement = elements.getElement(CardElement);
      console.log("[Checkout] CardElement obtained:", !!cardElement);

      if (!cardElement) {
        console.error("[Checkout] CardElement not found. Payment method:", paymentMethod, "Stripe:", !!stripe, "Elements:", !!elements);
        toast.error("Erro ao processar pagamento: formulário do cartão não está disponível. Por favor, recarregue a página e tente novamente.");
        setIsLoading(false);
        return;
      }

      // Step 2: Create payment intent with Stripe
      const toastId = toast.loading("Criando intenção de pagamento...");

      const paymentResult = await createPaymentMutation.mutateAsync({
        planId: selectedPlanId,
        customerEmail,
      });

      if (!paymentResult.id) {
        toast.error("Erro ao criar intenção de pagamento", { id: toastId });
        setIsLoading(false);
        return;
      }

      setPaymentIntentId(paymentResult.id);
      toast.success("Intenção de pagamento criada", { id: toastId });

      // Step 3: Create payment method using Stripe.js (client-side, secure)
      const validatingToast = toast.loading("Validando informações do cartão...");

      console.log("[Checkout] Creating payment method with Stripe.js...");

      let stripePaymentMethod;
      let pmError;

      try {
        // Add a timeout to catch if Stripe.js hangs
        const createPaymentMethodPromise = stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: cardholderName,
            email: customerEmail,
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout: Stripe demorou muito para responder")), 30000)
        );

        const result = await Promise.race([createPaymentMethodPromise, timeoutPromise]) as any;
        pmError = result.error;
        stripePaymentMethod = result.paymentMethod;

        console.log("[Checkout] Stripe.createPaymentMethod result:", {
          hasError: !!pmError,
          hasPaymentMethod: !!stripePaymentMethod,
          errorMessage: pmError?.message
        });
      } catch (error: any) {
        console.error("[Checkout] Exception during payment method creation:", error);
        toast.error(error.message || "Erro ao criar método de pagamento", { id: validatingToast });
        setIsLoading(false);
        return;
      }

      if (pmError) {
        console.error("[Checkout] Payment method creation error:", pmError);
        toast.error(pmError.message || "Erro ao validar cartão", { id: validatingToast });
        setIsLoading(false);
        return;
      }

      if (!stripePaymentMethod) {
        console.error("[Checkout] Payment method is null");
        toast.error("Falha ao criar método de pagamento", { id: validatingToast });
        setIsLoading(false);
        return;
      }

      console.log("[Checkout] Payment method created successfully:", stripePaymentMethod.id);
      toast.success("Cartão validado!", { id: validatingToast });

      // Now change step to processing since we have the payment method
      setStep("processing");

      // Step 4: Confirm payment with payment method ID (secure - no card data sent to backend)
      const processingToast = toast.loading("Processando pagamento...");

      console.log("[Checkout] Confirming payment with:", {
        paymentIntentId: paymentResult.id,
        paymentMethodId: stripePaymentMethod.id,
      });

      const confirmResult = await confirmPaymentMutation.mutateAsync({
        paymentIntentId: paymentResult.id,
        paymentMethodId: stripePaymentMethod.id,
      });

      console.log("[Checkout] Payment confirmation result:", confirmResult);

      if (confirmResult.status === "succeeded") {
        toast.success("Pagamento processado com sucesso!", { id: processingToast });

        // Step 5: Create subscription record after successful payment
        try {
          const subToast = toast.loading("Criando sua assinatura...");

          await createSubscriptionMutation.mutateAsync({
            planId: selectedPlanId,
            durationMonths: 12, // Annual subscription
            // Optional: stripeCustomerId and stripeSubscriptionId can be added if using Stripe subscriptions
          });

          toast.success("Assinatura criada com sucesso!", { id: subToast });
        } catch (subError: any) {
          console.error("[Checkout] Subscription creation error:", subError);
          // Don't fail the entire flow if subscription creation fails
          // The payment was successful, so we still show success
          toast.error("Aviso: Pagamento confirmado, mas houve erro ao criar assinatura. Entre em contato com o suporte.");
        }

        setStep("success");
      } else if (confirmResult.status === "requires_action") {
        // Payment requires additional action (e.g., 3D Secure)
        console.error("[Checkout] Payment requires action:", confirmResult.status);
        toast.error("Seu pagamento requer autenticação. Por favor, complete a verificação.", { id: processingToast });
        setStep("payment");
      } else {
        console.error("[Checkout] Payment status:", confirmResult.status);
        toast.error(`Pagamento pendente: ${confirmResult.status}`, { id: processingToast });
        setStep("payment");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Erro ao processar pagamento";
      console.error("[Checkout] Payment error:", error);
      toast.error(`Erro no pagamento: ${errorMessage}`);
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
            onClick={() => {
              if (step === "plan") {
                router.push("/");
              } else if (step === "payment" && planFromUrl) {
                // If came from landing page with plan in URL, go back to homepage
                router.push("/");
              } else {
                setStep("plan");
              }
            }}
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
                Memorial Essencial
              </h1>
              <p className="text-lg text-gray-600">
                Plano completo por apenas R$ 19,90/ano
              </p>
            </div>

            <div className="flex justify-center mb-8">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className="relative transition-all ring-2 ring-teal-600 shadow-lg max-w-md w-full"
                >
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
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-center text-gray-500 pt-4 border-t">
                      Pagamento seguro via PIX ou cartão de crédito
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={handleContinueToPayment}
                className="btn-primary px-8 py-3 text-lg"
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
                          onClick={() => toast.info("Pagamento via PIX estará disponível em breve!")}
                          disabled
                          className="p-4 border-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed relative"
                        >
                          <div className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-gray-400">PIX</span>
                          </div>
                          <span className="text-xs text-gray-500">Em breve</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Form with Stripe Elements */}
                    {paymentMethod === "card" && (
                      <div className="space-y-4 pt-4 border-t">
                        {(!stripe || !isCardReady) && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-yellow-800 flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {!stripe ? "Carregando Stripe..." : "Carregando formulário do cartão..."}
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Titular
                          </label>
                          <input
                            type="text"
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            placeholder="Como está no cartão"
                            className="input-modern w-full"
                            disabled={!stripe}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Informações do Cartão
                          </label>
                          <div className="border rounded-lg p-3 bg-white">
                            {stripe ? (
                              <CardElement
                                options={{
                                  style: {
                                    base: {
                                      fontSize: "16px",
                                      color: "#374151",
                                      "::placeholder": {
                                        color: "#9CA3AF",
                                      },
                                      fontFamily: "ui-sans-serif, system-ui, sans-serif",
                                    },
                                    invalid: {
                                      color: "#EF4444",
                                    },
                                  },
                                }}
                              />
                            ) : (
                              <div className="py-3 text-center text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Stripe Elements fornece validação em tempo real
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Seu cartão é seguro com Stripe. Seus dados não passam pelo nosso servidor.
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
                      disabled={isLoading || (paymentMethod === "card" && (!stripe || !isCardReady))}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (paymentMethod === "card" && (!stripe || !isCardReady)) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Carregando formulário...
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
  // Show error if Stripe is not configured
  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Stripe não configurado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              A chave pública do Stripe não está configurada. Configure a variável de ambiente{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
              para habilitar pagamentos.
            </p>
            <Button onClick={() => window.location.href = "/"} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    }>
      <Elements stripe={stripePromise}>
        <CheckoutContent />
      </Elements>
    </Suspense>
  );
}
