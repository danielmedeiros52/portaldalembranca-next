import { Injectable, Logger } from '../framework/nest-like';
import { CreatePaymentIntentDto, PaymentIntentResponse } from './dto/create-payment-intent.dto';

// Plan prices in cents (BRL)
const PLAN_PRICES: Record<string, { price: number; renewalPrice: number; name: string }> = {
  essencial: { price: 1990, renewalPrice: 1990, name: 'Memorial Essencial' },
  premium: { price: 9990, renewalPrice: 2990, name: 'Memorial Premium' },
  familia: { price: 24990, renewalPrice: 5990, name: 'Plano Família' },
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('PaymentsService');
  private readonly stripeSecret = process.env.STRIPE_SECRET_KEY;
  private readonly stripeApiUrl = 'https://api.stripe.com/v1';

  /**
   * Make a request to Stripe API
   */
  private async stripeRequest(endpoint: string, body: URLSearchParams, method: string = 'POST'): Promise<any> {
    if (!this.stripeSecret) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const response = await fetch(`${this.stripeApiUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: method !== 'GET' ? body.toString() : undefined,
    });

    const data = await response.json() as any;

    if (!response.ok) {
      this.logger.error(`Stripe API error: ${JSON.stringify(data)}`);
      throw new Error(data.error?.message || 'Stripe request failed');
    }

    return data;
  }

  /**
   * Create a PaymentIntent for card payments
   */
  async createCardPaymentIntent(dto: CreatePaymentIntentDto): Promise<PaymentIntentResponse> {
    this.logger.log(`Creating card payment intent for plan: ${dto.planId}`);

    const plan = dto.planId ? PLAN_PRICES[dto.planId] : null;
    const amount = plan 
      ? (dto.isRenewal ? plan.renewalPrice : plan.price)
      : dto.amount;

    if (!this.stripeSecret) {
      // Return mock for development without Stripe key
      return {
        id: 'pi_mock_' + Date.now(),
        amount,
        currency: dto.currency || 'brl',
        status: 'requires_payment_method',
        client_secret: 'pi_mock_secret_' + Date.now(),
      };
    }

    const body = new URLSearchParams({
      'amount': amount.toString(),
      'currency': dto.currency || 'brl',
      'automatic_payment_methods[enabled]': 'true',
    });

    if (dto.customerEmail) {
      body.append('receipt_email', dto.customerEmail);
    }

    if (plan) {
      body.append('description', `${plan.name} - Portal da Lembrança`);
      body.append('metadata[plan_id]', dto.planId!);
    }

    if (dto.memorialId) {
      body.append('metadata[memorial_id]', dto.memorialId.toString());
    }

    const intent = await this.stripeRequest('/payment_intents', body);

    return {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      client_secret: intent.client_secret,
    };
  }

  /**
   * Create a PaymentIntent for PIX payments
   */
  async createPixPaymentIntent(dto: CreatePaymentIntentDto): Promise<PaymentIntentResponse> {
    this.logger.log(`Creating PIX payment intent for plan: ${dto.planId}`);

    const plan = dto.planId ? PLAN_PRICES[dto.planId] : null;
    const amount = plan 
      ? (dto.isRenewal ? plan.renewalPrice : plan.price)
      : dto.amount;

    if (!this.stripeSecret) {
      // Return mock for development without Stripe key
      return {
        id: 'pi_mock_pix_' + Date.now(),
        amount,
        currency: 'brl',
        status: 'requires_action',
        client_secret: 'pi_mock_secret_' + Date.now(),
        pix_qr_code: '00020126580014br.gov.bcb.pix0136mock-pix-key',
        pix_qr_code_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    }

    // Create PaymentIntent with PIX payment method
    const body = new URLSearchParams({
      'amount': amount.toString(),
      'currency': 'brl',
      'payment_method_types[]': 'pix',
    });

    if (dto.customerEmail) {
      body.append('receipt_email', dto.customerEmail);
    }

    if (plan) {
      body.append('description', `${plan.name} - Portal da Lembrança`);
      body.append('metadata[plan_id]', dto.planId!);
    }

    if (dto.memorialId) {
      body.append('metadata[memorial_id]', dto.memorialId.toString());
    }

    const intent = await this.stripeRequest('/payment_intents', body);

    // Confirm the PaymentIntent to generate PIX QR Code
    const confirmBody = new URLSearchParams({
      'payment_method_data[type]': 'pix',
    });

    const confirmedIntent = await this.stripeRequest(
      `/payment_intents/${intent.id}/confirm`,
      confirmBody
    );

    // Extract PIX data from the confirmed intent
    const pixAction = confirmedIntent.next_action?.pix_display_qr_code;

    return {
      id: confirmedIntent.id,
      amount: confirmedIntent.amount,
      currency: confirmedIntent.currency,
      status: confirmedIntent.status,
      client_secret: confirmedIntent.client_secret,
      pix_qr_code: pixAction?.data || pixAction?.image_url_png,
      pix_qr_code_expires_at: pixAction?.expires_at 
        ? new Date(pixAction.expires_at * 1000).toISOString()
        : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Create a PaymentIntent for Boleto payments
   */
  async createBoletoPaymentIntent(dto: CreatePaymentIntentDto): Promise<PaymentIntentResponse> {
    this.logger.log(`Creating Boleto payment intent for plan: ${dto.planId}`);

    const plan = dto.planId ? PLAN_PRICES[dto.planId] : null;
    const amount = plan 
      ? (dto.isRenewal ? plan.renewalPrice : plan.price)
      : dto.amount;

    if (!this.stripeSecret) {
      // Return mock for development without Stripe key
      return {
        id: 'pi_mock_boleto_' + Date.now(),
        amount,
        currency: 'brl',
        status: 'requires_action',
        client_secret: 'pi_mock_secret_' + Date.now(),
        boleto_url: 'https://stripe.com/boleto/mock',
        boleto_barcode: '23793.38128 60000.000003 00000.000400 1 84340000009990',
        boleto_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    // Create PaymentIntent with Boleto payment method
    const body = new URLSearchParams({
      'amount': amount.toString(),
      'currency': 'brl',
      'payment_method_types[]': 'boleto',
    });

    if (dto.customerEmail) {
      body.append('receipt_email', dto.customerEmail);
    }

    if (plan) {
      body.append('description', `${plan.name} - Portal da Lembrança`);
      body.append('metadata[plan_id]', dto.planId!);
    }

    if (dto.memorialId) {
      body.append('metadata[memorial_id]', dto.memorialId.toString());
    }

    const intent = await this.stripeRequest('/payment_intents', body);

    // Confirm the PaymentIntent to generate Boleto
    // Note: Boleto requires customer tax_id (CPF/CNPJ) - we'll need to collect this
    const confirmBody = new URLSearchParams({
      'payment_method_data[type]': 'boleto',
      'payment_method_data[billing_details][email]': dto.customerEmail || 'cliente@email.com',
      'payment_method_data[billing_details][name]': dto.customerName || 'Cliente',
      'payment_method_data[boleto][tax_id]': '00000000000', // This should come from the customer
    });

    try {
      const confirmedIntent = await this.stripeRequest(
        `/payment_intents/${intent.id}/confirm`,
        confirmBody
      );

      const boletoAction = confirmedIntent.next_action?.boleto_display_details;

      return {
        id: confirmedIntent.id,
        amount: confirmedIntent.amount,
        currency: confirmedIntent.currency,
        status: confirmedIntent.status,
        client_secret: confirmedIntent.client_secret,
        boleto_url: boletoAction?.hosted_voucher_url,
        boleto_barcode: boletoAction?.number,
        boleto_expires_at: boletoAction?.expires_at
          ? new Date(boletoAction.expires_at * 1000).toISOString()
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      // If confirmation fails, return the unconfirmed intent
      // The frontend will need to collect additional data
      return {
        id: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        client_secret: intent.client_secret,
      };
    }
  }

  /**
   * Create payment intent based on payment method type
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto): Promise<PaymentIntentResponse> {
    switch (dto.paymentMethodType) {
      case 'pix':
        return this.createPixPaymentIntent(dto);
      case 'boleto':
        return this.createBoletoPaymentIntent(dto);
      case 'card':
      default:
        return this.createCardPaymentIntent(dto);
    }
  }

  /**
   * Get payment intent status
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntentResponse> {
    if (!this.stripeSecret) {
      return {
        id: paymentIntentId,
        amount: 0,
        currency: 'brl',
        status: 'succeeded',
      };
    }

    const response = await fetch(`${this.stripeApiUrl}/payment_intents/${paymentIntentId}`, {
      headers: {
        'Authorization': `Bearer ${this.stripeSecret}`,
      },
    });

    const intent = await response.json() as any;

    return {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      client_secret: intent.client_secret,
    };
  }

  /**
   * Legacy method for backward compatibility
   */
  async createPaymentIntentLegacy(amount: number, currency: string): Promise<PaymentIntentResponse> {
    return this.createPaymentIntent({
      amount,
      currency,
      paymentMethodType: 'card',
    });
  }
}
