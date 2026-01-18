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
});
