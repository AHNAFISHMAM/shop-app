/**
 * API Client
 * 
 * Base API client for standardized request/response handling.
 * Provides interceptors, error handling, and request/response transformation.
 */

import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

/**
 * API Response Type
 * 
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {*} data - Response data
 * @property {Error|null} error - Error object if request failed
 * @property {string} message - Human-readable message
 */

/**
 * API Client Configuration
 * 
 * @typedef {Object} ApiConfig
 * @property {string} baseUrl - Base URL for API requests
 * @property {Object} headers - Default headers
 * @property {number} timeout - Request timeout in milliseconds
 * @property {Function} onError - Global error handler
 */

/**
 * Default API configuration
 */
const defaultConfig = {
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * API Client Class
 * 
 * Provides standardized API request handling with interceptors,
 * error handling, and request/response transformation.
 */
class ApiClient {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.interceptors = {
      request: [],
      response: [],
      error: [],
    };
  }

  /**
   * Add request interceptor
   * 
   * @param {Function} interceptor - Interceptor function
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   * 
   * @param {Function} interceptor - Interceptor function
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Add error interceptor
   * 
   * @param {Function} interceptor - Interceptor function
   */
  addErrorInterceptor(interceptor) {
    this.interceptors.error.push(interceptor);
  }

  /**
   * Execute request interceptors
   * 
   * @param {Object} config - Request config
   * @returns {Object} Modified config
   */
  async executeRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    
    return modifiedConfig;
  }

  /**
   * Execute response interceptors
   * 
   * @param {*} response - Response data
   * @returns {*} Modified response
   */
  async executeResponseInterceptors(response) {
    let modifiedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    
    return modifiedResponse;
  }

  /**
   * Execute error interceptors
   * 
   * @param {Error} error - Error object
   * @returns {Error} Modified error
   */
  async executeErrorInterceptors(error) {
    let modifiedError = error;
    
    for (const interceptor of this.interceptors.error) {
      modifiedError = await interceptor(modifiedError);
    }
    
    return modifiedError;
  }

  /**
   * Get authentication headers
   * 
   * @returns {Promise<Object>} Headers with auth token
   */
  async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { ...this.config.headers };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // Use anon key for guest users
      headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
    }
    
    return headers;
  }

  /**
   * Make a GET request
   * 
   * @param {string} url - Request URL
   * @param {Object} config - Request config
   * @returns {Promise<ApiResponse>} API response
   */
  async get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }

  /**
   * Make a POST request
   * 
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} config - Request config
   * @returns {Promise<ApiResponse>} API response
   */
  async post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  }

  /**
   * Make a PUT request
   * 
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} config - Request config
   * @returns {Promise<ApiResponse>} API response
   */
  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  /**
   * Make a PATCH request
   * 
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} config - Request config
   * @returns {Promise<ApiResponse>} API response
   */
  async patch(url, data, config = {}) {
    return this.request({ ...config, method: 'PATCH', url, data });
  }

  /**
   * Make a DELETE request
   * 
   * @param {string} url - Request URL
   * @param {Object} config - Request config
   * @returns {Promise<ApiResponse>} API response
   */
  async delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }

  /**
   * Make an API request
   * 
   * @param {Object} config - Request config
   * @returns {Promise<ApiResponse>} API response
   */
  async request(config) {
    try {
      // Execute request interceptors
      const modifiedConfig = await this.executeRequestInterceptors(config);
      
      // Get auth headers
      const headers = await this.getAuthHeaders();
      
      // Build full URL
      const baseUrl = this.config.baseUrl || import.meta.env.VITE_SUPABASE_URL;
      const url = modifiedConfig.url.startsWith('http')
        ? modifiedConfig.url
        : `${baseUrl}${modifiedConfig.url}`;
      
      // Build fetch config
      const fetchConfig = {
        method: modifiedConfig.method || 'GET',
        headers: {
          ...headers,
          ...modifiedConfig.headers,
        },
        signal: modifiedConfig.signal, // For cancellation
      };
      
      // Add body for non-GET requests
      if (modifiedConfig.data && modifiedConfig.method !== 'GET') {
        fetchConfig.body = JSON.stringify(modifiedConfig.data);
      }
      
      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      // Merge signals if both exist
      if (modifiedConfig.signal) {
        // If both signals exist, abort on either
        modifiedConfig.signal.addEventListener('abort', () => controller.abort());
      }
      fetchConfig.signal = controller.signal;
      
      const response = await fetch(url, fetchConfig);
      clearTimeout(timeoutId);
      
      // Parse response
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Check for errors
      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      // Execute response interceptors
      const modifiedResponse = await this.executeResponseInterceptors(data);
      
      return {
        success: true,
        data: modifiedResponse,
        error: null,
        message: 'Request successful',
      };
    } catch (error) {
      // Execute error interceptors
      const modifiedError = await this.executeErrorInterceptors(error);
      
      // Log error
      logger.error('API request failed:', modifiedError);
      
      return {
        success: false,
        data: null,
        error: modifiedError,
        message: modifiedError.message || 'Request failed',
      };
    }
  }
}

/**
 * Create API client instance
 * 
 * @param {ApiConfig} config - API client configuration
 * @returns {ApiClient} API client instance
 */
export function createApiClient(config = {}) {
  return new ApiClient(config);
}

/**
 * Export ApiClient class
 */
export { ApiClient };

/**
 * Default API client instance
 */
export const apiClient = createApiClient();

/**
 * Add default interceptors
 */

// Request interceptor: Add timestamp
apiClient.addRequestInterceptor((config) => {
  return {
    ...config,
    timestamp: Date.now(),
  };
});

// Response interceptor: Log successful requests
apiClient.addResponseInterceptor((response) => {
  logger.debug('API request successful:', response);
  return response;
});

// Error interceptor: Handle common errors
apiClient.addErrorInterceptor((error) => {
  if (error.name === 'AbortError') {
    error.message = 'Request timeout';
  }
  return error;
});

export default apiClient;
