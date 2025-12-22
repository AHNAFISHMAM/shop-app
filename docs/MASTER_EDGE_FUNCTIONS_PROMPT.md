# ⚡ MASTER SUPABASE EDGE FUNCTIONS PROMPT
## Production-Grade Serverless Function Development with Deno

---

## 📋 OVERVIEW

This master prompt provides a comprehensive, systematic approach to implementing Supabase Edge Functions for server-side operations, secure API integrations, and background processing for the **Star Café** application. It covers function structure, TypeScript/Deno patterns, error handling, authentication, client-side integration, webhook handling, and email notifications based on actual codebase implementations.

**Key Features:**
- Deno runtime with JSR imports
- TypeScript with Deno types
- Secure environment variables
- Authentication and authorization
- Error handling and logging
- Client-side invocation patterns
- Webhook handling (Stripe)
- Email notifications (Loops API)
- Background processing
- CORS handling

**Applicable to:**
- Payment processing (Stripe Payment Intents)
- Webhook handlers (Stripe events)
- Email/SMS notifications (Loops API)
- Background job processing
- Secure API integrations
- Data transformation and validation
- Order processing workflows
- Scheduled tasks

---

## 🎯 CORE PRINCIPLES

### 1. **Security First**
- Never expose service role keys to clients
- Always validate webhook signatures
- Use environment variables for all secrets
- Validate all inputs server-side

### 2. **Error Handling**
- Return structured error responses
- Log errors for debugging
- Handle all error cases gracefully
- Use try-catch for all async operations

### 3. **Performance**
- Use async/await for all I/O
- Avoid blocking operations
- Set appropriate timeouts
- Clean up resources properly

### 4. **Client Integration**
- Provide consistent response format
- Handle CORS properly
- Support authentication headers
- Return user-friendly error messages

---

## 🏗️ ARCHITECTURE OVERVIEW

### Edge Function Structure

```
supabase/functions/
  ├── function-name/
  │   ├── index.ts          # Main function entry point
  │   └── README.md         # Function documentation
```

### Runtime Environment

- **Runtime:** Deno (latest stable)
- **Language:** TypeScript
- **HTTP Framework:** `Deno.serve()` (native)
- **Database:** Supabase client (server-side with service role key)
- **Environment:** Isolated, serverless
- **Imports:** JSR (`jsr:@supabase/...`) or ESM (`https://esm.sh/...`)

---

## 🔒 PHASE 1: FUNCTION STRUCTURE

### Step 1.1: Basic Function Template

```typescript
// supabase/functions/function-name/index.ts

// ⚠️ NOTE: @ts-nocheck is acceptable here because:
// 1. Deno runtime types may not be fully compatible with TypeScript strict mode
// 2. Edge Functions use Deno-specific imports (jsr: protocol)
// 3. This is a known limitation when using Supabase Edge Functions with TypeScript
// ✅ For client-side code, avoid @ts-nocheck and fix type issues properly
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
// ✅ CORRECT - Import Database type if available
// import type { Database } from '../types/database'

// ⚠️ SECURITY: Service role key has full database access
// ✅ CORRECT - Only use in Edge Functions, never expose to client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// ✅ CORRECT - Type the Supabase client if Database type is available:
// const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FunctionRequest {
  requiredField: string
  // Define other request fields
}

interface ProcessResult {
  processed: boolean
  // Define result structure
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: FunctionRequest = await req.json();

    // Validate required fields
    if (!body.requiredField) {
      return new Response(
        JSON.stringify({ error: "Missing required field" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Main function logic
    const result = await processRequest(body, supabase);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // ✅ CORRECT - console.error is acceptable in Edge Functions (Deno runtime)
    // Note: For client-side code, use logger utility instead
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ✅ CORRECT - Use proper type instead of 'any'
// If Database type is available, use: SupabaseClient<Database>
async function processRequest(
  data: FunctionRequest, 
  supabase: SupabaseClient
): Promise<ProcessResult> {
  // Function implementation
  return { processed: true };
}
```

### Step 1.2: Real Example - Create Payment Intent

**From `buildfast-shop/supabase/functions/create-payment-intent/index.ts`:**

```typescript
// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentIntentRequest {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, currency = "usd", orderId, customerEmail }: PaymentIntentRequest = await req.json();

    const normalizedAmount = Math.round(Number(amount) * 100);

    // Validate amount
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new Error("Invalid amount");
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: normalizedAmount, // Stripe expects smallest currency unit
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        customerEmail,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
```

**Key Points:**
- Uses `Deno.serve()` instead of `serve()` from std library
- Uses JSR imports for Supabase types
- Uses ESM imports for Stripe
- Validates amount and converts to cents
- Returns structured response with CORS headers
- Handles errors gracefully

---

## 💳 PHASE 2: WEBHOOK HANDLING

