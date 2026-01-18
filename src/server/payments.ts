import { env } from "~/env";
import Stripe from "stripe";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-27.acacia",
});

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
  const plan = STRIPE_PRODUCTS[planId];
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }

  const intent = await stripe.paymentIntents.create({
    amount: plan.price,
    currency: "brl",
    payment_method_types: ["card"],
    description: plan.description,
    metadata: {
      plan_id: planId,
      product_id: plan.productId,
    },
    ...(customerEmail && { receipt_email: customerEmail }),
  });

  return {
    id: intent.id,
    clientSecret: intent.client_secret,
    amount: intent.amount,
    currency: intent.currency,
    status: intent.status,
  };
}

export async function getPaymentIntentStatus(paymentIntentId: string) {
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

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
  // Parse card expiry (MM/AA format)
  const [expMonth, expYear] = cardExp.split("/");

  if (!expMonth || !expYear) {
    throw new Error("Invalid card expiry format");
  }

  // Step 1: Create a payment method using Stripe SDK
  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: {
      number: cardNumber.replace(/\s/g, ""),
      exp_month: parseInt(expMonth),
      exp_year: parseInt("20" + expYear),
      cvc: cardCvc,
    },
    billing_details: {
      name: cardName,
    },
  });

  // Step 2: Confirm the payment intent with the payment method
  const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethod.id,
  });

  return {
    id: intent.id,
    status: intent.status,
    amount: intent.amount,
    currency: intent.currency,
  };
}
