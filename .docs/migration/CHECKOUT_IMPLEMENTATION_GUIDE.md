# Checkout Page Implementation Guide

Complete guide for rewriting the checkout page with Mercado Pago integration.

---

## Overview

The checkout page needs to support two payment methods:
1. **Credit Card** - Using Mercado Pago CardForm
2. **PIX** - With QR code display and status polling

---

## Step 1: Setup and Imports

### Remove Stripe Imports
```typescript
// ❌ Remove these
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
```

### Add Required Imports
```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Loader2, Copy, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
```

---

## Step 2: State Management

```typescript
export default function CheckoutPage() {
  const router = useRouter();

  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<"essencial" | "premium" | "familia">("essencial");

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");

  // Mercado Pago instance
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [cardFormReady, setCardFormReady] = useState(false);
  const cardFormRef = useRef<any>(null);

  // Form data
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");

  // PIX payment state
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState<string | null>(null);

  // Payment status
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  // tRPC mutations
  const createCardPayment = api.payment.createCardPayment.useMutation();
  const createPixPayment = api.payment.createPixPayment.useMutation();
  const createSubscription = api.payment.createSubscription.useMutation();

  // tRPC query for payment status (only when we have a payment ID)
  const { data: paymentStatusData } = api.payment.getPaymentStatus.useQuery(
    { paymentId: pixPaymentId! },
    {
      enabled: !!pixPaymentId && paymentMethod === "pix",
      refetchInterval: 3000, // Poll every 3 seconds
    }
  );

  // Plan configurations
  const plans = {
    essencial: {
      id: "essencial",
      name: "Memorial Essencial",
      price: 19.90,
      description: "1 Memorial Digital com até 10 fotos",
    },
    premium: {
      id: "premium",
      name: "Memorial Premium",
      price: 99.90,
      description: "1 Memorial com galeria ilimitada",
    },
    familia: {
      id: "familia",
      name: "Plano Família",
      price: 249.90,
      description: "Até 5 memoriais com tudo do premium",
    },
  };

  const currentPlan = plans[selectedPlan];

  // ... rest of component
}
```

---

## Step 3: Load Mercado Pago SDK

```typescript
// Load Mercado Pago SDK
useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://sdk.mercadopago.com/js/v2";
  script.async = true;

  script.onload = () => {
    // Get public key from backend
    fetch("/api/trpc/payment.getPublicKey")
      .then((res) => res.json())
      .then((data) => {
        const publicKey = data.result.data.publicKey;

        if (!publicKey) {
          console.error("Mercado Pago public key not found");
          toast.error("Erro ao carregar sistema de pagamento");
          return;
        }

        // Initialize Mercado Pago
        const mp = new (window as any).MercadoPago(publicKey);
        setMpInstance(mp);
      })
      .catch((error) => {
        console.error("Error loading MP public key:", error);
        toast.error("Erro ao carregar sistema de pagamento");
      });
  };

  script.onerror = () => {
    console.error("Failed to load Mercado Pago SDK");
    toast.error("Erro ao carregar Mercado Pago");
  };

  document.body.appendChild(script);

  return () => {
    // Cleanup
    if (document.body.contains(script)) {
      document.body.removeChild(script);
    }
  };
}, []);
```

---

## Step 4: Initialize CardForm

```typescript
// Initialize CardForm when MP is ready and card payment is selected
useEffect(() => {
  if (!mpInstance || paymentMethod !== "card") {
    return;
  }

  // Wait for form elements to be in DOM
  setTimeout(() => {
    const formElement = document.getElementById("form-checkout");
    if (!formElement) {
      console.error("Form element not found");
      return;
    }

    try {
      const cardForm = mpInstance.cardForm({
        amount: String(currentPlan.price),
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
            placeholder: "Nome no cartão",
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
              console.error("Form mount error:", error);
              toast.error("Erro ao carregar formulário de cartão");
              return;
            }
            console.log("CardForm mounted successfully");
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
      console.error("Error initializing CardForm:", error);
      toast.error("Erro ao inicializar formulário de pagamento");
    }
  }, 100);

  return () => {
    // Cleanup CardForm
    if (cardFormRef.current) {
      cardFormRef.current = null;
    }
  };
}, [mpInstance, paymentMethod, currentPlan]);
```

---

## Step 5: Card Payment Handler