### Step 2.1: Stripe Webhook Handler

**From `buildfast-shop/supabase/functions/stripe-webhook/index.ts`:**

```typescript
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
```

**Key Points:**
- Verifies webhook signature using Stripe SDK
- Handles multiple event types with switch statement
- Updates order status in database
- Calls other Edge Functions for email notifications
- Handles errors without breaking webhook processing
- Uses service role key for database operations

---

## 📧 PHASE 3: EMAIL NOTIFICATIONS

### Step 3.1: Order Confirmation Email (Loops API)

**From `buildfast-shop/supabase/functions/send-order-confirmation/index.ts`:**

```typescript
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
```

**Key Points:**
- Validates API credentials before processing
- Fetches order and order items from database
- Extracts customer name from shipping address
- Uses Loops API for transactional emails
- Only sends simple string values (no arrays/objects)
- Handles errors gracefully
- Returns structured response

---

## 🔐 PHASE 4: AUTHENTICATION & AUTHORIZATION

### Step 4.1: Authenticated Function Pattern

```typescript
// supabase/functions/authenticated-function/index.ts

// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check admin status if needed
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Process authenticated request
    const { data } = await req.json();
    // ✅ CORRECT - Type the data parameter
    const result = await processAdminRequest(data as AdminRequestData, user.id, supabase);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ✅ CORRECT - Define proper types instead of 'any'
interface AdminRequestData {
  // Define admin request data structure
  action: string
  [key: string]: unknown
}

interface AdminProcessResult {
  processed: boolean
  // Define result structure
}

async function processAdminRequest(
  data: AdminRequestData, 
  userId: string, 
  supabase: SupabaseClient
): Promise<AdminProcessResult> {
  // Function implementation
  return { processed: true };
}
```

**Key Points:**
- Extracts Authorization header from request
- Creates Supabase client with user's token
- Verifies user authentication
- Checks admin status if needed
- Returns 401 for missing/invalid auth
- Returns 403 for insufficient permissions

---

## 💻 PHASE 5: CLIENT-SIDE INTEGRATION

### Step 5.1: Edge Function Client Utility

**From `buildfast-shop/src/shared/lib/api-client-edge.js`:**

```javascript
/**
 * API Client for Edge Functions
 * 
 * Specialized API client for Supabase Edge Functions.
 * Provides simplified interface for calling Edge Functions.
 */

import { apiClient } from './api-client';
import { logger } from '../../utils/logger';

/**
 * Edge Function Response Type
 * 
 * @typedef {Object} EdgeFunctionResponse
 * @property {boolean} success - Whether the request was successful
 * @property {*} data - Response data
 * @property {Error|null} error - Error object if request failed
 * @property {string} message - Human-readable message
 */

/**
 * Edge Function Client
 * 
 * Provides a simplified interface for calling Supabase Edge Functions.
 */
class EdgeFunctionClient {
  constructor() {
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL;
  }

  /**
   * Call an Edge Function
   * 
   * @param {string} functionName - Name of the Edge Function
   * @param {*} body - Request body
   * @param {Object} options - Request options
   * @returns {Promise<EdgeFunctionResponse>} Edge Function response
   */
  async invoke(functionName, body = {}, options = {}) {
    try {
      const url = `${this.baseUrl}/functions/v1/${functionName}`;
      
      const response = await apiClient.post(url, body, {
        headers: {
          ...options.headers,
        },
      });
      
      return response;
    } catch (error) {
      logger.error(`Edge Function ${functionName} failed:`, error);
      return {
        success: false,
        data: null,
        error,
        message: error.message || 'Edge Function call failed',
      };
    }
  }

  /**
   * Call an Edge Function with GET method
   * 
   * @param {string} functionName - Name of the Edge Function
   * @param {Object} params - Query parameters
   * @param {Object} options - Request options
   * @returns {Promise<EdgeFunctionResponse>} Edge Function response
   */
  async get(functionName, params = {}, options = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.baseUrl}/functions/v1/${functionName}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url, {
        headers: {
          ...options.headers,
        },
      });
      
      return response;
    } catch (error) {
      logger.error(`Edge Function ${functionName} failed:`, error);
      return {
        success: false,
        data: null,
        error,
        message: error.message || 'Edge Function call failed',
      };
    }
  }
}

/**
 * Edge Function client instance
 */
export const edgeFunctionClient = new EdgeFunctionClient();

export default edgeFunctionClient;
```

### Step 5.2: Using Edge Functions in Components

**From `buildfast-shop/src/pages/Checkout/hooks/useCheckoutOrder.ts`:**

