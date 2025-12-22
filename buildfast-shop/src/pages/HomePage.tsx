import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { m, type Variants } from 'framer-motion';
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
import { useTheme } from '../shared/hooks/use-theme';
import { logger } from '../utils/logger';

/**
 * Highlight Feature Interface
 */
interface HighlightFeature {
  title: string;
  tagline: string;
  description: string;
  statLabel: string;
  statValue: string;
  icon: string;
  gradient: string; // CSS gradient string
  image: string;
}

/**
 * Hero Image Interface
 */
interface HeroImage {
  src: string;
  alt: string;
}

const HIGHLIGHT_FEATURES: HighlightFeature[] = [
  {
    title: 'Signature Biryanis',
    tagline: 'Crafted Daily',
    description: 'Slow-cooked in small batches with aged basmati, saffron, and hand-ground spices.',
    statLabel: 'Guest favorites',
    statValue: '1,200+ orders',
    icon: '🍛',
    gradient: 'linear-gradient(to bottom right, rgba(var(--color-amber-rgb), 0.9), rgba(var(--color-rose-rgb), 0.9))',
    image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=900',
  },
  {
    title: 'Family Set Menus',
    tagline: 'Balanced & Generous',
    description: 'Curated multi-course spreads that make celebrations effortless for every table size.',
    statLabel: 'Sharing platters served',
    statValue: '3.5k this year',
    icon: '👨‍👩‍👧‍👦',
    gradient: 'linear-gradient(to bottom right, rgba(var(--color-emerald-rgb), 0.9), rgba(var(--color-blue-rgb), 0.9))',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900',
  },
  {
    title: 'Cozy Café Vibes',
    tagline: 'Designed for Conversation',
    description: 'Warm lighting, modern textures, and acoustic zoning keep every visit relaxed and memorable.',
    statLabel: 'Average dwell time',
    statValue: '78 mins',
    icon: '☕',
    gradient: 'linear-gradient(to bottom right, rgba(var(--color-blue-rgb), 0.9), rgba(var(--color-purple-rgb), 0.9))',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900',
  },
];

/**
 * HomePage Component
 * 
 * Main landing page featuring hero section, loyalty program, highlights,
 * testimonials, and reservation CTA. Fully accessible and WCAG 2.1 AA compliant.
 * 
 * @remarks
 * - Uses design system CSS variables
 * - Mobile-first responsive design
 * - Supports reduced motion preferences
 * - All touch targets meet 44px minimum
 */
