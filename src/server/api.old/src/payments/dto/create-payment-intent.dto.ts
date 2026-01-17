export interface CreatePaymentIntentDto {
  amount: number;
  currency?: string;
  paymentMethodType?: 'card' | 'pix' | 'boleto';
  planId?: string;
  customerEmail?: string;
  customerName?: string;
  memorialId?: number;
  isRenewal?: boolean;
}

export interface PaymentIntentResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
  // PIX specific
  pix_qr_code?: string;
  pix_qr_code_expires_at?: string;
  // Boleto specific
  boleto_url?: string;
  boleto_barcode?: string;
  boleto_expires_at?: string;
}

export interface ConfirmPaymentDto {
  paymentIntentId: string;
}
