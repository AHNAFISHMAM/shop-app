export function createMessageClearer(
  setMessage: (message: string | null) => void,
  setMessageType?: ((type: string) => void) | null,
  delay?: number
): { clear: () => void; scheduleClear: () => void };

export function setMessageWithAutoClear(
  setMessage: (message: string | null) => void,
  setMessageType: (type: string) => void,
  message: string,
  type?: string,
  delay?: number
): () => void;

