// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Loops email configuration
const LOOPS_API_URL = "https://app.loops.so/api/v1/transactional";
const LOOPS_API_KEY = Deno.env.get("LOOPS_API_KEY");
const LOOPS_TRANSACTIONAL_EMAIL_ID = Deno.env.get("LOOPS_TRANSACTIONAL_EMAIL_ID");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  orderId: string;
  email: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate Loops credentials
    if (!LOOPS_API_KEY || !LOOPS_TRANSACTIONAL_EMAIL_ID) {
      throw new Error("Loops API credentials not configured");
    }

    const { orderId, email }: EmailRequest = await req.json();

    if (!orderId || !email) {
      throw new Error("Missing required parameters: orderId and email");
    }

    console.log(`Sending order confirmation email for order: ${orderId} to ${email}`);

    // Fetch order details from database
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !orderData) {
      console.error("Error fetching order:", fetchError);
      throw new Error(`Order not found: ${orderId}`);
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        products (
          name,
          price,
          images
        )
      `)
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
    }

    // Extract first name from shipping address
    const firstName = orderData.shipping_address?.fullName?.split(" ")[0] || "Customer";

    // Prepare email data - ONLY simple string values (Loops doesn't accept arrays/objects)
    const emailPayload = {
      transactionalId: LOOPS_TRANSACTIONAL_EMAIL_ID,
      email: email,
      dataVariables: {
        // Primary variables matching your Loops template
        First_Name: firstName,
        Order_Number: orderId,
        Total_Amount: orderData.order_total.toFixed(2),
      },
    };

    console.log("Sending email to Loops API...", {
      email,
      orderId,
      firstName,
      totalAmount: orderData.order_total.toFixed(2),
    });

    // Send email via Loops
    const response = await fetch(LOOPS_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOOPS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Loops API error:", errorData);
      throw new Error(`Failed to send email: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log("Order confirmation email sent successfully:", result);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order confirmation email sent successfully",
        orderId: orderId,
        result: result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending order confirmation email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
