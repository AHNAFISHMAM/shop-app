import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { createReservation } from '../lib/reservationService';
import ReservationModal from '../components/ReservationModal';
import { getReservationSettings } from '../lib/reservationSettingsService';
import { getBackgroundStyle } from '../utils/backgroundUtils';
import { pageFade } from '../components/animations/menuAnimations';
import { logger } from '../utils/logger';

const ReservationsPage = () => {
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [reservationSettings, setReservationSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Feature flags - default to false during loading
  const enableReservations = settingsLoading ? false : (settings?.enable_reservations ?? true);

  // Theme detection
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });

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
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const result = await getReservationSettings();

      if (result.success && result.data) {
        setReservationSettings(result.data);
      } else {
        logger.warn('Reservation settings not found, using defaults');
        setReservationSettings({
          opening_time: '11:00:00',
          closing_time: '23:00:00',
          time_slot_interval: 30,
          max_capacity_per_slot: 50,
          max_party_size: 20,
          min_party_size: 1,
          operating_days: [0, 1, 2, 3, 4, 5, 6],
          allow_same_day_booking: true,
          advance_booking_days: 30,
          enabled_occasions: ['birthday', 'anniversary', 'business', 'date', 'celebration', 'casual'],
          enabled_preferences: ['window', 'quiet', 'bar', 'outdoor', 'any'],
          blocked_dates: [],
          special_notice: null
        });
      }
    } catch (err) {
      logger.error('Error loading reservation settings:', err);
      // Use defaults on error
      setReservationSettings({
        opening_time: '11:00:00',
        closing_time: '23:00:00',
        time_slot_interval: 30,
        max_capacity_per_slot: 50,
        max_party_size: 20,
        min_party_size: 1,
        operating_days: [0, 1, 2, 3, 4, 5, 6],
        allow_same_day_booking: true,
        advance_booking_days: 30,
        enabled_occasions: ['birthday', 'anniversary', 'business', 'date', 'celebration', 'casual'],
        enabled_preferences: ['window', 'quiet', 'bar', 'outdoor', 'any'],
        blocked_dates: [],
        special_notice: null
      });
      toast.error('Failed to load reservation settings. Using defaults.');
    } finally {
      setLoadingSettings(false);
    }
  };
  
  useEffect(() => {
    if (settings && !enableReservations) {
      toast.error('Reservations are currently disabled.');
      navigate('/');
    }
  }, [enableReservations, navigate, settings]);

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getOperatingDaysString = () => {
    if (!reservationSettings) return 'Every day';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const operating = reservationSettings.operating_days || [0, 1, 2, 3, 4, 5, 6];

    if (operating.length === 7) return 'Every day';
    if (operating.length === 0) return 'Closed';

    const weekdays = [1, 2, 3, 4, 5];
    const isWeekdaysOnly = weekdays.every(d => operating.includes(d)) && operating.length === 5;
    if (isWeekdaysOnly) return 'Monday - Friday';

    const weekends = [0, 6];
    const isWeekendsOnly = weekends.every(d => operating.includes(d)) && operating.length === 2;
    if (isWeekendsOnly) return 'Weekends only';

    return operating.map(d => days[d]).join(', ');
  };

  const handleReservationSubmit = async (data) => {
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
        tablePreference: data.preference || null
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `🎉 Table reserved for ${data.guests} on ${data.date} at ${formatTime(data.time)}.`,
        { duration: 5000 }
      );

      logger.log('Reservation created:', result.reservationId);

      setShowInfoModal(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      logger.error('Unexpected error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto"></div>
          <p className="text-muted">Loading reservation system...</p>
        </div>
      </div>
    );
  }

  // Get theme-aware background style from database settings
  const section = `reservation_${theme}`; // 'reservation_dark' or 'reservation_light'
  const backgroundStyle = settings
    ? getBackgroundStyle(settings, section)
    : {}; // Fallback to empty object during loading

  // For the hero overlay, we need to check if it's an image background
  const isImageBackground = backgroundStyle.backgroundImage;
  const heroOverlayStyle = isImageBackground
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), ${backgroundStyle.backgroundImage}`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }
    : backgroundStyle; // Use the background style as-is for solid/gradient

  if (!enableReservations) {
    return (
      <motion.main
        className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]"
        variants={pageFade}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="text-center p-8">
          <h1 className="text-2xl font-semibold text-[var(--text-main)] mb-4">Reservations Unavailable</h1>
          <p className="text-muted mb-6">Reservations are currently disabled.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-lg bg-[#C59D5F] text-black font-semibold hover:bg-[#d6b37b] transition-colors"
          >
            Go to Home
          </button>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main
      className="reservations-page-bg min-h-screen space-y-0 bg-cover bg-center bg-scroll md:bg-fixed"
      style={backgroundStyle}
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div
        className="relative h-[60vh] md:h-[70vh] bg-cover bg-center bg-fixed"
        style={heroOverlayStyle}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-center text-[var(--text-main)] px-4 max-w-4xl mx-auto"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <div
              className="inline-flex items-center gap-2 rounded-full backdrop-blur-md border border-theme-medium px-5 py-2.5 mb-6"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ 
                transitionDelay: '80ms',
                backgroundColor: isLightTheme 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)',
                borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : undefined
              }}
            >
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium uppercase tracking-wider">Reservations</span>
            </div>

            <h1
              className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 tracking-tight"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: '160ms' }}
            >
              Reserve Your Table
            </h1>

            <p
              className="text-[10px] sm:text-xs text-[var(--text-main)] font-light leading-relaxed mb-8"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: '220ms' }}
            >
              Experience exceptional dining at Star Café
            </p>

            <div
              className="flex flex-wrap gap-4 justify-center"
              data-animate="fade-scale"
              data-animate-active="false"
              style={{ transitionDelay: '280ms' }}
            >
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="px-10 py-3 min-h-[44px] rounded-full bg-gradient-to-r from-[var(--accent)]/90 via-[#f6c27a]/80 to-[#f1a95f]/80 text-neutral-900 text-lg font-semibold uppercase tracking-wide shadow-[0_18px_38px_-18px_rgba(255,189,97,0.55)] hover:translate-y-[-1px] hover:shadow-[0_22px_44px_-20px_rgba(255,189,97,0.6)] transition-all inline-flex items-center gap-2 border border-theme focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Reserve Now
              </button>
            </div>
          </div>
        </div>

      </div>

      {reservationSettings?.special_notice && (
        <div
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-black"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <div className="app-container py-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm md:text-base font-medium">{reservationSettings.special_notice}</p>
            </div>
          </div>
        </div>
      )}

      <section className="py-16 bg-gradient-to-b from-transparent to-[rgba(255,255,255,0.02)]">
        <div className="app-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div
              className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl bg-theme-elevated border border-theme px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 hover:border-[var(--accent)]/30 transition-all duration-300"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: '0ms' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent)]/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2">Opening Hours</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--accent)] mb-1">
                  {formatTime(reservationSettings?.opening_time)} - {formatTime(reservationSettings?.closing_time)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted">{getOperatingDaysString()}</p>
              </div>
            </div>

            <div
              className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl bg-theme-elevated border border-theme px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 hover:border-emerald-500/30 transition-all duration-300"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: '120ms' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2">Instant Booking</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-400 mb-1">30 min</p>
                <p className="text-[10px] sm:text-xs text-muted">Confirmation via SMS/Call</p>
              </div>
            </div>

            <div
              className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl bg-theme-elevated border border-theme px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 hover:border-blue-500/30 transition-all duration-300"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: '240ms' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2">Group Size</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400 mb-1">
                  {reservationSettings?.min_party_size || 1} - {reservationSettings?.max_party_size || 20}
                </p>
                <p className="text-[10px] sm:text-xs text-muted">Guests per reservation</p>
              </div>
            </div>

            <div
              className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl bg-theme-elevated border border-theme px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 hover:border-purple-500/30 transition-all duration-300"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: '360ms' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-2">Book Ahead</h3>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-400 mb-1">
                  {reservationSettings?.advance_booking_days || 30} days
                </p>
                <p className="text-[10px] sm:text-xs text-muted">
                  {reservationSettings?.allow_same_day_booking ? 'Same-day available' : 'Book 1 day ahead'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-16 pb-0 bg-transparent">
        <div className="app-container">
          <div
            className="text-center mb-12"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)] mb-4">
              Reservation Policies
            </h2>
            <p className="text-[10px] sm:text-xs text-muted">Everything you need to know before booking</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <div
              className="text-center"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: '0ms' }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)] mb-3">Easy Booking</h3>
              <p className="text-[10px] sm:text-xs text-muted">
                Book online 24/7. {reservationSettings?.allow_same_day_booking ? 'Same-day reservations accepted' : 'Book at least 1 day in advance'}.
                Reserve up to {reservationSettings?.advance_booking_days || 30} days ahead.
              </p>
            </div>

            <div
              className="text-center"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: '140ms' }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)] mb-3">Free Cancellation</h3>
              <p className="text-[10px] sm:text-xs text-muted">
                Cancel or modify your reservation up to 2 hours before your booking time without any charges.
              </p>
            </div>

            <div
              className="text-center"
              data-animate="fade-rise"
              data-animate-active="false"
              style={{ transitionDelay: '280ms' }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)] mb-3">Large Groups</h3>
              <p className="text-[10px] sm:text-xs text-muted">
                For parties larger than {reservationSettings?.max_party_size || 20} guests or special events,
                please call us at <a href="tel:01726-367742" className="text-[var(--accent)] hover:underline">01726-367742</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-y border-theme-subtle">
        <div className="app-container">
          <div
            className="relative overflow-hidden rounded-[32px] border border-theme bg-[var(--bg-main)]/50 px-6 py-12 backdrop-blur-xl md:px-12"
            style={{
              background: `linear-gradient(150deg, rgba(var(--bg-main-rgb), 0.92), rgba(var(--bg-main-rgb), 0.85))`,
              boxShadow: isLightTheme
                ? '0 40px 120px -45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                : '0 40px 120px -45px rgba(0, 0, 0, 0.75)',
              borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : undefined
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,189,97,0.14),rgba(15,17,23,0.2))]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_62%)] opacity-70" />
            <div className="pointer-events-none absolute -top-32 -right-24 h-64 w-64 rounded-full bg-[var(--accent)]/12 blur-3xl" />
            <div className="relative space-y-12">
              <div
                className="text-center space-y-4"
            data-animate="fade-scale"
            data-animate-active="false"
          >
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)]">
                    Why Guests Reserve Early
                  </h2>
                  <p className="text-[10px] sm:text-xs text-[var(--text-main)]/80 max-w-3xl mx-auto">
                    Weekend services routinely fill 48 hours ahead. Locking in your reservation secures preferred seating, celebration add-ons, and concierge follow-up before the dining room reaches capacity.
                  </p>
                </div>

              <div className="relative grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: 'Preferred Seating Guaranteed',
                    description: 'Choose window banquettes, lounge pods, or chef counter seats. Our host assigns your request the moment the booking lands.',
                    stat: '92% fulfilled',
                    accentRing: 'border-emerald-400/50',
                    accentGlow: 'bg-emerald-400/15'
                  },
                  {
                    title: 'Signature Welcome Bite',
                    description: 'Reserved tables receive a complimentary amuse-bouche of smoked aubergine pâté with toasted focaccia plated minutes before arrival.',
                    stat: 'Chef’s courtesy',
                    accentRing: 'border-amber-400/50',
                    accentGlow: 'bg-amber-400/15'
                  },
                  {
                    title: 'Celebration Concierge',
                    description: 'Mention birthdays or anniversaries and we stage sparklers, playlists, and handwritten host cards on cue.',
                    stat: 'Available daily',
                    accentRing: 'border-rose-400/50',
                    accentGlow: 'bg-rose-400/15'
                  }
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className={`relative overflow-hidden rounded-xl sm:rounded-2xl border border-theme-strong bg-[var(--bg-main)]/45 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 backdrop-blur-lg`}
                    data-animate="fade-rise"
                    data-animate-active="false"
                    style={{ 
                      transitionDelay: `${index * 140}ms`,
                      boxShadow: isLightTheme
                        ? '0 32px 120px -50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                        : '0 32px 120px -50px rgba(0, 0, 0, 0.9)',
                      borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : undefined
                    }}
                  >
                    <div className={`absolute -top-24 -right-12 h-36 w-36 rounded-full blur-3xl opacity-70 ${item.accentGlow}`} />
                    <div className="relative space-y-4">
                      <span 
                        className="inline-flex items-center gap-2 rounded-full border border-theme-medium px-4 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-main)]/80"
                        style={{
                          backgroundColor: isLightTheme 
                            ? 'rgba(0, 0, 0, 0.08)' 
                            : 'rgba(255, 255, 255, 0.1)',
                          borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : undefined
                        }}
                      >
                        {item.stat}
                      </span>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)]">{item.title}</h3>
                      <p className="text-[10px] sm:text-xs text-[var(--text-main)]/80 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section 
        className="py-16"
        style={{
          backgroundColor: isLightTheme 
            ? 'rgba(0, 0, 0, 0.02)' 
            : 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <div className="app-container space-y-10">
          <div
            className="text-center space-y-3"
            data-animate="fade-scale"
            data-animate-active="false"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-main)]">Reservation FAQs</h2>
            <p className="text-[10px] sm:text-xs text-muted max-w-2xl mx-auto">
              Sourced from our concierge playbook and the most frequent guest emails answered in 2025.
            </p>
          </div>

          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
            {[
              {
                question: 'How early should I arrive?',
                answer: 'Arrive five minutes before your slot. We hold tables for 15 minutes; after that, the reservation may be reassigned during peak service.'
              },
              {
                question: 'Can I modify my guest count?',
                answer: 'Yes. Use the confirmation email link or call +880 1726-367742 at least two hours prior so the floor team can adjust seating charts.'
              },
              {
                question: 'Do you accommodate dietary needs?',
                answer: 'Absolutely. Note vegetarian, vegan, gluten-free, halal, or allergy requirements in the request field and our kitchen prepares alternatives.'
              },
              {
                question: 'Is there a deposit?',
                answer: 'No deposit is required for parties under 12. Larger celebrations secure a refundable BDT 5,000 advance that applies to the final bill.'
              }
            ].map((item, index) => (
              <div
                key={item.question}
                className="glow-surface glow-soft rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 text-left space-y-3"
                data-animate="fade-rise"
                data-animate-active="false"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)]">{item.question}</h3>
                <p className="text-[10px] sm:text-xs text-[var(--text-main)]/80 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ReservationModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        onSubmit={handleReservationSubmit}
        submitting={submitting}
      />
    </motion.main>
  );
};

export default ReservationsPage;
