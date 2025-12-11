import { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const PRODUCT_FEATURES = [
  {
    title: 'Layered Heat Management',
    description: 'Precision searing zones and chilled plating keep every bite perfect from kitchen to table.',
  },
  {
    title: 'Chef-Calibrated Seasons',
    description: 'Seasonal tasting flights rotate monthly so regulars are first to new flavor drops.',
  },
  {
    title: 'Private Lounge Mode',
    description: 'Soft lighting presets and curated playlists adapt instantly for late-night reservations.',
  },
];

const SHOWCASE_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=1000',
    alt: 'Signature entrée plated on marble',
    offset: 'translateY(-8%)',
    delay: '140ms',
  },
  {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900',
    alt: 'Ambient lounge seating with soft lighting',
    offset: 'translateY(6%)',
    delay: '220ms',
  },
  {
    src: 'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=900',
    alt: 'Cocktail bar showcasing premium pours',
    offset: 'translateY(-4%)',
    delay: '300ms',
  },
];

const ProductGlide = ({ id }) => {
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

  return (
    <section
      id={id}
      className="relative overflow-hidden rounded-[32px] border border-theme bg-gradient-to-br from-[#0a0c13] via-[#101423] to-[#07080d] px-6 py-14 md:px-12 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(197,157,95,0.25),_transparent_58%)] opacity-60" />
      <div className="relative z-10 grid gap-12 lg:grid-cols-[1.1fr_1.3fr] lg:items-center">
        <div data-animate="fade-rise" data-animate-active="false" className="space-y-6 max-w-xl">
          <span 
            className="inline-flex items-center gap-2 rounded-full border border-theme px-5 py-2 text-xs font-medium uppercase tracking-[0.35em] text-accent"
            style={{
              backgroundColor: isLightTheme 
                ? 'rgba(0, 0, 0, 0.04)' 
                : 'rgba(255, 255, 255, 0.05)',
              borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
            }}
          >
            Signature Flow
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight" style={{ color: 'var(--text-main)' }}>
            Glide through every moment like a curated Apple launch.
          </h2>
          <p className="text-base md:text-lg text-[var(--text-main)]/70 leading-relaxed">
            Each step of the Star Café experience choreographs lighting, plating, and service timing so guests move seamlessly from hero dish reveals to after-hours pours.
          </p>
          <div className="mt-8 grid gap-6">
            {PRODUCT_FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                data-animate="slide-up"
                data-animate-active="false"
                style={{ transitionDelay: `${120 + index * 90}ms` }}
                className="glass-panel px-5 py-5"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-sm font-semibold text-accent">
                    {index + 1}
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold text-[var(--text-main)]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--text-main)]/70 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-[-12%] left-[6%] w-[88%] rounded-full bg-gradient-to-r from-accent/25 via-accent/0 to-transparent blur-3xl" aria-hidden="true" />
          <div
            data-animate="glide-horizontal"
            data-animate-active="false"
            className="relative flex w-full gap-6 overflow-visible"
          >
            {SHOWCASE_IMAGES.map(({ src, alt, offset, delay }, index) => (
              <Fragment key={src}>
                <div
                  data-animate="glide-stack"
                  data-animate-active="false"
                  className="group relative aspect-[9/13] w-48 shrink-0 overflow-hidden rounded-[26px] border border-theme transition-all duration-[1100ms] ease-[var(--ease-soft)] hover:z-10 hover:scale-105 hover:border-accent/50 md:w-56 lg:w-64"
                  style={{
                    backgroundColor: isLightTheme 
                      ? 'rgba(255, 255, 255, 0.4)' 
                      : 'rgba(5, 5, 9, 0.4)',
                    transitionDelay: delay,
                    transformOrigin: 'center',
                    boxShadow: isLightTheme
                      ? '0 25px 60px -30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                      : '0 25px 60px -30px rgba(0, 0, 0, 0.8)',
                    borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = isLightTheme
                      ? '0 35px 70px -25px rgba(197, 157, 95, 0.3), 0 0 0 1px rgba(197, 157, 95, 0.4)'
                      : '0 35px 70px -25px rgba(197, 157, 95, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = isLightTheme
                      ? '0 25px 60px -30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)'
                      : '0 25px 60px -30px rgba(0, 0, 0, 0.8)';
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-40 transition duration-500 group-hover:opacity-70"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(5,5,9,0.65) 100%)',
                    }}
                    aria-hidden="true"
                  />
                  <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-spring-out)] group-hover:scale-110"
                    style={{ transform: offset }}
                  />
                </div>
                {index < SHOWCASE_IMAGES.length - 1 && (
                  <div className="hidden h-full w-px shrink-0 bg-gradient-to-b from-accent/40 via-transparent to-transparent md:block" aria-hidden="true" />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductGlide;

ProductGlide.propTypes = {
  id: PropTypes.string,
};

