import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Hero from '../components/Hero';
import Testimonials from '../components/Testimonials';
import AmbienceUploader from '../components/AmbienceUploader';
import SectionTitle from '../components/SectionTitle';
import { supabase } from '../lib/supabase';
import { getQuoteBackgroundUrl } from '../lib/quoteBackgroundHelper';
import { useAuth } from '../contexts/AuthContext';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { getBackgroundStyle } from '../utils/backgroundUtils';
import ExperiencePulse from '../components/ExperiencePulse';
import { pageFade } from '../components/animations/menuAnimations';
import { resolveLoyaltyState, resolveReferralInfo } from '../lib/loyaltyUtils';
import { logger } from '../utils/logger';

const HIGHLIGHT_FEATURES = [
  {
    title: 'Signature Biryanis',
    tagline: 'Crafted Daily',
    description: 'Slow-cooked in small batches with aged basmati, saffron, and hand-ground spices.',
    statLabel: 'Guest favorites',
    statValue: '1,200+ orders',
    icon: '🍛',
    gradient: 'from-amber-500/90 to-rose-500/90',
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=900',
  },
  {
    title: 'Family Set Menus',
    tagline: 'Balanced & Generous',
    description: 'Curated multi-course spreads that make celebrations effortless for every table size.',
    statLabel: 'Sharing platters served',
    statValue: '3.5k this year',
    icon: '👨‍👩‍👧‍👦',
    gradient: 'from-emerald-500/90 to-teal-500/90',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900',
  },
  {
    title: 'Cozy Café Vibes',
    tagline: 'Designed for Conversation',
    description: 'Warm lighting, modern textures, and acoustic zoning keep every visit relaxed and memorable.',
    statLabel: 'Average dwell time',
    statValue: '78 mins',
    icon: '☕',
    gradient: 'from-slate-500/90 to-indigo-500/90',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900',
  },
];

