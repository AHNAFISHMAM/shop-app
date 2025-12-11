import { useState } from 'react';
import { motion } from 'framer-motion';
import ConciergeBookingModal from '../components/ConciergeBookingModal';
import ContactInfo from '../components/ContactInfo';
import SectionTitle from '../components/SectionTitle';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { pageFade } from '../components/animations/menuAnimations';

const ACTION_ITEMS = [
  {
    label: 'Concierge Line',
    title: '+880 1726-367742',
    description: 'Direct host assistance · Immediate seating checks',
    action: 'Call',
    link: {
      href: 'tel:+8801726367742',
    },
  },
  {
    label: 'WhatsApp Desk',
    title: 'Chat With Our Team',
    description: 'Live confirmations · Attach menus & event briefs',
    action: 'Chat',
    link: {
      href: 'https://wa.me/8801726367742',
      target: '_blank',
      rel: 'noreferrer',
    },
  },
  {
    label: 'Concierge Request',
    title: 'Plan An Experience',
    description: 'Reply within 12 hours · Tailored menus & proposals',
    action: 'Start',
    modal: true,
  },
];

const ContactPage = () => {
  const { settings, loading: settingsLoading } = useStoreSettings();
  const enableReservations = settingsLoading ? false : (settings?.enable_reservations ?? true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleConciergeAction = (modal) => {
    if (modal && enableReservations) {
      setIsBookingOpen(true);
    }
  };

  return (
    <motion.main
      className="app-container space-y-16"
      data-animate="fade-scale"
      data-animate-active="false"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <SectionTitle
        eyebrow="Contact"
        title="Reach The Star Café Team"
        subtitle="Connect with us instantly for reservations, catering, or partnership inquiries."
        align="center"
      />

      <div
        className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        data-animate="fade-scale"
        data-animate-active="false"
      >
        {ACTION_ITEMS.filter(item => !item.modal || enableReservations).map(({ label, title, description, action, link, modal }, index) => (
          <div
            key={label}
            data-animate="fade-rise"
            data-animate-active="false"
            style={{ transitionDelay: `${index * 120}ms` }}
            className="group glow-surface glow-soft flex h-full flex-col justify-between gap-6 rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 transition hover:border-accent/50 hover:bg-[var(--bg-hover)] sm:flex-row sm:items-center sm:gap-8"
        >
          <div className="flex flex-col gap-1.5 text-left">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-accent/80">{label}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-semibold" style={{ color: 'var(--text-main)' }}>
                {title}
            </p>
              <p className="text-[10px] sm:text-xs text-muted">{description}</p>
          </div>
            {modal ? (
              <button
                type="button"
                onClick={() => handleConciergeAction(modal)}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 px-6 text-sm font-semibold text-accent transition hover:bg-accent hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
              >
                {action}
              </button>
            ) : (
              <a
                {...link}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 px-6 text-sm font-semibold text-accent transition hover:bg-accent hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {action}
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
        <div
          className="card-soft glow-strong flex h-full flex-col justify-between rounded-xl sm:rounded-2xl border border-theme-subtle bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
          data-animate="drift-left"
          data-animate-active="false"
        >
          <div className="space-y-5">
            <span className="inline-flex w-max items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Concierge Response &lt; 12h
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold" style={{ color: 'var(--text-main)' }}>
              Booking Desk Hours
            </h3>
            <ul className="space-y-3 text-[10px] sm:text-xs text-muted">
              <li className="flex items-center justify-between gap-4 rounded-xl border border-theme-subtle bg-white/[0.03] px-4 sm:px-6 md:px-10 py-3">
                <span>Reservations & Dining</span>
                <span className="text-accent">10:00 – 24:00 BST</span>
              </li>
              <li className="flex items-center justify-between gap-4 rounded-xl border border-theme-subtle bg-white/[0.03] px-4 sm:px-6 md:px-10 py-3">
                <span>Private Events & Catering</span>
                <span className="text-accent">09:00 – 20:00 BST</span>
              </li>
              <li className="flex items-center justify-between gap-4 rounded-xl border border-theme-subtle bg-white/[0.03] px-4 sm:px-6 md:px-10 py-3">
                <span>Partnership & Media</span>
                <span className="text-accent">24h Email Support</span>
              </li>
            </ul>
          </div>
          <p className="mt-6 text-[10px] sm:text-xs text-muted">
            Tell us your ideal date, guest count, and any special touches—we&apos;ll confirm availability and tailored options in your preferred channel.
          </p>
        </div>

        <div
          className="card-soft glow-strong relative overflow-hidden rounded-xl sm:rounded-2xl border border-theme-subtle bg-theme-elevated px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5"
          data-animate="drift-right"
          data-animate-active="false"
        >
          <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-6">
            <div className="space-y-4">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-muted">Guest Praise</p>
              <blockquote className="space-y-4">
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold leading-tight" style={{ color: 'var(--text-main)' }}>
                  "The Star Café team confirmed our corporate dinner in under an hour and curated a bespoke tasting menu
                  that wowed every guest."
                </p>
                <footer className="flex flex-col text-[10px] sm:text-xs text-muted">
                  <span className="font-medium text-accent">Amina Rahman · Event Strategist</span>
                  <span>Five-star Google review · October 2025</span>
                </footer>
              </blockquote>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-accent">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted">4.9 average rating across Google & Facebook partners</p>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-14">
        <div
          data-animate="fade-rise"
          data-animate-active="false"
        >
          <ContactInfo />
        </div>

        <div
          className="card-soft overflow-hidden rounded-3xl border border-theme-subtle bg-theme-elevated"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <div className="relative h-96 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/18 via-transparent to-transparent" />
            <iframe
              title="Star Café at Chitrar Mor"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.6049309340977!2d89.2017357154667!3d23.79587568439361!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fead1e7cf4e0f5%3A0x8f5b6d12143b580d!2sStar%20Caf%C3%A9!5e0!3m2!1sen!2sbd!4v1731244800000!5m2!1sen!2sbd"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex flex-col gap-5 border-t border-theme-subtle px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md space-y-2">
              <h4 className="text-xl sm:text-2xl md:text-3xl font-semibold" style={{ color: 'var(--text-main)' }}>
                Visit Our Café
              </h4>
              <p className="text-[10px] sm:text-xs text-muted">
                Shuvash Chandra Road, moments from Chitrar Mor Plaza. Dedicated valet-ready entrance with evening lighting for effortless arrivals.
              </p>
            </div>
            <a
              className="btn-outline inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap text-sm"
              href="https://www.google.com/maps/dir/?api=1&destination=Chitrar+Mor%2C+Jashore%2C+Bangladesh"
              target="_blank"
              rel="noreferrer"
            >
              Open In Google Maps
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <path d="M5 15 14 6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m6 5 9 0 0 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>
      {enableReservations && (
        <ConciergeBookingModal open={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
      )}
    </motion.main>
  );
};

export default ContactPage;