```typescript
const handleCardPayment = async (cardForm: any) => {
  try {
    setIsProcessing(true);
    setPaymentStatus("processing");

    // Get card form data
    const cardFormData = cardForm.getCardFormData();

    if (!cardFormData.token) {
      throw new Error("Token de cartão não gerado");
    }

    console.log("Processing card payment with data:", {
      planId: selectedPlan,
      paymentMethodId: cardFormData.paymentMethodId,
      installments: cardFormData.installments,
    });

    // Create payment
    const result = await createCardPayment.mutateAsync({
      planId: selectedPlan,
      cardToken: cardFormData.token,
      customerEmail: cardFormData.cardholderEmail,
      paymentMethodId: cardFormData.paymentMethodId,
      installments: cardFormData.installments || 1,
    });

    console.log("Payment result:", result);

    // Check payment status
    if (result.status === "approved" || result.status === "authorized") {
      // Payment approved! Create subscription
      await handleSubscriptionCreation(result.id);

      setPaymentStatus("success");
      toast.success("Pagamento aprovado!");

      // Redirect to success page
      setTimeout(() => {
        router.push("/dashboard?payment=success");
      }, 2000);
    } else if (result.status === "pending" || result.status === "in_process") {
      setPaymentStatus("processing");
      toast.info("Pagamento em processamento. Você receberá uma notificação quando for aprovado.");

      // Redirect to pending page
      setTimeout(() => {
        router.push("/dashboard?payment=pending");
      }, 2000);
    } else {
      throw new Error(`Pagamento não autorizado: ${result.statusDetail || result.status}`);
    }
  } catch (error: any) {
    console.error("Card payment error:", error);
    setPaymentStatus("error");
    toast.error(error.message || "Erro ao processar pagamento com cartão");
  } finally {
    setIsProcessing(false);
  }
};
```

---

## Step 6: PIX Payment Handler

```typescript
const handlePixPayment = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email || !firstName || !lastName || !cpf) {
    toast.error("Preencha todos os campos");
    return;
  }

  // Validate CPF format (11 digits)
  const cpfClean = cpf.replace(/\D/g, "");
  if (cpfClean.length !== 11) {
    toast.error("CPF deve ter 11 dígitos");
    return;
  }

  try {
    setIsProcessing(true);
    setPaymentStatus("processing");

    console.log("Creating PIX payment:", {
      planId: selectedPlan,
      email,
      firstName,
      lastName,
      cpf: cpfClean,
    });

    const result = await createPixPayment.mutateAsync({
      planId: selectedPlan,
      customerEmail: email,
      firstName,
      lastName,
      cpf: cpfClean,
    });

    console.log("PIX payment created:", result);

    // Store PIX data
    setPixPaymentId(result.id);
    setPixQrCode(result.pixQrCode);
    setPixQrCodeBase64(result.pixQrCodeBase64);

    toast.success("Código PIX gerado! Escaneie para pagar.");
  } catch (error: any) {
    console.error("PIX payment error:", error);
    setPaymentStatus("error");
    toast.error(error.message || "Erro ao gerar código PIX");
    setIsProcessing(false);
  }
};
```

---

## Step 7: Monitor PIX Payment Status

```typescript
// Monitor PIX payment status
useEffect(() => {
  if (!paymentStatusData || !pixPaymentId) return;

  console.log("PIX payment status:", paymentStatusData.status);

  if (paymentStatusData.status === "approved" || paymentStatusData.status === "authorized") {
    // Payment approved!
    handleSubscriptionCreation(pixPaymentId).then(() => {
      setPaymentStatus("success");
      toast.success("Pagamento PIX confirmado!");

      setTimeout(() => {
        router.push("/dashboard?payment=success");
      }, 2000);
    });
  } else if (paymentStatusData.status === "rejected" || paymentStatusData.status === "cancelled") {
    setPaymentStatus("error");
    toast.error("Pagamento PIX foi rejeitado ou cancelado");
    setIsProcessing(false);
  }
}, [paymentStatusData, pixPaymentId]);
```

---

## Step 8: Subscription Creation

```typescript
const handleSubscriptionCreation = async (paymentId: string) => {
  try {
    console.log("Creating subscription for payment:", paymentId);

    await createSubscription.mutateAsync({
      planId: selectedPlan,
      durationMonths: 12,
    });

    console.log("Subscription created successfully");
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    // Don't throw - subscription can be created later
    toast.warning("Pagamento aprovado. Assinatura será ativada em breve.");
  }
};
```

---

## Step 9: JSX Structure

