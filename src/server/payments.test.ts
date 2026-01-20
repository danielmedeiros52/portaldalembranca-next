import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as paymentsModule from '~/server/payments';

// Mock Mercado Pago SDK
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn(() => ({
    create: vi.fn((data) => {
      const isPixPayment = data.body.payment_method_id === 'pix';
      const mockPaymentId = Math.floor(Math.random() * 1000000);

      return Promise.resolve({
        id: mockPaymentId,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: data.body.transaction_amount,
        currency_id: 'BRL',
        payment_method_id: data.body.payment_method_id,
        ...(isPixPayment && {
          point_of_interaction: {
            transaction_data: {
              qr_code: '00020126580014br.gov.bcb.pix0136a629532e-7693-4846-852d-1bbff6b2f8cd520400005303986540519.905802BR5913Test User6009SAO PAULO62070503***63041D3D',
              qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            },
          },
          date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
      });
    }),
    get: vi.fn(({ id }) => {
      return Promise.resolve({
        id,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 19.90,
        currency_id: 'BRL',
      });
    }),
  })),
}));

describe('Payment Service - Mercado Pago Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCardPayment', () => {
    it('should create a card payment for essencial plan', async () => {
      const result = await paymentsModule.createCardPayment(
        'essencial',
        'card_token_test_123',
        'user@example.com',
        'visa',
        1
      );

      expect(result.id).toBeDefined();
      expect(result.status).toBe('approved');
      expect(result.amount).toBe(19.90);
      expect(result.currency).toBe('BRL');
      expect(result.paymentMethodId).toBe('visa');
    });

    it('should create a card payment for premium plan', async () => {
      const result = await paymentsModule.createCardPayment(
        'premium',
        'card_token_test_456',
        'user@example.com',
        'master',
        1
      );

      expect(result.id).toBeDefined();
      expect(result.amount).toBe(99.90);
      expect(result.currency).toBe('BRL');
    });

    it('should create a card payment for familia plan', async () => {
      const result = await paymentsModule.createCardPayment(
        'familia',
        'card_token_test_789',
        'user@example.com',
        'visa',
        1
      );

      expect(result.id).toBeDefined();
      expect(result.amount).toBe(249.90);
      expect(result.currency).toBe('BRL');
    });

    it('should support installments', async () => {
      const result = await paymentsModule.createCardPayment(
        'premium',
        'card_token_test_installments',
        'user@example.com',
        'visa',
        3
      );

      expect(result.id).toBeDefined();
      expect(result.status).toBe('approved');
    });

    it('should throw error for invalid plan', async () => {
      await expect(
        paymentsModule.createCardPayment(
          'invalid_plan',
          'card_token_test',
          'user@example.com',
          'visa',
          1
        )
      ).rejects.toThrow('Plan invalid_plan not found');
    });
  });

  describe('createPixPayment', () => {
    it('should create a PIX payment for essencial plan', async () => {
      const result = await paymentsModule.createPixPayment(
        'essencial',
        'user@example.com',
        'João',
        'Silva',
        '12345678909'
      );

      expect(result.id).toBeDefined();
      expect(result.status).toBe('approved');
      expect(result.amount).toBe(19.90);
      expect(result.currency).toBe('BRL');
      expect(result.pixQrCode).toBeDefined();
      expect(result.pixQrCodeBase64).toBeDefined();
      expect(result.pixExpirationDate).toBeDefined();
    });

    it('should create a PIX payment for premium plan', async () => {
      const result = await paymentsModule.createPixPayment(
        'premium',
        'premium@example.com',
        'Maria',
        'Santos',
        '98765432100'
      );

      expect(result.id).toBeDefined();
      expect(result.amount).toBe(99.90);
      expect(result.pixQrCode).toBeTruthy();
      expect(result.pixQrCodeBase64).toBeTruthy();
    });

    it('should create a PIX payment for familia plan', async () => {
      const result = await paymentsModule.createPixPayment(
        'familia',
        'familia@example.com',
        'Carlos',
        'Oliveira',
        '11122233344'
      );

      expect(result.id).toBeDefined();
      expect(result.amount).toBe(249.90);
    });

    it('should throw error for invalid plan', async () => {
      await expect(
        paymentsModule.createPixPayment(
          'invalid_plan',
          'user@example.com',
          'João',
          'Silva',
          '12345678909'
        )
      ).rejects.toThrow('Plan invalid_plan not found');
    });

    it('should include PIX QR code data', async () => {
      const result = await paymentsModule.createPixPayment(
        'essencial',
        'qrcode@example.com',
        'Test',
        'User',
        '12345678909'
      );

      expect(result.pixQrCode).toBeDefined();
      expect(typeof result.pixQrCode).toBe('string');
      expect(result.pixQrCode.length).toBeGreaterThan(0);

      expect(result.pixQrCodeBase64).toBeDefined();
      expect(typeof result.pixQrCodeBase64).toBe('string');
      expect(result.pixQrCodeBase64.length).toBeGreaterThan(0);
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status from Mercado Pago', async () => {
      const result = await paymentsModule.getPaymentStatus('123456');

      expect(result.id).toBe('123456');
      expect(result.status).toBeDefined();
      expect(result.amount).toBeDefined();
      expect(result.currency).toBe('BRL');
    });

    it('should return payment details', async () => {
      const result = await paymentsModule.getPaymentStatus('789012');

      expect(result.status).toBe('approved');
      expect(result.statusDetail).toBe('accredited');
    });
  });

  describe('Plan Pricing', () => {
    it('essencial plan should cost R$ 19.90', async () => {
      const result = await paymentsModule.createCardPayment(
        'essencial',
        'token',
        'user@example.com',
        'visa',
        1
      );
      expect(result.amount).toBe(19.90);
    });

    it('premium plan should cost R$ 99.90', async () => {
      const result = await paymentsModule.createCardPayment(
        'premium',
        'token',
        'user@example.com',
        'visa',
        1
      );
      expect(result.amount).toBe(99.90);
    });

    it('familia plan should cost R$ 249.90', async () => {
      const result = await paymentsModule.createCardPayment(
        'familia',
        'token',
        'user@example.com',
        'visa',
        1
      );
      expect(result.amount).toBe(249.90);
    });
  });

  describe('getPlanDetails', () => {
    it('should return details for essencial plan', () => {
      const plan = paymentsModule.getPlanDetails('essencial');
      expect(plan).toBeDefined();
      expect(plan?.name).toBe('Memorial Essencial');
      expect(plan?.price).toBe(1990);
      expect(plan?.description).toContain('10 fotos');
    });

    it('should return details for premium plan', () => {
      const plan = paymentsModule.getPlanDetails('premium');
      expect(plan).toBeDefined();
      expect(plan?.name).toBe('Memorial Premium');
      expect(plan?.price).toBe(9990);
      expect(plan?.description).toContain('ilimitada');
    });

    it('should return details for familia plan', () => {
      const plan = paymentsModule.getPlanDetails('familia');
      expect(plan).toBeDefined();
      expect(plan?.name).toBe('Plano Família');
      expect(plan?.price).toBe(24990);
      expect(plan?.description).toContain('5 memoriais');
    });

    it('should return null for invalid plan', () => {
      const plan = paymentsModule.getPlanDetails('invalid');
      expect(plan).toBeNull();
    });
  });

  describe('Currency Handling', () => {
    it('should always use BRL currency for card payments', async () => {
      const result = await paymentsModule.createCardPayment(
        'essencial',
        'token',
        'user@example.com',
        'visa',
        1
      );
      expect(result.currency).toBe('BRL');
    });

    it('should always use BRL currency for PIX payments', async () => {
      const result = await paymentsModule.createPixPayment(
        'essencial',
        'user@example.com',
        'João',
        'Silva',
        '12345678909'
      );
      expect(result.currency).toBe('BRL');
    });
  });

  describe('Payment Transaction Tracking', () => {
    it('should create a payment transaction record', async () => {
      const transactionData = {
        mpPaymentId: 'mp_test_tracking_123',
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

    it('should create PIX transaction with QR code data', async () => {
      const transactionData = {
        mpPaymentId: 'mp_test_pix_123',
        amount: 1990,
        currency: 'brl',
        status: 'pending' as const,
        paymentMethod: 'pix' as const,
        customerEmail: 'pix@example.com',
        planId: 'essencial',
        pixQrCode: '00020126580014br.gov.bcb.pix...',
        pixQrCodeBase64: 'iVBORw0KGgoAAAANSUhEUg...',
        pixExpirationDate: new Date(Date.now() + 30 * 60 * 1000),
      };

      const transactionId = await paymentsModule.createPaymentTransaction(transactionData);
      expect(transactionId).toBeDefined();

      const transaction = await paymentsModule.getPaymentTransaction('mp_test_pix_123');
      expect(transaction?.pixQrCode).toBeDefined();
      expect(transaction?.pixQrCodeBase64).toBeDefined();
      expect(transaction?.pixExpirationDate).toBeDefined();
    });

    it('should update payment transaction status', async () => {
      const transactionData = {
        mpPaymentId: 'mp_test_update_123',
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
        paymentsModule.updatePaymentTransactionStatus('mp_test_update_123', 'succeeded')
      ).resolves.not.toThrow();

      // Verify the update by retrieving
      const transaction = await paymentsModule.getPaymentTransaction('mp_test_update_123');
      expect(transaction?.status).toBe('succeeded');
    });

    it('should update payment transaction with failure reason', async () => {
      const transactionData = {
        mpPaymentId: 'mp_test_failed_123',
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
        'mp_test_failed_123',
        'failed',
        'cc_rejected_insufficient_amount'
      );

      const transaction = await paymentsModule.getPaymentTransaction('mp_test_failed_123');
      expect(transaction?.status).toBe('failed');
      expect(transaction?.failureReason).toBe('cc_rejected_insufficient_amount');
    });

    it('should retrieve payment transaction by Mercado Pago payment ID', async () => {
      const transactionData = {
        mpPaymentId: 'mp_test_retrieve_123',
        amount: 9990,
        currency: 'brl',
        status: 'succeeded' as const,
        paymentMethod: 'card' as const,
        customerEmail: 'premium@example.com',
        planId: 'premium',
      };

      const createdId = await paymentsModule.createPaymentTransaction(transactionData);

      const retrieved = await paymentsModule.getPaymentTransaction('mp_test_retrieve_123');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(createdId);
      expect(retrieved?.mpPaymentId).toBe('mp_test_retrieve_123');
      expect(retrieved?.amount).toBe(9990);
      expect(retrieved?.planId).toBe('premium');
    });

    it('should return null for non-existent payment transaction', async () => {
      const transaction = await paymentsModule.getPaymentTransaction('mp_test_nonexistent');
      expect(transaction).toBeNull();
    });

    it('should store payment transaction metadata as JSON string', async () => {
      const metadata = { orderId: '12345', campaignId: 'summer2024' };
      const transactionData = {
        mpPaymentId: 'mp_test_metadata_123',
        amount: 1990,
        currency: 'brl',
        status: 'pending' as const,
        paymentMethod: 'card' as const,
        customerEmail: 'test@example.com',
        planId: 'essencial',
        metadata,
      };

      await paymentsModule.createPaymentTransaction(transactionData);

      const transaction = await paymentsModule.getPaymentTransaction('mp_test_metadata_123');
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

    it('should create subscription with Mercado Pago customer and subscription IDs', async () => {
      const subscriptionData = {
        userId: 2,
        userType: 'funeral_home' as const,
        planId: 'familia',
        mpCustomerId: 'mp_cus_test123',
        mpSubscriptionId: 'mp_sub_test123',
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
    it('should create card payment and transaction together', async () => {
      const planId = 'premium';
      const customerEmail = 'integration@example.com';

      // Create card payment (which now also creates transaction)
      const payment = await paymentsModule.createCardPayment(
        planId,
        'card_token_integration',
        customerEmail,
        'visa',
        1
      );

      expect(payment.id).toBeDefined();

      // Verify transaction was created
      const transaction = await paymentsModule.getPaymentTransaction(payment.id);

      expect(transaction).toBeDefined();
      expect(transaction?.mpPaymentId).toBe(payment.id);
      expect(transaction?.amount).toBe(9990);
      expect(transaction?.planId).toBe('premium');
      expect(transaction?.status).toBe('succeeded');
    });

    it('should create PIX payment and transaction together', async () => {
      const planId = 'essencial';
      const customerEmail = 'pix-integration@example.com';

      // Create PIX payment (which also creates transaction)
      const payment = await paymentsModule.createPixPayment(
        planId,
        customerEmail,
        'João',
        'Silva',
        '12345678909'
      );

      expect(payment.id).toBeDefined();
      expect(payment.pixQrCode).toBeDefined();

      // Verify transaction was created with PIX data
      const transaction = await paymentsModule.getPaymentTransaction(payment.id);

      expect(transaction).toBeDefined();
      expect(transaction?.mpPaymentId).toBe(payment.id);
      expect(transaction?.pixQrCode).toBeDefined();
      expect(transaction?.pixQrCodeBase64).toBeDefined();
    });

    it('should update transaction status when checking payment status', async () => {
      // Create a card payment
      const payment = await paymentsModule.createCardPayment(
        'essencial',
        'card_token_status',
        'status@example.com',
        'visa',
        1
      );

      // Check status (which should update database)
      const status = await paymentsModule.getPaymentStatus(payment.id);

      expect(status.id).toBe(payment.id);

      // Verify database was updated
      const transaction = await paymentsModule.getPaymentTransaction(payment.id);
      expect(transaction).toBeDefined();
      expect(transaction?.status).toBeDefined();
    });
  });
});
