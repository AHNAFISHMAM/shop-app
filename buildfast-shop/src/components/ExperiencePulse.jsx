import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useStoreSettings } from '../contexts/StoreSettingsContext';

const SERVICE_CADENCE = [
  {
    title: 'Sunrise Prep',
    metric: '06:00 – 08:30',
    change: '+4 sous chefs',
    description:
      'Spice blends, paratha dough, and overnight marinades come off the walk-in so the biryani line can launch on time.',
    align: 'left',
  },
  {
    title: 'Lunch Rush',
    metric: '12:00 – 14:30',
    change: '224 covers/day',
    description:
      'Signature Hyderabadi biryani, clay-oven kebabs, and Jessore iced chai drive the midday spike for office crowds.',
    align: 'right',
  },
  {
    title: 'Golden Hour',
    metric: '17:30 – 19:00',
    change: '33% pre-booked',
    description:
      'Family tables switch to tasting trios while the bar cues mocktail pairings for the first reservation wave.',
    align: 'left',
  },
  {
    title: 'Midnight Lounge',
    metric: '21:30 – 00:30',
    change: '82 seats/night',
    description:
      'Live vinyl sets, dessert flights, and shisha service keep the mezzanine at a steady clip through close.',
    align: 'right',
  },
];

const EXPERIENCE_METRICS = [
  {
    label: 'Daily biryani batches',
    value: '48',
    detail: 'Slow-cooked in copper degs with saffron, long-grain rice, and Jessore-sourced goat.',
  },
  {
    label: 'Cold brew & chai liters',
    value: '165',
    detail: 'Brewed in micro lots; guest-favorite for the afternoon reset before dinner service.',
  },
  {
    label: 'Event conversions',
    value: '24%',
    detail: 'Walk-in lounge guests who reserve tasting menus within 48 hours of their first visit.',
  },
];

const ExperiencePulse = ({ id }) => {
  const { settings } = useStoreSettings();
  const brandName = settings?.store_name ?? 'Star Café';
  const location = settings?.store_location ?? 'Jessore';

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
      className="relative overflow-hidden rounded-[32px] border border-theme bg-gradient-to-b from-[#090b13] via-[#111624] to-[#080910] px-6 py-16 md:px-12 lg:py-20"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent/20 via-transparent to-transparent opacity-70 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(197,157,95,0.08),_transparent_62%)]" />

      <div className="relative z-10 flex flex-col gap-12">
        <header
          data-animate="fade-rise"
          data-animate-active="false"
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-accent">
              Service Pulse
            </span>
            <h2 className="text-3xl font-semibold leading-tight text-[var(--text-main)] md:text-4xl">
              Inside {brandName}
              {location ? ` · ${location}` : ''} — the cadence that keeps the floor glowing nightly.
            </h2>
            <p className="text-sm md:text-base text-muted leading-relaxed">
              Real-time ops data feeds our dashboards so hosts, kitchen, and lounge leads make the same calls.
              Four signature windows anchor the day, each tuned to the biryani program and Jessore&apos;s late-night crowd.
            </p>
          </div>
          <div 
            className="flex items-center gap-4 rounded-3xl border border-theme bg-elevated px-6 py-4 text-left text-xs uppercase tracking-[0.35em] text-[var(--text-main)]/70 md:text-right"
          >
            <div className="space-y-1">
              <p className="font-semibold text-accent">Live KPIs</p>
              <p className="text-[11px] text-[var(--text-main)]/60">Ops feed refreshed every 15 minutes</p>
            </div>
          </div>
        </header>

        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div 
            className="relative overflow-hidden rounded-[28px] border border-theme bg-elevated px-6 py-8 sm:px-8"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(197,157,95,0.12),_transparent_60%)] opacity-80" />
            <div className="relative z-10 flex flex-col gap-8">
              {SERVICE_CADENCE.map((window, index) => (
                <article
                  key={window.title}
                  data-animate={window.align === 'right' ? 'launch-right' : 'launch-left'}
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 90}ms` }}
                  className="group flex flex-col gap-3 border-l border-theme pl-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-[var(--text-main)] md:text-xl">{window.title}</h3>
                    <span 
                      className="rounded-full border border-theme-strong px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--text-main)]/70"
                      style={{
                        backgroundColor: isLightTheme 
                          ? 'rgba(0, 0, 0, 0.08)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : undefined
                      }}
                    >
                      {window.metric}
                    </span>
                  </div>

                  <p className="text-sm text-[var(--text-main)]/75 leading-relaxed">{window.description}</p>

                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--text-main)]/60">
                    <span className="inline-flex h-2 w-2 items-center justify-center rounded-full bg-accent/80" />
                    <span>{window.change}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div
              data-animate="fade-rise"
              data-animate-active="false"
              className="rounded-[24px] border border-theme p-6 sm:p-7"
              style={{
                backgroundColor: isLightTheme 
                  ? 'rgba(0, 0, 0, 0.05)' 
                  : 'rgba(255, 255, 255, 0.06)',
                borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
              }}
            >
              <h3 className="text-lg font-semibold text-[var(--text-main)] md:text-xl">
                Why these numbers matter
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-main)]/70">
                Hosts see projected seat turns before they greet. The kitchen tracks plated-to-pass
                time per course, and floor managers know when to pull the lighting cue or cue
                another vinyl set without guesswork.
              </p>
            </div>

            <div className="grid gap-4 rounded-[24px] border border-theme bg-gradient-to-br from-[#131a2a] via-[#0f1420] to-[#090c14] p-6 sm:p-7">
              {EXPERIENCE_METRICS.map((metric, index) => (
                <div
                  key={metric.label}
                  data-animate="fade-rise"
                  data-animate-active="false"
                  style={{ transitionDelay: `${index * 80}ms` }}
                  className="flex flex-col gap-2 border-b border-theme pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-main)]/60">
                      {metric.label}
                    </span>
                    <span className="text-2xl font-semibold text-accent">{metric.value}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--text-main)]/70">{metric.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

ExperiencePulse.propTypes = {
  id: PropTypes.string,
};

export default ExperiencePulse;

