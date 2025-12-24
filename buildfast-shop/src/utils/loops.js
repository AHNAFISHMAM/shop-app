/**
 * Loops Email Service
 *
 * Handles transactional email sending via Loops API
 */

import { logger } from './logger'

const LOOPS_API_URL = 'https://app.loops.so/api/v1/transactional'
const LOOPS_API_KEY = import.meta.env.VITE_LOOPS_API_KEY
const LOOPS_TRANSACTIONAL_EMAIL_ID = import.meta.env.VITE_LOOPS_TRANSACTIONAL_EMAIL_ID

/**
 * Send order confirmation email via Loops
 *
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.orderId - Order ID
 * @param {number} params.orderTotal - Order total amount
 * @param {Array} params.items - Array of order items
 * @param {Object} params.shippingAddress - Shipping address object
 * @returns {Promise<Object>} Response from Loops API
 */
export async function sendOrderConfirmationEmail({
  email,
  orderId,
  orderTotal,
  // eslint-disable-next-line no-unused-vars
  items = [], // Reserved for future use
  shippingAddress = {},
}) {
  try {
    // Validate required parameters
    if (!email || !orderId || orderTotal === undefined) {
      throw new Error(
        'Missing required email parameters: email, orderId, and orderTotal are required'
      )
    }

    // Validate API credentials
    if (!LOOPS_API_KEY || !LOOPS_TRANSACTIONAL_EMAIL_ID) {
      logger.error('Loops API credentials are not configured. Please check your .env file.')
      throw new Error('Email service is not configured')
    }

    // Extract first name from shipping address
    const firstName = shippingAddress?.fullName?.split(' ')[0] || 'Customer'

    // Prepare email data - ONLY simple string values (Loops doesn't accept arrays/objects)
    const emailData = {
      transactionalId: LOOPS_TRANSACTIONAL_EMAIL_ID,
      email: email,
      dataVariables: {
        // Main variables matching your Loops template
        First_Name: firstName,
        Order_Number: orderId,
        Order_Total: orderTotal.toFixed(2),
      },
    }

    // Send request to Loops API
    const response = await fetch(LOOPS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('Loops API error:', errorData)
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    logger.log('Order confirmation email sent successfully:', result)
    return result
  } catch (error) {
    logger.error('Error sending order confirmation email:', error)
    // Re-throw to allow caller to handle
    throw error
  }
}

/**
 * Test connection to Loops API
 *
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testLoopsConnection() {
  try {
    if (!LOOPS_API_KEY) {
      logger.error('Loops API key is not configured')
      return false
    }

    // Test with a minimal request
    const response = await fetch(LOOPS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionalId: LOOPS_TRANSACTIONAL_EMAIL_ID,
        email: 'test@example.com',
      }),
    })

    return response.ok || response.status === 400 // 400 might indicate missing data variables, but connection works
  } catch (error) {
    logger.error('Loops connection test failed:', error)
    return false
  }
}
