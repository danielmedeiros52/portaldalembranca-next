import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as paymentsModule from '~/server/payments';

describe('Payment Service - Stripe Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent for essencial plan', async () => {
      const result = await paymentsModule.createPaymentIntent('essencial', 'user@example.com');

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^pi_test_/);
      expect(result.amount).toBe(1990);
      expect(result.currency).toBe('brl');
    });

    it('should create a payment intent for premium plan', async () => {
      const result = await paymentsModule.createPaymentIntent('premium', 'user@example.com');

      expect(result.id).toBeDefined();
      expect(result.amount).toBe(9990);
      expect(result.currency).toBe('brl');
    });

    it('should create a payment intent for familia plan', async () => {
      const result = await paymentsModule.createPaymentIntent('familia', 'user@example.com');

      expect(result.id).toBeDefined();
      expect(result.amount).toBe(24990);
      expect(result.currency).toBe('brl');
    });

    it('should throw error for invalid plan', async () => {
      await expect(
        paymentsModule.createPaymentIntent('invalid_plan', 'user@example.com')
      ).rejects.toThrow('Plan invalid_plan not found');
    });
  });

  describe('getPaymentIntentStatus', () => {
    it('should get payment intent status', async () => {
      const result = await paymentsModule.getPaymentIntentStatus('pi_test_123');

      expect(result.id).toBe('pi_test_123');
      expect(result.status).toBeDefined();
      expect(result.amount).toBeDefined();
      expect(result.currency).toBe('brl');
    });

    it('should handle payment intent requiring payment method', async () => {
      const result = await paymentsModule.getPaymentIntentStatus('pi_test_456');

      expect(result.status).toBeDefined();
      expect(result.id).toBeDefined();
    });
  });

  describe('Plan Pricing', () => {
    it('essencial plan should cost R$ 19.90', async () => {
      const result = await paymentsModule.createPaymentIntent('essencial', 'user@example.com');
      expect(result.amount).toBe(1990); // 19.90 in cents
    });

    it('premium plan should cost R$ 99.90', async () => {
      const result = await paymentsModule.createPaymentIntent('premium', 'user@example.com');
      expect(result.amount).toBe(9990); // 99.90 in cents
    });

    it('familia plan should cost R$ 249.90', async () => {
      const result = await paymentsModule.createPaymentIntent('familia', 'user@example.com');
      expect(result.amount).toBe(24990); // 249.90 in cents
    });
  });

  describe('Currency Handling', () => {
    it('should always use BRL currency', async () => {
      const result = await paymentsModule.createPaymentIntent('essencial', 'user@example.com');
      expect(result.currency).toBe('brl');
    });
  });

  describe('Payment Transaction Tracking', () => {
    it('should create a payment transaction record', async () => {
      const transactionData = {
        stripePaymentIntentId: 'pi_test_tracking_123',
        amount: 1990,
        currency: 'brl',
        status: 'pending' as const,
        paymentMethod: 'card' as const,
        customerEmail: 'test@example.com',
        planId: 'essencial',
        metadata: { test: 'data' },
      };

      const transactionId = await paymentsModule.createPaymentTransaction(transactionData);

      expect(transactionId).toBeDefined();
      expect(typeof transactionId).toBe('number');
      expect(transactionId).toBeGreaterThan(0);
    });

    it('should update payment transaction status', async () => {
      const transactionData = {
        stripePaymentIntentId: 'pi_test_update_123',
        amount: 1990,
        currency: 'brl',
        status: 'pending' as const,
        paymentMethod: 'card' as const,
        customerEmail: 'test@example.com',
        planId: 'essencial',
      };

      await paymentsModule.createPaymentTransaction(transactionData);

      // Update to succeeded
      await expect(
        paymentsModule.updatePaymentTransactionStatus('pi_test_update_123', 'succeeded')
      ).resolves.not.toThrow();

      // Verify the update by retrieving
      const transaction = await paymentsModule.getPaymentTransaction('pi_test_update_123');
      expect(transaction?.status).toBe('succeeded');
    });

    it('should update payment transaction with failure reason', async () => {
      const transactionData = {
        stripePaymentIntentId: 'pi_test_failed_123',
        amount: 1990,
        currency: 'brl',
        status: 'pending' as const,
        paymentMethod: 'card' as const,
        customerEmail: 'test@example.com',
        planId: 'essencial',
      };

      await paymentsModule.createPaymentTransaction(transactionData);

      // Update to failed with reason
      await paymentsModule.updatePaymentTransactionStatus(
        'pi_test_failed_123',
        'failed',
        'Insufficient funds'
      );

      const transaction = await paymentsModule.getPaymentTransaction('pi_test_failed_123');
      expect(transaction?.status).toBe('failed');
      expect(transaction?.failureReason).toBe('Insufficient funds');
    });

    it('should retrieve payment transaction by payment intent ID', async () => {
      const transactionData = {
        stripePaymentIntentId: 'pi_test_retrieve_123',
        amount: 9990,
        currency: 'brl',
        status: 'succeeded' as const,
        paymentMethod: 'card' as const,
        customerEmail: 'premium@example.com',
        planId: 'premium',
      };

      const createdId = await paymentsModule.createPaymentTransaction(transactionData);

      const retrieved = await paymentsModule.getPaymentTransaction('pi_test_retrieve_123');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(createdId);
      expect(retrieved?.stripePaymentIntentId).toBe('pi_test_retrieve_123');
      expect(retrieved?.amount).toBe(9990);
      expect(retrieved?.planId).toBe('premium');
    });

    it('should return null for non-existent payment transaction', async () => {
      const transaction = await paymentsModule.getPaymentTransaction('pi_test_nonexistent');
      expect(transaction).toBeNull();
    });

    it('should store payment transaction metadata as JSON string', async () => {
      const metadata = { orderId: '12345', campaignId: 'summer2024' };
      const transactionData = {
        stripePaymentIntentId: 'pi_test_metadata_123',
        amount: 1990,
        currency: 'brl',
        status: 'pending' as const,
        paymentMethod: 'card' as const,
        customerEmail: 'test@example.com',
        planId: 'essencial',
        metadata,
      };

      await paymentsModule.createPaymentTransaction(transactionData);

      const transaction = await paymentsModule.getPaymentTransaction('pi_test_metadata_123');
      expect(transaction?.metadata).toBeDefined();
      expect(JSON.parse(transaction!.metadata!)).toEqual(metadata);
    });
  });

  describe('Subscription Management', () => {
    it('should create a subscription record', async () => {
      const subscriptionData = {
        userId: 1,
        userType: 'funeral_home' as const,
        planId: 'premium',
        status: 'active' as const,
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2025-01-01'),
      };

      const subscriptionId = await paymentsModule.createSubscription(subscriptionData);

      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe('number');
      expect(subscriptionId).toBeGreaterThan(0);
    });

    it('should create subscription with Stripe customer and subscription IDs', async () => {
      const subscriptionData = {
        userId: 2,
        userType: 'funeral_home' as const,
        planId: 'familia',
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123',
        status: 'active' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };

      const subscriptionId = await paymentsModule.createSubscription(subscriptionData);
      expect(subscriptionId).toBeDefined();
    });

    it('should create subscription linked to memorial', async () => {
      const subscriptionData = {
        userId: 3,
        userType: 'family_user' as const,
        planId: 'essencial',
        status: 'active' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        memorialId: 100,
      };

      const subscriptionId = await paymentsModule.createSubscription(subscriptionData);
      expect(subscriptionId).toBeDefined();
    });

    it('should retrieve user subscriptions', async () => {
      const userId = 4;
      const userType = 'funeral_home' as const;

      // Create multiple subscriptions for the user
      await paymentsModule.createSubscription({
        userId,
        userType,
        planId: 'premium',
        status: 'active' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      await paymentsModule.createSubscription({
        userId,
        userType,
        planId: 'essencial',
        status: 'cancelled' as const,
        currentPeriodStart: new Date('2023-01-01'),
        currentPeriodEnd: new Date('2024-01-01'),
      });

      const subscriptions = await paymentsModule.getUserSubscriptions(userId, userType);

      expect(subscriptions).toBeDefined();
      expect(Array.isArray(subscriptions)).toBe(true);
      expect(subscriptions.length).toBeGreaterThanOrEqual(2);
      expect(subscriptions.some(sub => sub.planId === 'premium')).toBe(true);
      expect(subscriptions.some(sub => sub.planId === 'essencial')).toBe(true);
    });

    it('should return empty array for user with no subscriptions', async () => {
      const subscriptions = await paymentsModule.getUserSubscriptions(9999, 'funeral_home');
      expect(subscriptions).toBeDefined();
      expect(Array.isArray(subscriptions)).toBe(true);
      expect(subscriptions.length).toBe(0);
    });

    it('should handle different user types', async () => {
      const userTypes: Array<'funeral_home' | 'family_user' | 'oauth_user'> = [
        'funeral_home',
        'family_user',
        'oauth_user',
      ];

      for (const userType of userTypes) {
        const subscriptionData = {
          userId: 100 + userTypes.indexOf(userType),
          userType,
          planId: 'premium',
          status: 'active' as const,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        };

        const subscriptionId = await paymentsModule.createSubscription(subscriptionData);
        expect(subscriptionId).toBeDefined();

        const retrieved = await paymentsModule.getUserSubscriptions(
          subscriptionData.userId,
          userType
        );
        expect(retrieved.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Payment Flow Integration', () => {
    it('should create payment intent and transaction together', async () => {
      const planId = 'premium';
      const customerEmail = 'integration@example.com';

      // Create payment intent (which now also creates transaction)
      const paymentIntent = await paymentsModule.createPaymentIntent(planId, customerEmail);

      expect(paymentIntent.id).toBeDefined();

      // Verify transaction was created
      const transaction = await paymentsModule.getPaymentTransaction(paymentIntent.id);

      expect(transaction).toBeDefined();
      expect(transaction?.stripePaymentIntentId).toBe(paymentIntent.id);
      expect(transaction?.amount).toBe(9990);
      expect(transaction?.planId).toBe('premium');
      expect(transaction?.status).toBe('pending');
    });

    it('should update transaction status when checking payment status', async () => {
      // Create a payment intent
      const paymentIntent = await paymentsModule.createPaymentIntent('essencial', 'status@example.com');

      // Check status (which should update database)
      const status = await paymentsModule.getPaymentIntentStatus(paymentIntent.id);

      expect(status.id).toBe(paymentIntent.id);

      // Verify database was updated
      const transaction = await paymentsModule.getPaymentTransaction(paymentIntent.id);
      expect(transaction).toBeDefined();
      expect(transaction?.status).toBeDefined();
    });
  });
});
