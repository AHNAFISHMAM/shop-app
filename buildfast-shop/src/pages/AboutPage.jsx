import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SectionTitle from '../components/SectionTitle';
import GalleryCard from '../components/GalleryCard';
import { parseEffects, parseEffectVariants } from '../utils/effects';
import { supabase } from '../lib/supabase';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { getBackgroundStyle } from '../utils/backgroundUtils';
import { pageFade } from '../components/animations/menuAnimations';
import { logger } from '../utils/logger';

const AboutPage = () => {
  // Store settings for backgrounds
  const { settings } = useStoreSettings();

  // State for dynamic gallery cards from database
  const [galleryCards, setGalleryCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ourValues = [
    {
      title: 'Quality',
      description: 'We use fresh ingredients and maintain consistent taste in every dish we serve.',
    },
    {
      title: 'Hospitality',
      description: 'Respectful, attentive service that makes every guest feel welcomed and valued.',
    },
    {
      title: 'Authenticity',
      description: 'Traditional recipes prepared with care, honoring the flavors of our heritage.',
    },
  ];

  const purposeHighlights = [
    {
      title: 'Purpose',
      description:
        'Craft memorable dining moments with honest flavors, thoughtful service, and a space that feels like home.',
    },
    {
      title: 'Promise',
      description:
        'Blend tradition with modern comfort so every visit feels warm, reliable, and worth sharing.',
    },
  ];

  // Fetch gallery cards from database
  useEffect(() => {
    let isMounted = true;

    const fetchGalleryCards = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('gallery_cards')
          .select('*')
          .eq('is_active', true)
          .order('position', { ascending: true });

        if (error) {
          logger.error('Error fetching gallery cards:', error);
          if (isMounted) {
            setGalleryCards([]);
            setError(`Database error: ${error.message}`);
          }
          return;
        }

        if (isMounted) {
          setGalleryCards(data || []);
          if (!data || data.length === 0) {
            setError('No active gallery cards found. Please add cards in the admin panel.');
          }
        }
      } catch (error) {
        logger.error('Error in fetchGalleryCards:', error);
        if (isMounted) {
          setGalleryCards([]);
          setError(`Failed to load gallery: ${error.message}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGalleryCards();

    // Real-time subscription for gallery updates
    const channel = supabase
      .channel('public:gallery_cards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_cards'
        },
        () => {
          fetchGalleryCards();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <motion.main
      className="space-y-20"
      variants={pageFade}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Hero */}
      <section
        data-animate="fade-scale"
        data-animate-active="false"
        className="glow-surface glow-strong relative overflow-hidden rounded-2xl sm:rounded-3xl border border-theme bg-gradient-to-br from-accent/10 via-background to-accent/5 py-12 sm:py-14 md:py-16 shadow-lg"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="hero-container relative text-center space-y-4 sm:space-y-6 px-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-xs tracking-[0.2em] uppercase text-accent">
            About Star Café
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
            The Story of Star Café
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            A modern café and restaurant in Jessore, focused on consistent taste, comfort, and hospitality.
          </p>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-3xl mx-auto">
            {purposeHighlights.map((item, index) => (
              <div
                key={item.title}
                data-animate="fade-rise"
                data-animate-active="false"
                style={{ transitionDelay: `${index * 120}ms` }}
                className="glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl border border-theme bg-background/70 backdrop-blur p-4 sm:p-5 text-left shadow-lg"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
                <div className="relative space-y-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-accent">{item.title}</h3>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section>
        <div
          data-animate="drift-left"
          data-animate-active="false"
          className="glow-surface glow-strong relative mt-8 overflow-hidden rounded-2xl sm:rounded-[32px] border border-theme bg-gradient-to-br from-accent/10 via-background to-accent/5 p-6 sm:p-8 md:p-10 shadow-xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
          <div className="relative space-y-8">
            <div className="text-center space-y-2 sm:space-y-3">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.35em] text-accent/80">Guiding Principles</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
                Our Values
              </h2>
              <p className="text-sm md:text-base text-muted leading-relaxed">
                The principles that guide everything we do
              </p>
              <p className="mx-auto max-w-2xl text-sm text-muted md:text-base leading-relaxed">
                One promise: every guest feels at home while savoring honest flavors crafted with care.
              </p>
            </div>
            <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {ourValues.map((value, index) => (
                <div
                  key={value.title}
                  data-animate="blur-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 120}ms` }}
                  className="group glow-surface glow-soft relative overflow-hidden rounded-xl sm:rounded-2xl border border-theme-subtle bg-background/60 p-5 sm:p-6 shadow-md transition-colors duration-300 hover:border-accent/30 hover:bg-background/80"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_65%)] opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgba(255,255,255,0.05),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative space-y-3">
                    <span className="inline-flex items-center rounded-full bg-accent/15 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-accent/80">
                      {value.title}
                    </span>
                    <p className="text-sm text-muted leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery with Dynamic Hover Effects */}
      <section
        data-animate="drift-right"
        data-animate-active="false"
        className="glow-surface glow-strong relative overflow-hidden py-10 sm:py-12 px-4 -mx-4 rounded-2xl sm:rounded-3xl border border-theme bg-gradient-to-br from-accent/10 via-background to-accent/5 shadow-inner"
        style={settings ? getBackgroundStyle(settings, 'gallery_section') : {}}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
        <SectionTitle
          title="Experience Our Space"
          subtitle="Hover to see our café transform"
          align="center"
        />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div
              className="max-w-md mx-auto p-6 rounded-xl border"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm mb-2" style={{ color: '#ef4444' }}>Gallery Loading Error</p>
              <p className="text-xs text-muted">{error}</p>
            </div>
          </div>
        ) : galleryCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
            {galleryCards.map((card, index) => {
              const baseEffects = parseEffects(card.effect);
              const variantSequence = parseEffectVariants(card.effect_variants, baseEffects);

              return (
                <div
                  key={card.id}
                  data-animate="fade-scale"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <GalleryCard
                    defaultImage={card.default_image_url}
                    hoverImage={card.hover_image_url}
                    effect={baseEffects}
                    effectVariants={variantSequence}
                    alt={`Star Café ambience ${card.position}`}
                    caption={card.caption || `Ambience ${card.position}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted">No gallery images available at the moment.</p>
          </div>
        )}
        <div
          data-animate="fade-scale"
          data-animate-active="false"
          className="glow-surface glow-strong mt-8 sm:mt-12 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-accent/15 via-background to-background/60 p-6 sm:p-8 text-center shadow-lg backdrop-blur"
        >
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <a
              href="/menu"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base md:text-lg font-semibold text-background shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.05] hover:shadow-xl min-h-[44px]"
            >
              Explore the Menu
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-accent/60 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base md:text-lg font-semibold text-accent shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.05] hover:border-accent hover:text-accent/90 min-h-[44px]"
            >
              Plan an Event
            </a>
          </div>
        </div>
      </section>
    </motion.main>
  );
};

export default AboutPage;
