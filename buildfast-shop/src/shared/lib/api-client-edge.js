/**
 * API Client for Edge Functions
 *
 * Specialized API client for Supabase Edge Functions.
 * Provides simplified interface for calling Edge Functions.
 */

import { apiClient } from './api-client'
import { logger } from '../../utils/logger'

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
    this.baseUrl = import.meta.env.VITE_SUPABASE_URL
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
      const url = `${this.baseUrl}/functions/v1/${functionName}`

      const response = await apiClient.post(url, body, {
        headers: {
          ...options.headers,
        },
      })

      return response
    } catch (error) {
      logger.error(`Edge Function ${functionName} failed:`, error)
      return {
        success: false,
        data: null,
        error,
        message: error.message || 'Edge Function call failed',
      }
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
      const queryString = new URLSearchParams(params).toString()
      const url = `${this.baseUrl}/functions/v1/${functionName}${queryString ? `?${queryString}` : ''}`

      const response = await apiClient.get(url, {
        headers: {
          ...options.headers,
        },
      })

      return response
    } catch (error) {
      logger.error(`Edge Function ${functionName} failed:`, error)
      return {
        success: false,
        data: null,
        error,
        message: error.message || 'Edge Function call failed',
      }
    }
  }
}

/**
 * Edge Function client instance
 */
export const edgeFunctionClient = new EdgeFunctionClient()

export default edgeFunctionClient
