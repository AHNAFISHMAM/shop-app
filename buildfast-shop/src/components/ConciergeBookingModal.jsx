import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import ReservationForm from './ReservationForm';
import { createReservation } from '../lib/reservationService';
import { getReservationSettings } from '../lib/reservationSettingsService';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

const defaultSettings = {
  opening_time: '11:00:00',
  closing_time: '23:00:00',
  max_party_size: 20,
  min_party_size: 1,
  operating_days: [0, 1, 2, 3, 4, 5, 6],
  allow_same_day_booking: true,
  advance_booking_days: 30,
};

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ConciergeBookingModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const closeButtonRef = useRef(null);
  
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
  }, [open]);

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

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const operatingDays = useMemo(() => {
    const operating = settings.operating_days || defaultSettings.operating_days;

    if (operating.length === 7) return 'Every day';
    if (operating.length === 0) return 'Closed';

    const weekdays = [1, 2, 3, 4, 5];
    if (weekdays.every((day) => operating.includes(day)) && operating.length === 5) {
      return 'Monday - Friday';
    }

    const weekends = [0, 6];
    if (weekends.every((day) => operating.includes(day)) && operating.length === 2) {
      return 'Weekends only';
    }

    return operating.map((day) => dayLabels[day]).join(', ');
  }, [settings.operating_days]);

  const handleSubmit = async (data) => {
    setSubmitting(true);

    try {
      const result = await createReservation({
        userId: user?.id || null,
        customerName: data.name,
        customerEmail: data.email || user?.email || '',
        customerPhone: data.phone,
        reservationDate: data.date,
        reservationTime: data.time,
        partySize: parseInt(data.guests, 10),
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="concierge-booking-title"
      aria-describedby="concierge-booking-description"
      style={{
        backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-5xl flex-col rounded-3xl border border-theme"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(5, 5, 9, 0.95)',
          maxHeight: 'min(88vh, 720px)',
          boxShadow: isLightTheme 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          ref={closeButtonRef}
          className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-theme bg-theme-elevated text-muted transition hover:border-theme-medium hover:text-[var(--text-main)]"
          aria-label="Close booking modal"
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div data-overlay-scroll className="flex-1 overflow-y-auto px-6 pb-8 pt-10 md:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)] md:ml-0">
                Reserve Instantly
              </div>
              <h2 id="concierge-booking-title" className="text-3xl font-bold text-[var(--text-main)] md:text-4xl">
                Book Your Table
              </h2>
              <p id="concierge-booking-description" className="text-base text-muted md:text-lg">
                Share your dining details below for immediate confirmation and seamless handoff to our host team.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-5">
                <div className="glow-surface rounded-3xl border border-theme bg-theme-elevated p-5 md:p-6">
                  <h3 className="text-base font-semibold text-[var(--text-main)]">Before you book</h3>
                  <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--text-main)]/70">
                    <li>
                      Reservations available {operatingDays.toLowerCase()} from {formatTime(settings.opening_time)} to{' '}
                      {formatTime(settings.closing_time)}.
                    </li>
                    <li>
                      Online bookings welcome parties of {settings.min_party_size || 1} to {settings.max_party_size || 20}{' '}
                      guests.
                    </li>
                    <li>
                      {settings.allow_same_day_booking
                        ? 'Same-day tables are released throughout the day while seats remain.'
                        : 'For same-day availability, give our team a quick call.'}
                    </li>
                  </ul>
                </div>

                <div className="glow-surface rounded-3xl border border-theme bg-theme-elevated p-5 md:p-6">
                  <h3 className="text-base font-semibold text-[var(--text-main)]">Concierge Highlights</h3>
                  <div className="mt-3 grid gap-3 text-sm text-[var(--text-main)]/70">
                    <p>Personalized seating recommendations and curated menus prepared by our host team.</p>
                    <p>Expect confirmations within 30 minutes during service hours with optional WhatsApp follow-up.</p>
                  </div>
                </div>
              </div>

              <div className="glow-surface rounded-3xl border border-theme bg-white/5 p-4 md:p-6">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-theme-medium border-t-[var(--accent)]" />
                  </div>
                ) : (
                  <ReservationForm onSubmit={handleSubmit} disabled={submitting} className="!bg-transparent !border-0 !shadow-none p-0" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ConciergeBookingModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ConciergeBookingModal;

