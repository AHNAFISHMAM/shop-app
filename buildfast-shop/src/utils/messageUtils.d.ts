/**
 * Type declarations for message utilities
 */
export interface MessageClearer {
  clear: () => void;
  scheduleClear: () => void;
}

export function createMessageClearer(
  setMessage: (message: string | null) => void,
  setMessageType?: ((type: string) => void) | null,
  delay?: number
): MessageClearer;

export function setMessageWithAutoClear(
  setMessage: (message: string | null) => void,
  setMessageType: (type: string) => void,
  message: string,
  type?: 'success' | 'error',
  delay?: number
): () => void;

