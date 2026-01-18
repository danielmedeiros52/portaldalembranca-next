import { env } from "~/env";
import Stripe from "stripe";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
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

/**
 * Confirms a payment intent with a payment method ID.
 *
 * SECURITY: This function accepts only a payment method ID, not raw card data.
 * The payment method should be created on the client side using Stripe.js/Elements
 * to ensure PCI compliance and security.
 *
 * @param paymentIntentId - The Stripe payment intent ID
 * @param paymentMethodId - The payment method ID created by Stripe.js on the client
 * @returns Payment intent details
 */
export async function confirmPaymentWithPaymentMethod(
  paymentIntentId: string,
  paymentMethodId: string
) {
  if (!paymentMethodId || !paymentMethodId.startsWith("pm_")) {
    throw new Error("Invalid payment method ID. Must be created using Stripe.js");
  }

  // Confirm the payment intent with the payment method
  const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method: paymentMethodId,
  });

  return {
    id: intent.id,
    status: intent.status,
    amount: intent.amount,
    currency: intent.currency,
  };
}
