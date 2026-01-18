import { env } from "~/env";

const STRIPE_PRODUCTS: Record<
  string,
  {
    productId: string;
    price: number;
    name: string;
    description: string;
  }
> = {
  essencial: {
    productId: "prod_TiiUFKT7NvAWvA",
    price: 1990,
    name: "Memorial Essencial",
    description: "1 Memorial Digital com até 10 fotos",
  },
  premium: {
    productId: "prod_Tihb3SipDs4nOP",
    price: 9990,
    name: "Memorial Premium",
    description: "1 Memorial com galeria ilimitada",
  },
  familia: {
    productId: "prod_TiiVZKqHg334zv",
    price: 24990,
    name: "Plano Família",
    description: "Até 5 memoriais com tudo do premium",
  },
};

export async function createPaymentIntent(
  planId: string,
  customerEmail: string
) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const plan = STRIPE_PRODUCTS[planId];
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }

  const body = new URLSearchParams({
    amount: plan.price.toString(),
    currency: "brl",
    "payment_method_types[]": "card",
    description: plan.description,
    "metadata[plan_id]": planId,
    "metadata[product_id]": plan.productId,
  });

  if (customerEmail) {
    body.append("receipt_email", customerEmail);
  }

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Stripe API error:", error);
    throw new Error(`Failed to create payment intent: ${error}`);
  }

  const intent = (await response.json()) as {
    id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
  };

  return {
    id: intent.id,
    clientSecret: intent.client_secret,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
  };
}

export async function getPaymentIntentStatus(paymentIntentId: string) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Stripe API error:", error);
    throw new Error(`Failed to get payment intent status: ${error}`);
  }

  const intent = (await response.json()) as {
    id: string;
    status: string;
    amount: number;
    currency: string;
  };

  return {
    id: intent.id,
    status: intent.status,
    amount: intent.amount,
    currency: intent.currency,
  };
}

export async function confirmPaymentWithCard(
  paymentIntentId: string,
  cardNumber: string,
  cardExp: string,
  cardCvc: string,
  cardName: string
) {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  // Parse card expiry (MM/AA format)
  const [expMonth, expYear] = cardExp.split("/");

  if (!expMonth || !expYear) {
    throw new Error("Invalid card expiry format");
  }

  // Step 1: Create a payment method with the card details
  const paymentMethodParams = new URLSearchParams();
  paymentMethodParams.append("type", "card");
  paymentMethodParams.append("card[number]", cardNumber.replace(/\s/g, ""));
  paymentMethodParams.append("card[exp_month]", expMonth);
  paymentMethodParams.append("card[exp_year]", "20" + expYear);
  paymentMethodParams.append("card[cvc]", cardCvc);
  paymentMethodParams.append("billing_details[name]", cardName);

  const pmResponse = await fetch("https://api.stripe.com/v1/payment_methods", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: paymentMethodParams.toString(),
  });

  if (!pmResponse.ok) {
    const error = await pmResponse.text();
    console.error("Stripe payment method creation error:", error);
    throw new Error(`Failed to create payment method: ${error}`);
  }

  const paymentMethodData = (await pmResponse.json()) as { id: string };
  const paymentMethodId = paymentMethodData.id;

  // Step 2: Confirm the payment intent with the payment method ID
  const confirmParams = new URLSearchParams();
  confirmParams.append("payment_method", paymentMethodId);

  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: confirmParams.toString(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Stripe API error:", error);
    throw new Error(`Failed to confirm payment: ${error}`);
  }

  const intent = (await response.json()) as {
    id: string;
    status: string;
    amount: number;
    currency: string;
    last_payment_error?: { message: string };
  };

  // Handle payment errors
  if (intent.last_payment_error) {
    throw new Error(`Payment failed: ${intent.last_payment_error.message}`);
  }

  return {
    id: intent.id,
    status: intent.status,
    amount: intent.amount,
    currency: intent.currency,
  };
}