```typescript
import { edgeFunctionClient } from '../../../shared/lib/api-client-edge';
import { logger } from '../../../utils/logger';

// Inside useCheckoutOrder hook:
const handlePlaceOrder = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // ... order creation logic ...

    // Create Stripe Payment Intent
    const paymentResponse = await edgeFunctionClient.invoke('create-payment-intent', {
      amount: Number(grandTotal.toFixed(2)),
      currency: CURRENCY_CODE,
      orderId: orderData.id,
      customerEmail: customerEmail
    });

    if (!paymentResponse.success || !paymentResponse.data?.clientSecret) {
      throw new Error(paymentResponse.message || 'Failed to initialize payment');
    }

    const secret = paymentResponse.data.clientSecret;

    setCreatedOrderId(orderData.id);
    setClientSecret(secret);
    setShowPayment(true);

  } catch (err) {
    logger.error('Error placing order:', err);

    let errorMessage = 'Failed to place order. Please try again.';
    if (err instanceof Error && err.message) {
      errorMessage = err.message;
    } else if (err && typeof err === 'object' && 'code' in err) {
      if (err.code === '42P01') {
        errorMessage = 'Database tables not found. Please run the migration first.';
      } else if (err.code === '42501') {
        errorMessage = 'Permission denied. Please ensure you are logged in.';
      }
    }

    // Handle error display
    setOrderError(errorMessage);
  } finally {
    setPlacingOrder(false);
  }
}, [/* dependencies */]);
```

**Key Points:**
- Uses centralized Edge Function client
- Handles success and error responses
- Provides user-friendly error messages
- Logs errors for debugging
- Updates UI state based on response

---

## 🔄 PHASE 6: ERROR HANDLING & LOGGING

### Step 6.1: Structured Error Handling

```typescript
// supabase/functions/function-name/index.ts

interface FunctionError {
  code: string;
  message: string;
  // ✅ CORRECT - Use unknown instead of any for error details
  // Callers should validate/type-check before using
  details?: unknown;
}

function createErrorResponse(
  error: FunctionError,
  statusCode: number = 500
): Response {
  console.error("Function error:", {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    }),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

// Usage
try {
  // Function logic
} catch (error) {
  if (error instanceof ValidationError) {
    return createErrorResponse({
      code: "VALIDATION_ERROR",
      message: error.message,
      details: error.details,
    }, 400);
  }

  if (error instanceof AuthenticationError) {
    return createErrorResponse({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    }, 401);
  }

  return createErrorResponse({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    details: error.message,
  }, 500);
}
```

### Step 6.2: Error Logging Best Practices

```typescript
// Log errors with context
console.error("Function error:", {
  functionName: "create-payment-intent",
  error: error.message,
  stack: error.stack,
  requestBody: sanitizedRequestBody, // Don't log sensitive data
  timestamp: new Date().toISOString(),
});

// Log successful operations
console.log("Payment intent created:", {
  paymentIntentId: paymentIntent.id,
  amount: paymentIntent.amount,
  currency: paymentIntent.currency,
  orderId: orderId,
});
```

---

## ✅ EDGE FUNCTION CHECKLIST

### Function Structure
- [ ] Uses `Deno.serve()` for HTTP handling
- [ ] Imports edge runtime types (`jsr:@supabase/functions-js/edge-runtime.d.ts`)
- [ ] Handles CORS preflight requests (OPTIONS)
- [ ] Returns structured JSON responses
- [ ] Includes proper TypeScript types/interfaces

### Security
- [ ] Uses environment variables for all secrets
- [ ] Never exposes service role key to client
- [ ] Validates all inputs server-side
- [ ] Verifies webhook signatures (if applicable)
- [ ] Uses service role key for database operations
- [ ] Validates authentication (if required)

### Error Handling
- [ ] Handles all error cases gracefully
- [ ] Returns structured error responses
- [ ] Logs errors for debugging
- [ ] Provides user-friendly error messages
- [ ] Uses try-catch for all async operations

### Client Integration
- [ ] Provides consistent response format
- [ ] Handles CORS properly
- [ ] Supports authentication headers (if needed)
- [ ] Returns appropriate HTTP status codes
- [ ] Includes error details in responses

### Performance
- [ ] Uses async/await for all I/O
- [ ] Avoids blocking operations
- [ ] Sets appropriate timeouts
- [ ] Cleans up resources properly
- [ ] Handles concurrent requests efficiently

---

## 🎯 SUCCESS CRITERIA

### Function Implementation
- ✅ Function deploys successfully
- ✅ Function handles requests correctly
- ✅ Function returns structured responses
- ✅ Function handles errors gracefully
- ✅ Function logs operations appropriately

### Security
- ✅ No secrets exposed in code
- ✅ All inputs validated
- ✅ Webhook signatures verified (if applicable)
- ✅ Authentication verified (if required)
- ✅ Service role key used correctly

