import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Item Actions Component
 * Provides remove, save for later, and notes actions
 */
const ItemActions = ({
  onRemove,
  onSaveForLater,
  onAddNote,
  itemName,
  hasNote = false,
  showSaveForLater = true,
}) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');

  const handleRemove = () => {
    // Direct removal - cart management hook already shows toast notification
    onRemove();
  };

  const handleSaveNote = () => {
    if (onAddNote) {
      onAddNote(note);
      setShowNoteInput(false);
    }
  };

  const handleCancelNote = () => {
    setNote('');
    setShowNoteInput(false);
  };

  return (
    <div className="cart-item-actions">
      {showNoteInput ? (
        <div className="cart-item-note-input-container">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            className="cart-item-note-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveNote();
              } else if (e.key === 'Escape') {
                handleCancelNote();
              }
            }}
            aria-label="Item note"
          />
          <button
            type="button"
            onClick={handleSaveNote}
            className="cart-item-note-btn cart-item-note-btn-save"
            aria-label="Save note"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancelNote}
            className="cart-item-note-btn cart-item-note-btn-cancel"
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
              className="cart-item-action-btn cart-item-action-btn-note touch-manipulation"
              aria-label={hasNote ? 'Edit note' : 'Add note'}
              title={hasNote ? 'Edit note' : 'Add note'}
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
              className="cart-item-action-btn cart-item-action-btn-save touch-manipulation"
              aria-label={`Save ${itemName} for later`}
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
            className="cart-remove-btn touch-manipulation"
            aria-label={`Remove ${itemName} from cart`}
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

ItemActions.propTypes = {
  onRemove: PropTypes.func.isRequired,
  onSaveForLater: PropTypes.func,
  onAddNote: PropTypes.func,
  itemName: PropTypes.string.isRequired,
  hasNote: PropTypes.bool,
  showSaveForLater: PropTypes.bool,
};

export default ItemActions;

