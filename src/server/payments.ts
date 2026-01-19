import { env } from "~/env";
import Stripe from "stripe";
import { getDb } from "./db";
import { paymentTransactions, subscriptions } from "../../drizzle/schema";
import type { InsertPaymentTransaction, InsertSubscription } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

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

  // Store payment transaction in database
  try {
    await createPaymentTransaction({
      stripePaymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: "pending",
      paymentMethod: "card",
      customerEmail: customerEmail || undefined,
      planId,
      metadata: {
        product_id: plan.productId,
        description: plan.description,
      },
    });
  } catch (error) {
    console.error("[Payment] Failed to store payment transaction:", error);
    // Don't fail the payment intent creation if database storage fails
  }

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

  // Update database with current status
  try {
    const statusMap: Record<string, "pending" | "succeeded" | "failed" | "cancelled"> = {
      requires_payment_method: "pending",
      requires_confirmation: "pending",
      requires_action: "pending",
      processing: "pending",
      requires_capture: "pending",
      succeeded: "succeeded",
      canceled: "cancelled",
    };

    const dbStatus = statusMap[intent.status] || "failed";

    await updatePaymentTransactionStatus(
      paymentIntentId,
      dbStatus,
      intent.last_payment_error?.message
    );
  } catch (error) {
    console.error("[Payment] Failed to update payment transaction status:", error);
    // Don't fail the status retrieval if database update fails
  }

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

  console.log("[Payment] Confirming payment intent:", paymentIntentId, "with method:", paymentMethodId);

  try {
    // Confirm the payment intent with the payment method
    const intent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    console.log("[Payment] Payment confirmed successfully:", intent.id, "status:", intent.status);

    return {
      id: intent.id,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
    };
  } catch (error: any) {
    console.error("[Payment] Error confirming payment:", error);
    throw new Error(`Payment confirmation failed: ${error.message}`);
  }
}

/**
 * Creates a payment transaction record in the database.
 * Called after creating a payment intent with Stripe.
 */
export async function createPaymentTransaction(data: {
  stripePaymentIntentId: string;
  stripePaymentMethodId?: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded" | "cancelled";
  paymentMethod: "card" | "pix" | "boleto";
  customerEmail?: string;
  planId: string;
  subscriptionId?: number;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Payment] Cannot create payment transaction: database not available");
    throw new Error("Database not available");
  }

  try {
    const record: InsertPaymentTransaction = {
      stripePaymentIntentId: data.stripePaymentIntentId,
      stripePaymentMethodId: data.stripePaymentMethodId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paymentMethod: data.paymentMethod,
      customerEmail: data.customerEmail,
      planId: data.planId,
      subscriptionId: data.subscriptionId,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    };

    const [result] = await db.insert(paymentTransactions).values(record).returning({ id: paymentTransactions.id });

    if (!result) {
      throw new Error("Failed to create payment transaction");
    }

    return result.id;
  } catch (error) {
    console.error("[Payment] Error creating payment transaction:", error);
    throw error;
  }
}

/**
 * Updates a payment transaction status in the database.
 * Called when payment status changes (e.g., from pending to succeeded).
 */
export async function updatePaymentTransactionStatus(
  stripePaymentIntentId: string,
  status: "pending" | "succeeded" | "failed" | "refunded" | "cancelled",
  failureReason?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Payment] Cannot update payment transaction: database not available");
    return;
  }

  try {
    await db
      .update(paymentTransactions)
      .set({
        status,
        failureReason: failureReason || null,
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.stripePaymentIntentId, stripePaymentIntentId));
  } catch (error) {
    console.error("[Payment] Error updating payment transaction:", error);
    throw error;
  }
}

/**
 * Retrieves a payment transaction by Stripe payment intent ID.
 */
export async function getPaymentTransaction(stripePaymentIntentId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Payment] Cannot get payment transaction: database not available");
    return null;
  }

  try {
    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.stripePaymentIntentId, stripePaymentIntentId))
      .limit(1);

    return transaction || null;
  } catch (error) {
    console.error("[Payment] Error getting payment transaction:", error);
    return null;
  }
}

/**
 * Creates a subscription record in the database.
 * Called after successful payment to track user subscription.
 */
export async function createSubscription(data: {
  userId: number;
  userType: "funeral_home" | "family_user" | "oauth_user";
  planId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: "active" | "cancelled" | "expired" | "past_due" | "trialing";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  memorialId?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Payment] Cannot create subscription: database not available");
    throw new Error("Database not available");
  }

  try {
    const record: InsertSubscription = {
      userId: data.userId,
      userType: data.userType,
      planId: data.planId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: false,
      memorialId: data.memorialId,
    };

    const [result] = await db.insert(subscriptions).values(record).returning({ id: subscriptions.id });

    if (!result) {
      throw new Error("Failed to create subscription");
    }

    return result.id;
  } catch (error) {
    console.error("[Payment] Error creating subscription:", error);
    throw error;
  }
}

/**
 * Gets all active subscriptions for a user.
 */
export async function getUserSubscriptions(userId: number, userType: "funeral_home" | "family_user" | "oauth_user") {
  const db = await getDb();
  if (!db) {
    console.warn("[Payment] Cannot get subscriptions: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.userType, userType)));
  } catch (error) {
    console.error("[Payment] Error getting subscriptions:", error);
    return [];
  }
}
