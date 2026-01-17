import { BadRequestException, Body, Controller, Get, Param, Post } from '../framework/nest-like';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService = new PaymentsService()) {}

  /**
   * Create a payment intent
   * POST /api/payments/intent
   */
  @Post('intent')
  async createPaymentIntent(@Body() payload: CreatePaymentIntentDto) {
    const { amount, planId, paymentMethodType } = payload;

    // Either amount or planId must be provided
    if (!planId && (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0)) {
      throw new BadRequestException('amount must be a positive number or planId must be provided');
    }

    return this.paymentsService.createPaymentIntent(payload);
  }

  /**
   * Create a PIX payment intent
   * POST /api/payments/pix
   */
  @Post('pix')
  async createPixPayment(@Body() payload: CreatePaymentIntentDto) {
    return this.paymentsService.createPixPaymentIntent(payload);
  }

  /**
   * Create a Boleto payment intent
   * POST /api/payments/boleto
   */
  @Post('boleto')
  async createBoletoPayment(@Body() payload: CreatePaymentIntentDto) {
    return this.paymentsService.createBoletoPaymentIntent(payload);
  }

  /**
   * Get payment intent status
   * GET /api/payments/intent/:id
   */
  @Get('intent/:id')
  async getPaymentIntent(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Payment intent ID is required');
    }
    return this.paymentsService.getPaymentIntent(id);
  }
}
