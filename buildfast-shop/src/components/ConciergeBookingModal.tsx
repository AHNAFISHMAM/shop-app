import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import ReservationForm from './ReservationForm';
import { createReservation } from '../lib/reservationService';
import { getReservationSettings } from '../lib/reservationSettingsService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { Button } from './ui/button';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import * as React from 'react';

/**
 * ConciergeBookingModal Component
 * 
 * A fully accessible modal for concierge table bookings with reservation form,
 * settings display, and proper focus management. Meets WCAG 2.2 AA standards.
 * 
 * @example
 * ```tsx
 * <ConciergeBookingModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
export interface ConciergeBookingModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Callback when modal is closed
   */
  onClose: () => void;
}

interface ReservationSettings {
  opening_time: string;
  closing_time: string;
  max_party_size: number;
  min_party_size: number;
  operating_days: number[];
  allow_same_day_booking: boolean;
  advance_booking_days: number;
}

interface ReservationFormData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  requests?: string;
  occasion?: string;
  preference?: string;
}

const defaultSettings: ReservationSettings = {
  opening_time: '11:00:00',
  closing_time: '23:00:00',
  max_party_size: 20,
  min_party_size: 1,
  operating_days: [0, 1, 2, 3, 4, 5, 6],
  allow_same_day_booking: true,
  advance_booking_days: 30,
};

const ConciergeBookingModal: React.FC<ConciergeBookingModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReservationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Body scroll lock
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;

    const fetchSettings = async () => {
      setLoading(true);
      const result = await getReservationSettings();
      if (result.success && result.data) {
        setSettings({ ...defaultSettings, ...result.data });
      }
      setLoading(false);
    };

    fetchSettings();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && closeButtonRef.current) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSubmit = async (data: ReservationFormData) => {
    setSubmitting(true);

    try {
      const result = await createReservation({
        userId: user?.id || null,
        customerName: data.name,
        customerEmail: data.email || user?.email || '',
        customerPhone: data.phone,
        reservationDate: data.date,
        reservationTime: data.time,
        partySize: parseInt(String(data.guests), 10),
        specialRequests: data.requests || null,
        occasion: data.occasion || null,
        tablePreference: data.preference || null,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `🎉 Table reserved for ${data.guests} on ${data.date} at ${formatTime(data.time)}.`,
        { duration: 5000 },
      );

      onClose();
    } catch (error) {
      logger.error('Concierge booking error:', error);
      toast.error('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Ensure we can render at body level (SSR safety)
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="concierge-booking-title"
      aria-describedby="concierge-booking-description"
      style={{
        backgroundColor: 'var(--modal-backdrop)'
      }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-5xl flex-col rounded-3xl border border-[var(--border-default)] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-main)',
          maxHeight: 'min(88vh, 720px)',
          boxShadow: 'var(--modal-shadow)'
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Fixed Header with Close Button - Mobile-First Design */}
        <div 
          className="sticky top-0 z-[100] flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-main)]/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
          style={{
            // Ensure header stays above content
            position: 'sticky',
            top: 0,
            // Create new stacking context
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        >
          {/* Title */}
          <div className="flex-1 min-w-0 pr-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-1.5 hidden sm:inline-flex">
              Reserve Instantly
            </div>
            <h2 
              id="concierge-booking-title" 
              className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight truncate"
            >
              Book Your Table
            </h2>
            <p 
              id="concierge-booking-description" 
              className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)]/80 mt-0.5 hidden sm:block"
            >
              Share your dining details below for immediate confirmation and seamless handoff to our host team.
            </p>
          </div>

          {/* Close Button - Always visible and accessible */}
          <Button
            type="button"
            onClick={onClose}
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            className="flex-shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-[var(--bg-main)]/90 backdrop-blur-sm border border-[var(--border-default)] hover:bg-[var(--bg-hover)] shadow-md transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            style={{ 
              pointerEvents: 'auto',
              // Ensure button is above all content
              position: 'relative',
              zIndex: 101
            }}
            aria-label="Close booking modal"
          >
            <svg 
              className="w-5 h-5 text-[var(--text-main)]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* Scrollable content - Below header */}
        <div 
          data-overlay-scroll 
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 md:px-10 pb-6 sm:pb-8 pt-4 sm:pt-6"
          style={{
            WebkitOverflowScrolling: 'touch',
            // Ensure content scrolls below header
            position: 'relative',
            zIndex: 1
          }}
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:gap-8">
            {/* Mobile-only badge and description */}
            <div className="space-y-3 text-center sm:hidden">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                Reserve Instantly
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Share your dining details below for immediate confirmation and seamless handoff to our host team.
              </p>
            </div>

            <div className="w-full max-w-2xl mx-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]" />
                </div>
              ) : (
                <ReservationForm onSubmit={handleSubmit} disabled={submitting} className="!bg-transparent !border-0 !shadow-none p-0" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal at document.body level using Portal
  return createPortal(modalContent, document.body);
};

export default ConciergeBookingModal;