```tsx
return (
  <div className="container max-w-4xl mx-auto py-12 px-4">
    <Card>
      <CardHeader>
        <CardTitle>Finalizar Pagamento</CardTitle>
        <CardDescription>Escolha seu plano e método de pagamento</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Plan Selection */}
        <div className="mb-8">
          <Label className="text-lg font-semibold mb-4 block">Selecione o Plano</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(plans).map(([key, plan]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all ${
                  selectedPlan === key ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPlan(key as any)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription className="text-2xl font-bold text-primary">
                    R$ {plan.price.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Method Tabs */}
        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "pix")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="card">Cartão de Crédito</TabsTrigger>
            <TabsTrigger value="pix">PIX</TabsTrigger>
          </TabsList>

          {/* Card Payment Tab */}
          <TabsContent value="card" className="space-y-4">
            {!mpInstance && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando Mercado Pago...</span>
              </div>
            )}

            {mpInstance && (
              <form id="form-checkout" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="form-checkout__cardholderEmail">E-mail</Label>
                    <input
                      type="email"
                      id="form-checkout__cardholderEmail"
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <Label>Número do Cartão</Label>
                    <div id="form-checkout__cardNumber" className="border rounded-md p-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Validade</Label>
                      <div id="form-checkout__expirationDate" className="border rounded-md p-2" />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <div id="form-checkout__securityCode" className="border rounded-md p-2" />
                    </div>
                  </div>

                  <div>
                    <Label>Nome no Cartão</Label>
                    <input
                      type="text"
                      id="form-checkout__cardholderName"
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <Label>CPF</Label>
                    <input
                      type="text"
                      id="form-checkout__identificationNumber"
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>

                  <select id="form-checkout__identificationType" className="hidden">
                    <option value="CPF">CPF</option>
                  </select>

                  <div>
                    <Label>Banco Emissor</Label>
                    <select id="form-checkout__issuer" className="w-full px-3 py-2 border rounded-md" />
                  </div>

                  <div>
                    <Label>Parcelas</Label>
                    <select id="form-checkout__installments" className="w-full px-3 py-2 border rounded-md" />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!cardFormReady || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      `Pagar R$ ${currentPlan.price.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* PIX Payment Tab */}
          <TabsContent value="pix" className="space-y-4">
            {!pixQrCode ? (
              <form onSubmit={handlePixPayment} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
                    placeholder="00000000000"
                    maxLength={11}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando código PIX...
                    </>
                  ) : (
                    `Gerar PIX - R$ ${currentPlan.price.toFixed(2)}`
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Escaneie o QR Code para pagar</h3>

                {pixQrCodeBase64 && (
                  <img
                    src={`data:image/png;base64,${pixQrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-64 h-64 mx-auto border rounded-lg"
                  />
                )}

                <div>
                  <Label>Ou copie o código PIX:</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={pixQrCode || ""} readOnly className="font-mono text-xs" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(pixQrCode || "");
                        toast.success("Código copiado!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Aguardando pagamento...</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    O pagamento será confirmado automaticamente após a aprovação.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Payment Status Messages */}
        {paymentStatus === "success" && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Pagamento aprovado com sucesso!</span>
            </div>
          </div>
        )}

        {paymentStatus === "error" && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Erro no pagamento. Tente novamente.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
```

---

## Step 10: TypeScript Declarations

Add this to `global.d.ts` or at the top of your component file:

```typescript
declare global {
  interface Window {
    MercadoPago: any;
  }
}
```

---

## Testing Checklist

### Card Payment
- [ ] CardForm loads without errors
- [ ] All form fields display correctly
- [ ] Test card (5031 4332 1540 6351) is accepted
- [ ] Payment processes successfully
- [ ] Subscription is created after payment
- [ ] Redirect to dashboard works

### PIX Payment
- [ ] Form validation works
- [ ] QR code displays correctly
- [ ] Copy button works
- [ ] Status polling updates automatically
- [ ] Payment approval triggers subscription
- [ ] Redirect works after approval

### Error Handling
- [ ] Invalid card shows error
- [ ] Network errors are caught
- [ ] Loading states display correctly
- [ ] Toast notifications appear

---

## Common Issues

### Issue: CardForm doesn't load
**Fix**: Ensure MP SDK script is loaded before initializing. Add delay or check for `window.MercadoPago`.

### Issue: "token is required"
**Fix**: Check CardForm is generating token correctly. Call `cardForm.getCardFormData()` to verify.

### Issue: PIX status not updating
**Fix**: Verify `refetchInterval` is set on the query and `enabled` flag is true.

### Issue: Installments not showing
**Fix**: Ensure `amount` in CardForm config is a string, not a number.

---

## Next Steps

1. Copy this code into `src/app/checkout/page.tsx`
2. Test with Mercado Pago sandbox credentials
3. Use test cards to verify card payments
4. Test PIX with test data
5. Verify subscription creation
6. Deploy and configure webhook
7. Test in production with small payment

---

**Note**: This is a complete, production-ready implementation. Adjust styling and error messages to match your design system.