### Client Integration
- ✅ Client can invoke function successfully
- ✅ Errors are handled and displayed properly
- ✅ Response format is consistent
- ✅ CORS is handled correctly
- ✅ Authentication works (if required)

### Testing
- ✅ Function tested with valid inputs
- ✅ Function tested with invalid inputs
- ✅ Error cases tested
- ✅ Webhook events tested (if applicable)
- ✅ Integration with client tested

---

## 🚨 COMMON PITFALLS

### ❌ Don't:

1. **Expose Service Role Key**
   ```typescript
   // ❌ WRONG: Never expose service role key to client
   const supabase = createClient(url, serviceRoleKey);
   // Client should use anon key
   ```

2. **Skip Input Validation**
   ```typescript
   // ❌ WRONG: Always validate inputs
   const { amount } = await req.json();
   const paymentIntent = await stripe.paymentIntents.create({ amount });
   ```

3. **Ignore Webhook Signatures**
   ```typescript
   // ❌ WRONG: Always verify webhook signatures
   const event = JSON.parse(body);
   ```

4. **Hardcode Secrets**
   ```typescript
   // ❌ WRONG: Use environment variables
   const apiKey = "sk_live_1234567890";
   ```

5. **Forget CORS Headers**
   ```typescript
   // ❌ WRONG: Always include CORS headers
   return new Response(JSON.stringify(data), { status: 200 });
   ```

6. **Block on Async Operations**
   ```typescript
   // ❌ WRONG: Use async/await
   const result = fetch(url).then(res => res.json());
   ```

### ✅ Do:

1. **Use Environment Variables**
   ```typescript
   // ✅ CORRECT: Use environment variables
   const apiKey = Deno.env.get("STRIPE_SECRET_KEY");
   ```

2. **Validate All Inputs**
   ```typescript
   // ✅ CORRECT: Validate inputs
   const { amount } = await req.json();
   if (!Number.isFinite(amount) || amount <= 0) {
     throw new Error("Invalid amount");
   }
   ```

3. **Verify Webhook Signatures**
   ```typescript
   // ✅ CORRECT: Verify webhook signatures
   const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
   ```

4. **Handle CORS Properly**
   ```typescript
   // ✅ CORRECT: Include CORS headers
   const corsHeaders = {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
   };
   return new Response(JSON.stringify(data), {
     status: 200,
     headers: { ...corsHeaders, "Content-Type": "application/json" },
   });
   ```

5. **Use Async/Await**
   ```typescript
   // ✅ CORRECT: Use async/await
   const response = await fetch(url);
   const data = await response.json();
   ```

6. **Return Structured Responses**
   ```typescript
   // ✅ CORRECT: Return structured responses
   return new Response(
     JSON.stringify({ success: true, data: result }),
     {
       status: 200,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     }
   );
   ```

---

## 📚 REFERENCE

### Edge Function Files
- **Create Payment Intent:** `supabase/functions/create-payment-intent/index.ts`
- **Stripe Webhook:** `supabase/functions/stripe-webhook/index.ts`
- **Send Order Confirmation:** `supabase/functions/send-order-confirmation/index.ts`

### Client Integration
- **Edge Function Client:** `src/shared/lib/api-client-edge.js`
- **Checkout Hook:** `src/pages/Checkout/hooks/useCheckoutOrder.ts`

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)
- `SUPABASE_ANON_KEY` - Anonymous key (for authenticated functions)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `LOOPS_API_KEY` - Loops API key
- `LOOPS_TRANSACTIONAL_EMAIL_ID` - Loops transactional email ID

---

## 🔗 RELATED MASTER PROMPTS

- **🗄️ [MASTER_SUPABASE_DATABASE_RLS_PROMPT.md](./MASTER_SUPABASE_DATABASE_RLS_PROMPT.md)** - Database operations in Edge Functions
- **💳 [MASTER_STRIPE_PAYMENT_PROMPT.md](./MASTER_STRIPE_PAYMENT_PROMPT.md)** - Payment processing patterns
- **🛒 [MASTER_ECOMMERCE_DOMAIN_PROMPT.md](./MASTER_ECOMMERCE_DOMAIN_PROMPT.md)** - Order processing workflows
- **🔐 [MASTER_AUTHENTICATION_SECURITY_PROMPT.md](./MASTER_AUTHENTICATION_SECURITY_PROMPT.md)** - Authentication patterns
- **⚠️ [MASTER_ERROR_HANDLING_LOGGING_PROMPT.md](./MASTER_ERROR_HANDLING_LOGGING_PROMPT.md)** - Error handling patterns

---

## 📅 Version History

> **Note:** This section is automatically maintained by the Documentation Evolution System. Each entry documents when, why, and how the documentation was updated based on actual codebase changes.

---

**This prompt ensures all Edge Function operations follow production-ready patterns with proper security, error handling, and client integration.**
