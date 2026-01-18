import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as paymentsModule from '~/server/payments';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Payment Service - Stripe Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent for essencial plan', async () => {
      const mockResponse = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 1990,
        currency: 'brl',
        status: 'requires_payment_method',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paymentsModule.createPaymentIntent('essencial', 'user@example.com');

      expect(result.id).toBe('pi_test_123');
      expect(result.amount).toBe(1990);
      expect(result.currency).toBe('brl');
    });

    it('should create a payment intent for premium plan', async () => {
      const mockResponse = {
        id: 'pi_test_456',
        client_secret: 'pi_test_456_secret',
        amount: 9990,
        currency: 'brl',
        status: 'requires_payment_method',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paymentsModule.createPaymentIntent('premium', 'user@example.com');

      expect(result.id).toBe('pi_test_456');
      expect(result.amount).toBe(9990);
      expect(result.currency).toBe('brl');
    });

    it('should create a payment intent for familia plan', async () => {
      const mockResponse = {
        id: 'pi_test_789',
        client_secret: 'pi_test_789_secret',
        amount: 24990,
        currency: 'brl',
        status: 'requires_payment_method',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paymentsModule.createPaymentIntent('familia', 'user@example.com');

      expect(result.id).toBe('pi_test_789');
      expect(result.amount).toBe(24990);
    });

    it('should throw error for invalid plan', async () => {
      await expect(
        paymentsModule.createPaymentIntent('invalid_plan', 'user@example.com')
      ).rejects.toThrow('Plan invalid_plan not found');
    });
  });

  describe('getPaymentIntentStatus', () => {
    it('should get payment intent status', async () => {
      const mockResponse = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 1990,
        currency: 'brl',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paymentsModule.getPaymentIntentStatus('pi_test_123');

      expect(result.id).toBe('pi_test_123');
      expect(result.status).toBe('succeeded');
    });

    it('should handle payment intent requiring payment method', async () => {
      const mockResponse = {
        id: 'pi_test_456',
        status: 'requires_payment_method',
        amount: 9990,
        currency: 'brl',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paymentsModule.getPaymentIntentStatus('pi_test_456');

      expect(result.status).toBe('requires_payment_method');
    });
  });

  describe('Plan Pricing', () => {
    it('essencial plan should cost R$ 19.90', async () => {
      const mockResponse = {
        id: 'pi_essencial',
        client_secret: 'secret',
        amount: 1990,
        currency: 'brl',
        status: 'requires_payment_method',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paymentsModule.createPaymentIntent('essencial', 'user@example.com');
      expect(result.amount).toBe(1990); // 19.90 in cents
    });

    it('premium plan should cost R$ 99.90', async () => {
      const mockResponse = {
        id: 'pi_premium',
        client_secret: 'secret',
        amount: 9990,
        currency: 'brl',
        status: 'requires_payment_method',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paymentsModule.createPaymentIntent('premium', 'user@example.com');
      expect(result.amount).toBe(9990); // 99.90 in cents
    });

    it('familia plan should cost R$ 249.90', async () => {
      const mockResponse = {
        id: 'pi_familia',
        client_secret: 'secret',
        amount: 24990,
        currency: 'brl',
        status: 'requires_payment_method',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paymentsModule.createPaymentIntent('familia', 'user@example.com');
      expect(result.amount).toBe(24990); // 249.90 in cents
    });
  });

  describe('Currency Handling', () => {
    it('should always use BRL currency', async () => {
      const mockResponse = {
        id: 'pi_test',
        client_secret: 'secret',
        amount: 1990,
        currency: 'brl',
        status: 'requires_payment_method',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paymentsModule.createPaymentIntent('essencial', 'user@example.com');
      expect(result.currency).toBe('brl');
    });
  });
});