const HomePage = () => {
  const { user, isAdmin } = useAuth();
  const { settings, loading: settingsLoading } = useStoreSettings();

  const reviewsEnabled = settings?.show_public_reviews ?? false;
  const testimonialsEnabled = settings?.show_home_testimonials ?? false;
  const showTestimonialsSection = reviewsEnabled && testimonialsEnabled;
  const enableLoyalty = settingsLoading ? false : (settings?.enable_loyalty_program ?? true);

  // State for quote background
  const [quoteBackground, setQuoteBackground] = useState('');

  // Hero images
  const heroImages = [
    { src: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800', alt: 'Biryani dish' },
    { src: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', alt: 'Grilled meat' },
    { src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', alt: 'Café ambience' },
  ];

  // Fetch store settings for quote background
  useEffect(() => {
    let isMounted = true;

    const fetchStoreSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('hero_quote_bg_url')
          .eq('singleton_guard', true)
          .single();

        if (error) {
          logger.error('Error fetching store settings:', error);
          // Use fallback on error
          if (isMounted) {
            setQuoteBackground(getQuoteBackgroundUrl(null));
          }
          return;
        }

        if (isMounted) {
          setQuoteBackground(getQuoteBackgroundUrl(data));
        }
      } catch (error) {
        logger.error('Error in fetchStoreSettings:', error);
        if (isMounted) {
          setQuoteBackground(getQuoteBackgroundUrl(null));
        }
      } finally {
        // no-op
      }
    };

    fetchStoreSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle upload success - refresh background
  const handleUploadSuccess = (newUrl) => {
    setQuoteBackground(newUrl);
  };

  const loyalty = useMemo(() => resolveLoyaltyState(), []);
  const referral = useMemo(() => resolveReferralInfo(user), [user]);

  const handleReferralShare = useCallback(async () => {
    if (!user) {
      return;
    }
    const { shareUrl, code } = resolveReferralInfo(user);

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Star Café Invite',
          text: 'Use my Star Café invite link to unlock bonus treats on your first visit.',
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard?.writeText(shareUrl);
      toast.success('Referral link copied!');
    } catch (error) {
      logger.error('Failed to share referral link:', error);
      try {
        await navigator.clipboard?.writeText(`${shareUrl} (Code: ${code})`);
        toast.success('Copied invite link.');
      } catch (clipboardError) {
        logger.error('Clipboard write failed:', clipboardError);
        toast.error('Unable to copy invite link right now.');
      }
    }
  }, [user]);

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={pageFade}
      className="flex flex-col gap-6 md:gap-8 lg:gap-10"
    >
      {/* Hero */}
      <Hero
        id="hero"
        title="Taste That Shines."
        subtitle="Star Café · Jessore"
        images={heroImages}
        ctaButtons={[
          { label: 'View Full Menu', to: '/menu', variant: 'primary' },
          { label: 'Reserve a Table', to: '/reservations', variant: 'outline' },
        ]}
      />

      {/* Loyalty Snapshot */}
      {enableLoyalty && (
        <section
          id="loyalty"
          data-animate="fade-scale"
          data-animate-active="false"
        >
          <div className="glow-surface glow-strong relative overflow-hidden rounded-2xl sm:rounded-3xl border border-theme bg-[var(--bg-main)] px-4 py-6 sm:px-6 sm:py-7 md:px-10 md:py-9">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.25),transparent_60%)]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 translate-x-1/3 translate-y-1/4 rounded-full bg-accent/25 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 md:gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[var(--accent)]/90">
                Star Rewards
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)] leading-tight">
                {user ? `Hey ${user.email?.split('@')[0] ?? 'there'}, you're already ${loyalty.tier}.` : 'Join Star Rewards, earn treats faster.'}
              </h2>
              <p className="text-sm md:text-base text-[var(--text-main)]/70 max-w-xl leading-relaxed">
                {user
                  ? `Only ${loyalty.pointsToNextTier} points stand between you and ${loyalty.nextTierLabel} perks. Every dine-in, takeaway, or delivery order keeps the momentum going.`
                  : `Earn points every time you dine, unlock chef upgrades, and snag priority tastings. Create an account to start collecting rewards.`}
              </p>
              {user ? (
                <div>
                  <div className="flex items-center gap-3">
                    <div className="relative h-2.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#FDE68A] via-[#FBBF24] to-[#D97706] transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(loyalty.progressPercent, 4))}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--accent)] whitespace-nowrap">
                      {loyalty.projectedPoints} pts
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-main)]/60">
                    +{loyalty.pointsEarnedThisOrder} projected on your next checkout · {loyalty.redeemableRewards.length} rewards ready now
                  </p>
                </div>
              ) : null}
            </div>

            <div className="glow-surface glow-strong flex w-full max-w-sm flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated p-4 sm:p-5 backdrop-blur-sm">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--text-main)]">{referral.headline}</p>
                <p className="text-xs text-[var(--text-main)]/70">
                  {referral.subcopy}
                </p>
              </div>
              {user ? (
                <div>
                  <div className="flex items-center justify-between rounded-xl border border-theme bg-[var(--bg-main)]/30 px-3 py-2">
                    <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-main)]/60">Your code</span>
                    <span className="font-semibold text-[var(--accent)] text-sm">{referral.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReferralShare}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#d6b37b] active:scale-95 min-h-[44px]"
                  >
                    Share Invite Link
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12v7a1 1 0 0 0 1 1h7" />
                      <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
                      <path d="M14 3h7v7" />
                      <path d="m10 14 11-11" />
                    </svg>
                  </button>
                </div>
              ) : (
                <Link
                  to="/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#d6b37b] active:scale-95 min-h-[44px]"
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Highlights */}
      <section
        id="highlights"
        data-animate="fade-scale"
        data-animate-active="false"
      >
        <div
          className="glow-surface glow-strong relative overflow-hidden rounded-2xl sm:rounded-3xl border border-theme bg-[var(--bg-main)] p-6 sm:p-8 md:p-12"
        >
          <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-6 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 text-center md:text-left">
              <span className="inline-flex items-center justify-center rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] sm:text-xs font-medium tracking-[0.25em] sm:tracking-[0.3em] uppercase text-accent">
                Highlights
              </span>
              <h2 className="text-2xl font-semibold sm:text-3xl md:text-4xl lg:text-5xl text-[var(--text-main)] leading-tight">
                Why Star Café Feels Instantly Memorable
              </h2>
              <p className="text-sm text-muted md:text-base max-w-2xl leading-relaxed">
                Signature dishes, generous sharing menus, and a lounge-inspired ambience — all fine-tuned for modern dining without losing the heart of Jessore hospitality.
              </p>
            </div>
            <div className="hidden shrink-0 rounded-full border border-theme bg-theme-elevated px-4 py-3 text-xs uppercase tracking-[0.4em] text-[var(--text-main)]/70 md:flex">
              Est. 2025 · Trusted by locals
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHT_FEATURES.map((card, index) => (
              <article
                key={card.title}
                data-animate="blur-rise"
                data-animate-active="false"
                style={{ transitionDelay: `${index * 120}ms` }}
                className="group glass-panel relative flex flex-col justify-between overflow-hidden p-5 sm:p-6"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(var(--bg-main-rgb),0.85), rgba(var(--bg-main-rgb),0.55)), url(${card.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[var(--bg-main)]/60 opacity-70" />

                <div className="relative z-10 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br ${card.gradient} text-xl sm:text-2xl shadow-lg shadow-black/40`}>
                      {card.icon}
                    </span>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[var(--text-main)]/60">
                        {card.tagline}
                      </p>
                      <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-main)]">
                        {card.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--text-main)]/80">
                    {card.description}
                  </p>
                </div>

                <div className="relative z-10 mt-4 sm:mt-6 flex items-center justify-between rounded-xl sm:rounded-2xl border border-theme bg-theme-elevated px-3 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--text-main)]/70">
                  <span>{card.statLabel}</span>
                  <span className="text-accent">{card.statValue}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ExperiencePulse id="showcase" />

      {/* Ambience Quote with Dynamic Background */}
      <section
        id="quote"
        data-animate="drift-right"
        data-animate-active="false"
        className="relative overflow-hidden min-h-[280px] sm:min-h-[360px] md:min-h-[440px] flex items-center justify-center py-10 sm:py-12 md:py-14 lg:py-16"
        style={
          settings ? getBackgroundStyle(settings, 'hero_quote') : {
            backgroundImage: quoteBackground ? `url(${quoteBackground})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'scroll'
          }
        }
      >
        {/* Gradient Overlay for AA Contrast */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, rgba(var(--bg-main-rgb), 0.5), rgba(var(--bg-main-rgb), 0.65))`
          }}
        />

        {/* Content */}
        <div
          className="relative z-10 max-w-4xl mx-auto text-center space-y-3 sm:space-y-4 px-4"
        >
          <div className="text-accent text-5xl sm:text-6xl md:text-7xl">&quot;</div>
          <p className="text-xl sm:text-2xl md:text-4xl font-semibold italic leading-relaxed" style={{ color: 'var(--text-main)' }}>
            Cozy modern ambience in the heart of Jessore.
          </p>
          <p className="text-sm sm:text-base md:text-lg text-muted">
            A place where good food meets great company
          </p>
        </div>
      </section>

      {/* Ambience Uploader (Admin Controlled via Settings) */}
      {isAdmin && settings?.show_home_ambience_uploader && (
        <section
          id="ambience-uploader"
          data-animate="fade-scale"
          data-animate-active="false"
          className="py-8"
        >
          <AmbienceUploader onUploadSuccess={handleUploadSuccess} />
        </section>
      )}

      {/* Testimonials */}
      {showTestimonialsSection && (
        <section id="testimonials">
          <SectionTitle
            eyebrow="Testimonials"
            title="What Our Customers Say"
            subtitle="Real reviews from real people who love Star Café"
            align="center"
          />
          <Testimonials />
        </section>
      )}

      {/* Reserve CTA Band */}
      <section
          id="cta"
          data-animate="fade-scale"
          data-animate-active="false"
          className="glow-surface glow-strong relative overflow-hidden rounded-2xl sm:rounded-3xl border border-theme bg-[var(--bg-main)] px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12 shadow-xl shadow-black/20"
        >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(var(--text-main-rgb),0.1),_transparent_55%)] opacity-70" />
        <div className="pointer-events-none absolute -bottom-20 -right-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-3 sm:space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-accent">
              Reserve Your Table
            </span>
            <h3 className="text-xl sm:text-2xl font-semibold text-[var(--text-main)] md:text-3xl leading-tight">
              Planning a family dinner or small event? Book your table in a few seconds.
            </h3>
            <p className="text-sm text-[var(--text-main)]/70 leading-relaxed">
              Tell us your date, time, and party size — we&apos;ll handle the rest.
            </p>
          </div>

          <div className="glow-surface glow-strong flex flex-col items-start gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-theme bg-theme-elevated px-5 py-5 sm:px-6 sm:py-6 backdrop-blur-sm lg:items-end lg:px-8 lg:py-7">
            <p className="text-sm text-[var(--text-main)]/70 text-left lg:text-right leading-relaxed">
              One-click reservations with instant confirmation to your inbox.
            </p>
            <Link
              to="/reservations"
              className="btn-primary whitespace-nowrap px-6 py-3 text-sm sm:text-base min-h-[44px]"
            >
              Reserve a Table
            </Link>
          </div>
        </div>
      </section>
    </motion.main>
  );
};

export default HomePage;
