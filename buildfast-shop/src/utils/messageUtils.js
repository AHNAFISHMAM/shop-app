/**
 * Message Utility Functions
 * 
 * Provides consistent message management patterns across the application.
 * Handles auto-clearing messages with timeouts.
 */

/**
 * Create a message clear function with timeout
 * @param {Function} setMessage - State setter for message
 * @param {Function} setMessageType - Optional state setter for message type
 * @param {number} delay - Delay in milliseconds before clearing (default: 5000)
 * @returns {Function} Clear function that can be called to clear immediately
 */
export function createMessageClearer(setMessage, setMessageType = null, delay = 5000) {
  let timeoutId = null;

  const clear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    setMessage(null);
    if (setMessageType) {
      setMessageType('success');
    }
  };

  const scheduleClear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(clear, delay);
  };

  return { clear, scheduleClear };
}

/**
 * Set a message with auto-clear
 * @param {Function} setMessage - State setter for message
 * @param {Function} setMessageType - State setter for message type
 * @param {string} message - Message text
 * @param {string} type - Message type ('success' or 'error')
 * @param {number} delay - Delay in milliseconds before clearing (default: 5000)
 * @returns {Function} Clear function
 */
export function setMessageWithAutoClear(setMessage, setMessageType, message, type = 'success', delay = 5000) {
  setMessage(message);
  setMessageType(type);
  
  const timeoutId = setTimeout(() => {
    setMessage(null);
    setMessageType('success');
  }, delay);

  return () => clearTimeout(timeoutId);
}

