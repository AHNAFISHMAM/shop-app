// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "jsr:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

/**
 * Call the send-order-confirmation edge function
 */
async function sendOrderConfirmationEmail(
  email: string,
  orderId: string
) {
  try {
    const emailFunctionUrl = `${supabaseUrl}/functions/v1/send-order-confirmation`;

    console.log(`Calling email function for order ${orderId}`);

    const response = await fetch(emailFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        orderId: orderId,
        email: email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error calling email function:", errorData);
    } else {
      const result = await response.json();
      console.log("Email function called successfully:", result);
    }
  } catch (error) {
    console.error("Error calling email function:", error);
    // Don't throw - we don't want email failures to break the webhook
  }
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();

    // Verify webhook signature
    const event = webhookSecret
      ? stripe.webhooks.constructEvent(body, signature, webhookSecret)
      : JSON.parse(body);

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        const customerEmail = paymentIntent.metadata.customerEmail;

        if (orderId) {
          // Update order status to 'paid'
          const { error } = await supabase
            .from("orders")
            .update({
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (error) {
            console.error("Error updating order:", error);
          }

          // Send order confirmation email via dedicated function
          if (customerEmail) {
            await sendOrderConfirmationEmail(customerEmail, orderId);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          // Update order status to 'failed'
          const { error } = await supabase
            .from("orders")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (error) {
            console.error("Error updating order:", error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
