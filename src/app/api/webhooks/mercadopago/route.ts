import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "~/server/payments";

/**
 * Mercado Pago Webhook Handler
 *
 * This endpoint receives notifications from Mercado Pago when payment status changes.
 * It automatically updates the database with the latest payment status.
 *
 * Webhook Configuration:
 * 1. Deploy your application to get a public URL
 * 2. Go to Mercado Pago dashboard: https://www.mercadopago.com.br/developers/panel/app
 * 3. Select your application
 * 4. Go to "Webhooks" section
 * 5. Add webhook URL: https://yourdomain.com/api/webhooks/mercadopago
 * 6. Enable "payment" event notifications
 *
 * Security Note:
 * In production, you should validate the webhook signature to ensure requests
 * are genuinely from Mercado Pago. For now, this implementation assumes
 * the webhook URL is kept private.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Webhook] Received Mercado Pago notification:", JSON.stringify(body, null, 2));

    // Extract notification data
    const { type, data, action } = body;

    // Handle payment notifications
    if (type === "payment" && data?.id) {
      const paymentId = String(data.id);

      console.log(`[Webhook] Processing payment notification - ID: ${paymentId}, Action: ${action}`);

      try {
        // Fetch and update payment status
        const paymentStatus = await getPaymentStatus(paymentId);

        console.log(`[Webhook] Payment ${paymentId} updated to status: ${paymentStatus.status}`);

        // You can add additional logic here, such as:
        // - Sending email notifications
        // - Creating subscriptions on payment approval
        // - Updating memorial access
        // - etc.

        return NextResponse.json({
          success: true,
          paymentId,
          status: paymentStatus.status
        });
      } catch (error) {
        console.error(`[Webhook] Error processing payment ${paymentId}:`, error);

        // Return 200 even on error to prevent Mercado Pago from retrying
        // Log the error for manual investigation
        return NextResponse.json({
          success: false,
          error: "Error processing payment",
          paymentId
        });
      }
    }

    // Handle other notification types if needed
    console.log(`[Webhook] Unhandled notification type: ${type}`);

    return NextResponse.json({
      success: true,
      message: "Notification received but not processed"
    });
  } catch (error) {
    console.error("[Webhook] Error parsing webhook payload:", error);

    // Return 200 to prevent Mercado Pago from retrying on parse errors
    return NextResponse.json({
      success: false,
      error: "Invalid payload"
    }, { status: 200 });
  }
}

/**
 * Handle GET requests for webhook verification
 * Some webhook systems send GET requests to verify the endpoint is active
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Mercado Pago webhook endpoint is active"
  });
}
