import { useState, useCallback, useMemo } from 'react';

/**
 * ItemActions component props
 */
interface ItemActionsProps {
  /** Callback when item is removed */
  onRemove: () => void;
  /** Optional callback when item is saved for later */
  onSaveForLater?: () => void;
  /** Optional callback when note is added */
  onAddNote?: (note: string) => void;
  /** Item name for accessibility labels */
  itemName: string;
  /** Whether item already has a note */
  hasNote?: boolean;
  /** Whether to show save for later button */
  showSaveForLater?: boolean;
}

/**
 * Item Actions Component
 *
 * Provides remove, save for later, and notes actions for cart items.
 *
 * Features:
 * - Remove item from cart
 * - Save item for later
 * - Add/edit item notes
 * - Keyboard navigation (Enter to save, Escape to cancel)
 * - Accessibility compliant (ARIA, keyboard navigation, 44px touch targets)
 * - Performance optimized (memoized callbacks)
 */
const ItemActions = ({
  onRemove,
  onSaveForLater,
  onAddNote,
  itemName,
  hasNote = false,
  showSaveForLater = true,
}: ItemActionsProps) => {
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');

  const handleRemove = useCallback(() => {
    // Direct removal - cart management hook already shows toast notification
    onRemove();
  }, [onRemove]);

  const handleSaveNote = useCallback(() => {
    if (onAddNote) {
      onAddNote(note);
      setShowNoteInput(false);
      setNote('');
    }
  }, [onAddNote, note]);

  const handleCancelNote = useCallback(() => {
    setNote('');
    setShowNoteInput(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSaveNote();
      } else if (e.key === 'Escape') {
        handleCancelNote();
      }
    },
    [handleSaveNote, handleCancelNote]
  );

  const noteButtonLabel = useMemo(() => (hasNote ? 'Edit note' : 'Add note'), [hasNote]);
  const saveForLaterLabel = useMemo(() => `Save ${itemName} for later`, [itemName]);
  const removeLabel = useMemo(() => `Remove ${itemName} from cart`, [itemName]);

  return (
    <div className="cart-item-actions" role="group" aria-label="Item actions">
      {showNoteInput ? (
        <div className="cart-item-note-input-container" role="group" aria-label="Add note">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="cart-item-note-input min-h-[44px]"
            autoFocus
            onKeyDown={handleKeyDown}
            aria-label="Item note"
            aria-describedby="note-input-help"
          />
          <span id="note-input-help" className="sr-only">
            Press Enter to save or Escape to cancel
          </span>
          <button
            type="button"
            onClick={handleSaveNote}
            className="cart-item-note-btn cart-item-note-btn-save min-h-[44px] min-w-[44px]"
            aria-label="Save note"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancelNote}
            className="cart-item-note-btn cart-item-note-btn-cancel min-h-[44px] min-w-[44px]"
            aria-label="Cancel note"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {onAddNote && (
            <button
              type="button"
              onClick={() => setShowNoteInput(true)}
              className="cart-item-action-btn cart-item-action-btn-note touch-manipulation min-h-[44px] min-w-[44px]"
              aria-label={noteButtonLabel}
              title={noteButtonLabel}
            >
              <svg
                className="cart-item-action-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
          {showSaveForLater && onSaveForLater && (
            <button
              type="button"
              onClick={onSaveForLater}
              className="cart-item-action-btn cart-item-action-btn-save touch-manipulation min-h-[44px] min-w-[44px]"
              aria-label={saveForLaterLabel}
              title="Save for later"
            >
              <svg
                className="cart-item-action-icon"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="cart-remove-btn touch-manipulation min-h-[44px] min-w-[44px]"
            aria-label={removeLabel}
            title="Remove item"
          >
            <svg
              className="cart-remove-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default ItemActions;