const HomePage = memo(() => {
  const { user, isAdmin } = useAuth();
  const { settings, loading: settingsLoading } = useStoreSettings();
  const isLightTheme = useTheme();

  const reviewsEnabled = useMemo(
    () => settings?.show_public_reviews ?? false,
    [settings?.show_public_reviews]
  );
  const testimonialsEnabled = useMemo(
    () => settings?.show_home_testimonials ?? false,
    [settings?.show_home_testimonials]
  );
  const showTestimonialsSection = useMemo(
    () => reviewsEnabled && testimonialsEnabled,
    [reviewsEnabled, testimonialsEnabled]
  );
  const enableLoyalty = useMemo(
    () => settingsLoading ? false : (settings?.enable_loyalty_program ?? true),
    [settingsLoading, settings?.enable_loyalty_program]
  );

  // State for quote background
  const [quoteBackground, setQuoteBackground] = useState<string>('');

  // Reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Hero images
  const heroImages: HeroImage[] = useMemo(() => [
    { src: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800', alt: 'Biryani dish' },
    { src: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', alt: 'Grilled meat' },
    { src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', alt: 'Café ambience' },
  ], []);

  // Reduced motion observer
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    
    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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
      }
    };

    fetchStoreSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle upload success - refresh background
  const handleUploadSuccess = useCallback((newUrl: string) => {
    setQuoteBackground(newUrl);
  }, []);

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

  // Animation variants with reduced motion support
  const animationVariants: Variants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
      };
    }
    return pageFade;
  }, [prefersReducedMotion]);

  return (
    <m.main
      initial="hidden"
      animate="visible"
      variants={animationVariants}
      className="flex flex-col gap-6 md:gap-8 lg:gap-10"
      style={{ 
        pointerEvents: 'auto',
        // Add padding to match .app-container spacing (prevents sections from touching viewport edges)
        paddingLeft: 'clamp(1rem, 3vw, 3.5rem)',
        paddingRight: 'clamp(1rem, 3vw, 3.5rem)',
        // Ensure no overflow constraints that break positioning
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      }}
      role="main"
      aria-label="Home page"
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
          aria-labelledby="loyalty-heading"
        >
          <div className="glow-surface glow-strong relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border-default)] bg-[var(--bg-main)] px-4 py-6 sm:px-6 sm:py-7 md:px-10 md:py-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.25),transparent_60%)]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 translate-x-1/3 translate-y-1/4 rounded-full bg-[var(--accent)]/25 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 md:gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 max-w-2xl">
                <span 
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-3 py-1 text-sm font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[var(--accent)]/90 min-h-[44px]"
                  role="status"
                  aria-label="Star Rewards badge"
                >
                  Star Rewards
                </span>
                <h2 id="loyalty-heading" className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--text-main)] leading-tight">
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
                      <div className="relative h-2.5 flex-1 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={loyalty.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Loyalty progress">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                          style={{ 
                            width: `${Math.min(100, Math.max(loyalty.progressPercent, 4))}%`,
                            background: `linear-gradient(to right, var(--color-amber), var(--color-orange), var(--color-amber))`
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-[var(--accent)] whitespace-nowrap">
                        {loyalty.projectedPoints} pts
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-main)]/60">
                      +{loyalty.pointsEarnedThisOrder} projected on your next checkout · {loyalty.redeemableRewards.length} rewards ready now
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="glow-surface glow-strong flex w-full max-w-sm flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 sm:p-5 backdrop-blur-sm">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--text-main)]">{referral.headline}</p>
                  <p className="text-sm text-[var(--text-main)]/70">
                    {referral.subcopy}
                  </p>
                </div>
                {user ? (
                  <div>
                    <div className="flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-main)]/30 px-3 py-2">
                      <span className="text-sm uppercase tracking-[0.2em] text-[var(--text-main)]/60">Your code</span>
                      <span className="font-semibold text-[var(--accent)] text-sm">{referral.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReferralShare}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent)]/90 active:scale-95 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                      aria-label="Share referral invite link"
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
                        aria-hidden="true"
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent)]/90 active:scale-95 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                    aria-label="Create account to join Star Rewards"
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
        aria-labelledby="highlights-heading"
      >
        <div
          className="glow-surface glow-strong relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border-default)] bg-[var(--bg-main)] p-6 sm:p-8 md:p-12"
        >
          <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[var(--accent)]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-6 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3 text-center md:text-left">
              <span 
                className="inline-flex items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1 text-sm font-medium tracking-[0.25em] sm:tracking-[0.3em] uppercase text-[var(--accent)] min-h-[44px]"
                role="status"
                aria-label="Highlights badge"
              >
                Highlights
              </span>
              <h2 id="highlights-heading" className="text-2xl font-semibold sm:text-3xl md:text-4xl lg:text-5xl text-[var(--text-main)] leading-tight">
                Why Star Café Feels Instantly Memorable
              </h2>
              <p className="text-sm text-[var(--text-secondary)] md:text-base max-w-2xl leading-relaxed">
                Signature dishes, generous sharing menus, and a lounge-inspired ambience — all fine-tuned for modern dining without losing the heart of Jessore hospitality.
              </p>
            </div>
            <div className="hidden shrink-0 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3 text-sm uppercase tracking-[0.4em] text-[var(--text-main)]/70 md:flex min-h-[44px]">
              Est. 2025 · Trusted by locals
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHT_FEATURES.map((card) => (
              <article
                key={card.title}
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
                    <span 
                      className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-xl sm:text-2xl shadow-lg shadow-black/40"
                      style={{ background: card.gradient }}
                      aria-hidden="true"
                    >
                      {card.icon}
                    </span>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-sm font-medium uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[var(--text-main)]/60">
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

                <div className="relative z-10 mt-4 sm:mt-6 flex items-center justify-between rounded-xl sm:rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 sm:px-4 sm:py-3 text-sm uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--text-main)]/70 min-h-[44px]">
                  <span>{card.statLabel}</span>
                  <span className="text-[var(--accent)]">{card.statValue}</span>
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
        aria-labelledby="quote-heading"
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
          <div className="text-[var(--accent)] text-5xl sm:text-6xl md:text-7xl" aria-hidden="true">&quot;</div>
          <p id="quote-heading" className="text-xl sm:text-2xl md:text-4xl font-semibold italic leading-relaxed" style={{ color: 'var(--text-main)' }}>
            Cozy modern ambience in the heart of Jessore.
          </p>
          <p className="text-sm sm:text-base md:text-lg text-[var(--text-secondary)]">
            A place where good food meets great company
          </p>
        </div>
      </section>

      {/* Ambience Uploader (Admin Controlled via Settings) */}
      {isAdmin && settings?.show_home_ambience_uploader && (
        <section
          id="ambience-uploader"
          className="py-8"
          aria-labelledby="ambience-uploader-heading"
        >
          <h2 id="ambience-uploader-heading" className="sr-only">Ambience Uploader</h2>
          <AmbienceUploader onUploadSuccess={handleUploadSuccess} />
        </section>
      )}

      {/* Testimonials */}
      {showTestimonialsSection && (
        <section id="testimonials" aria-labelledby="testimonials-heading">
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
        className="glow-surface glow-soft relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border-default)] bg-[var(--bg-main)] px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12 shadow-xl shadow-black/20"
        aria-labelledby="cta-heading"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(var(--text-main-rgb),0.1),_transparent_55%)] opacity-70" />
        <div className="pointer-events-none absolute -bottom-20 -right-24 h-64 w-64 rounded-full bg-[var(--accent)]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-3 sm:space-y-4">
            <span 
              className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-[var(--accent)] min-h-[44px]"
              role="status"
              aria-label="Reserve Your Table badge"
            >
              Reserve Your Table
            </span>
            <h3 id="cta-heading" className="text-xl sm:text-2xl font-semibold text-[var(--text-main)] md:text-3xl leading-tight">
              Planning a family dinner or small event? Book your table in a few seconds.
            </h3>
            <p className="text-sm text-[var(--text-main)]/70 leading-relaxed">
              Tell us your date, time, and party size — we&apos;ll handle the rest.
            </p>
          </div>

          <div className="glow-surface glow-soft flex flex-col items-start gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-5 py-5 sm:px-6 sm:py-6 backdrop-blur-sm lg:items-end lg:px-8 lg:py-7">
            <p className="text-sm text-[var(--text-main)]/70 text-left lg:text-right leading-relaxed">
              One-click reservations with instant confirmation to your inbox.
            </p>
            <Link
              to="/reservations"
              className="btn-primary whitespace-nowrap px-6 py-3 text-sm sm:text-base min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              aria-label="Reserve a table at Star Café"
            >
              Reserve a Table
            </Link>
          </div>
        </div>
      </section>
    </m.main>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage;

