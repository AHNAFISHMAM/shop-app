import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import GalleryCard from '../GalleryCard';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  EFFECT_OPTIONS,
  parseEffects,
  parseEffectVariants,
  MAX_EFFECTS_PER_ROUND,
} from '../../utils/effects';

const GalleryCardDetailModal = ({
  card,
  isOpen,
  onClose,
  uploading,
  handleImageUpload,
  updateEffect,
  toggleActive,
  moveCard,
  deleteCard,
  index,
  totalCards,
}) => {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const focusableElementsRef = useRef([]);
  
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
  // Watch for theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const checkTheme = () => {
      setIsLightTheme(document.documentElement.classList.contains('theme-light'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const node = dialogRef.current;
    if (!node) return;

    focusableElementsRef.current = Array.from(
      node.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    );

    const firstFocusable = focusableElementsRef.current[0];
    const lastFocusable = focusableElementsRef.current[focusableElementsRef.current.length - 1];

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab' || focusableElementsRef.current.length === 0) return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    node.addEventListener('keydown', handleKeyDown);

    return () => {
      node.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  const hoverEffectOptions = EFFECT_OPTIONS;
  const roundTitles = ['First hover', 'Second hover', 'Third hover'];

  const baseEffects = useMemo(() => parseEffects(card?.effect), [card?.effect]);
  const [effectRounds, setEffectRounds] = useState(() => parseEffectVariants(card?.effect_variants, baseEffects));

  useEffect(() => {
    setEffectRounds(parseEffectVariants(card?.effect_variants, baseEffects));
  }, [card?.effect_variants, baseEffects]);

  const commitRounds = useCallback(
    (nextRounds) => {
      if (card?.id) {
        updateEffect(card.id, nextRounds);
      }
      return parseEffectVariants(nextRounds, baseEffects);
    },
    [card?.id, updateEffect, baseEffects],
  );

  const updateRound = (roundIndex, updater) => {
    setEffectRounds((previous) => {
      const next = previous.map((round, index) => {
        if (index !== roundIndex) return round;
        return updater(round);
      });
      return commitRounds(next);
    });
  };

  const handleAddEffectToRound = (roundIndex, value) => {
    if (!value) return;
    updateRound(roundIndex, (round) => {
      if (round.includes(value) || round.length >= MAX_EFFECTS_PER_ROUND) return round;
      return [...round, value];
    });
  };

  const handleRemoveEffectFromRound = (roundIndex, effectIndex) => {
    updateRound(roundIndex, (round) => round.filter((_, idx) => idx !== effectIndex));
  };

  const handleMoveEffectWithinRound = (roundIndex, effectIndex, direction) => {
    updateRound(roundIndex, (round) => {
      const target = effectIndex + direction;
      if (target < 0 || target >= round.length) return round;
      const copy = [...round];
      [copy[effectIndex], copy[target]] = [copy[target], copy[effectIndex]];
      return copy;
    });
  };

  const handleClearRound = (roundIndex) => {
    updateRound(roundIndex, () => []);
  };

  const roundSummaries = useMemo(() => {
    return effectRounds.map((round, idx) => {
      const labels = round
        .map((value) => hoverEffectOptions.find((opt) => opt.value === value)?.label ?? value)
        .join(' + ');
      if (idx > 0) {
        const currentKey = round.join('|');
        const previousKey = effectRounds[idx - 1]?.join('|') ?? '';
        if (currentKey === previousKey) {
          return labels ? `Same as previous round (${labels})` : 'Same as previous round';
        }
      }
      return labels || 'No animations configured';
    });
  }, [effectRounds, hoverEffectOptions]);

  if (!card || !isOpen) return null;

  const updatedAtLabel = formatDistanceToNow(new Date(card.updated_at || card.created_at), { addSuffix: true });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10"
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[26px] border border-theme"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(5, 5, 9, 0.95)',
          boxShadow: isLightTheme 
            ? '0 32px 120px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
            : '0 32px 120px rgba(0, 0, 0, 0.55)'
        }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`gallery-card-${card.id}-heading`}
        aria-describedby={`gallery-card-${card.id}-content`}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="flex items-center justify-between bg-gradient-to-br from-[rgba(197,157,95,0.16)] via-[rgba(8,10,14,0.94)] to-[rgba(6,8,12,0.9)] px-7 py-6 backdrop-blur">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/35 bg-[var(--accent)]/8 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              Gallery card
            </span>
            <div>
              <h3 id={`gallery-card-${card.id}-heading`} className="text-2xl font-semibold tracking-tight text-[var(--text-main)]">
                Card #{card.position}
              </h3>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">Detailed configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            ref={closeButtonRef}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-theme bg-theme-elevated text-[var(--text-main)]/70 transition hover:-translate-y-[2px] hover:text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#C59D5F]/55"
            aria-label="Close modal"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isLightTheme 
                ? 'rgba(0, 0, 0, 0.08)' 
                : 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '';
            }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-7 pb-8 pt-6 md:px-10 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-[#C59D5F]/30"
          id={`gallery-card-${card.id}-content`}
        >
          <div className="grid gap-10 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-6">
              <div className="flex flex-col gap-5 rounded-[22px] border border-theme bg-[rgba(8,10,14,0.95)] p-6 text-[var(--text-main)]/85 shadow-[0_22px_60px_rgba(0,0,0,0.55)]">
                <div className="overflow-hidden rounded-[20px] border border-theme bg-[rgba(5,5,9,0.92)] shadow-[0_22px_52px_rgba(0,0,0,0.55)]">
                  <GalleryCard
                    defaultImage={card.default_image_url}
                    hoverImage={card.hover_image_url}
                    effect={effectRounds[0]}
                    effectVariants={effectRounds}
                    alt={`Gallery card ${card.position}`}
                    caption={`Card #${card.position} • Gallery showcase`}
                  />
                </div>

                <div className="flex flex-col gap-4 rounded-[18px] border border-theme bg-[rgba(10,12,18,0.9)] px-5 py-4 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/12 text-[var(--accent)]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[0.68rem] uppercase tracking-[0.3em] text-[var(--text-muted)]">Current animation sequence</p>
                      <p className="text-sm font-semibold text-[var(--text-main)]">
                        {roundSummaries
                          .map((summary, idx) => `Round ${idx + 1}: ${summary}`)
                          .join(' | ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-[0.7rem] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    Updated {updatedAtLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-8 text-[var(--text-main)]/85">
              <section className="space-y-4 rounded-[22px] border border-theme bg-[rgba(8,10,14,0.95)] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.5)]">
                <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Media uploads</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-[var(--text-muted)]">
                      Default image
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(card.id, 'default', e)}
                      disabled={uploading[`${card.id}-default`]}
                      className="w-full rounded-xl border border-theme px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"
                      style={{
                        backgroundColor: isLightTheme 
                          ? 'rgba(255, 255, 255, 0.9)' 
                          : 'rgba(5, 5, 9, 0.9)',
                        color: 'var(--text-main)'
                      }}
                    />
                    {uploading[`${card.id}-default`] && (
                      <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Uploading default image...
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-[var(--text-muted)]">
                      Hover image
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleImageUpload(card.id, 'hover', e)}
                      disabled={uploading[`${card.id}-hover`]}
                      className="w-full rounded-xl border border-theme px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"
                      style={{
                        backgroundColor: isLightTheme 
                          ? 'rgba(255, 255, 255, 0.9)' 
                          : 'rgba(5, 5, 9, 0.9)',
                        color: 'var(--text-main)'
                      }}
                    />
                    {uploading[`${card.id}-hover`] && (
                      <p className="flex items-center gap-2 text-xs text-[var(--accent)]">
                        <svg className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Uploading hover image...
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-[22px] border border-theme bg-[rgba(8,10,14,0.95)] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.5)]">
                <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Presentation</h4>
                <p className="text-[0.7rem] uppercase tracking-[0.26em] text-[var(--text-muted)]/75">
                  Configure up to three hover rounds. Guests see Round 1 the first time they hover, Round 2 on the next hover, and so on.
                </p>
                <div className="space-y-5">
                  {effectRounds.map((round, roundIndex) => (
                    <div
                      key={`round-editor-${roundIndex}`}
                      className="rounded-[18px] border border-theme bg-[rgba(10,12,18,0.9)] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[var(--text-muted)]">
                          {roundTitles[roundIndex]}
                        </span>
                        {round.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearRound(roundIndex)}
                            className="rounded-full border border-theme px-3 py-1 text-[0.65rem] uppercase tracking-[0.26em] text-[var(--text-muted)] transition hover:border-rose-400/60 hover:text-rose-200"
                          >
                            Clear round
                          </button>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {round.length === 0 && (
                          <span className="rounded-full border border-dashed border-theme px-3 py-1 text-xs uppercase tracking-[0.26em] text-[var(--text-muted)]">
                            Inherits previous round
                          </span>
                        )}
                        {round.map((value, effectIndex) => {
                          const meta = hoverEffectOptions.find((option) => option.value === value);
                          return (
                            <div
                              key={`${roundIndex}-${value}-${effectIndex}`}
                              className="flex items-center gap-2 rounded-full border border-theme-strong bg-[rgba(12,14,20,0.92)] px-3 py-1 text-xs uppercase tracking-[0.26em] text-[var(--text-main)]/90"
                            >
                              <span>
                                {effectIndex + 1}. {meta?.label ?? value}
                              </span>
                              <div className="flex items-center gap-1 text-[var(--text-muted)]">
                                <button
                                  type="button"
                                  onClick={() => handleMoveEffectWithinRound(roundIndex, effectIndex, -1)}
                                  disabled={effectIndex === 0}
                                  className="rounded-full border border-theme p-1 transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Move animation up"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveEffectWithinRound(roundIndex, effectIndex, 1)}
                                  disabled={effectIndex === round.length - 1}
                                  className="rounded-full border border-theme p-1 transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Move animation down"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEffectFromRound(roundIndex, effectIndex)}
                                  className="rounded-full border border-theme p-1 text-[0.75rem] transition hover:border-rose-400/60 hover:text-rose-300"
                                  aria-label="Remove animation"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {round.length < MAX_EFFECTS_PER_ROUND && (
                        <div className="mt-3 flex items-center gap-3">
                          <select
                            defaultValue=""
                            onChange={(event) => {
                              handleAddEffectToRound(roundIndex, event.target.value);
                              event.target.value = '';
                            }}
                            className="w-full rounded-xl border border-theme bg-[rgba(5,5,9,0.9)] px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#C59D5F]/55"
                          >
                            <option value="">Add animation to this round…</option>
                            {hoverEffectOptions.map((effectOption) => (
                              <option key={`${roundIndex}-${effectOption.value}`} value={effectOption.value}>
                                {effectOption.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <p className="mt-2 text-[0.68rem] uppercase tracking-[0.26em] text-[var(--text-muted)]/80">
                        {roundSummaries[roundIndex] || 'No specific animation — inherits previous hover'}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[0.7rem] uppercase tracking-[0.26em] text-[var(--text-muted)]/75">
                  Sequence summary: {roundSummaries.map((summary, idx) => `Round ${idx + 1}: ${summary}`).join(' | ')}
                </p>
              </section>

              <section className="space-y-4 rounded-[22px] border border-theme bg-[rgba(8,10,14,0.95)] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.5)]">
                <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Actions</h4>
                <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                  <button
                    onClick={() => toggleActive(card.id, card.is_active)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.26em] transition-all duration-200 hover:-translate-y-[2px] ${
                      card.is_active ? 'border-rose-400/60 text-rose-200' : 'border-emerald-400/50 text-emerald-200'
                    }`}
                  >
                    {card.is_active ? 'Hide Card' : 'Activate Card'}
                  </button>
                  <button
                    onClick={() => moveCard(card.id, 'up')}
                    disabled={index === 0}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-theme px-4 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)] transition-all duration-200 hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
                  >
                    Move Up
                  </button>
                  <button
                    onClick={() => moveCard(card.id, 'down')}
                    disabled={index === totalCards - 1}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-theme px-4 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)] transition-all duration-200 hover:-translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0"
                  >
                    Move Down
                  </button>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-400/60 px-4 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-rose-200 transition-all duration-200 hover:-translate-y-[2px]"
                  >
                    Delete
                  </button>
                </div>
              </section>

              <footer className="rounded-[22px] border border-theme bg-[rgba(8,10,14,0.95)] px-6 py-5 text-xs text-[var(--text-muted)] shadow-[0_22px_60px_rgba(0,0,0,0.5)] sm:flex sm:items-center sm:justify-between">
                <div>
                  Last updated{' '}
                  <span className="font-semibold text-[var(--text-main)]">
                    {updatedAtLabel}
                  </span>
                </div>
                <div className="mt-3 flex gap-2 text-[0.65rem] uppercase tracking-[0.32em] sm:mt-0">
                  <span className="rounded-full border border-theme px-2 py-1 text-[var(--text-muted)]">Gallery</span>
                  <span className="rounded-full border border-theme px-2 py-1 text-[var(--text-muted)]">About Page</span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

GalleryCardDetailModal.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string,
    position: PropTypes.number,
    default_image_url: PropTypes.string,
    hover_image_url: PropTypes.string,
    effect: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    effect_variants: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    updated_at: PropTypes.string,
    created_at: PropTypes.string,
    is_active: PropTypes.bool,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  uploading: PropTypes.object.isRequired,
  handleImageUpload: PropTypes.func.isRequired,
  updateEffect: PropTypes.func.isRequired,
  toggleActive: PropTypes.func.isRequired,
  moveCard: PropTypes.func.isRequired,
  deleteCard: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  totalCards: PropTypes.number.isRequired,
};

export default GalleryCardDetailModal;

