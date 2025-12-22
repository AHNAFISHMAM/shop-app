/**
 * SectionTitle component props
 */
interface SectionTitleProps {
  /** Small text above the title (eyebrow text) */
  eyebrow?: string;
  /** Main title text */
  title: string;
  /** Subtitle text below the title */
  subtitle?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * SectionTitle Component
 *
 * Displays a section title with optional eyebrow text and subtitle.
 * Supports left, center, and right alignment.
 *
 * Features:
 * - Responsive typography
 * - Theme-aware styling (uses CSS variables)
 * - Accessibility compliant (semantic HTML)
 * - Animation support via data attributes
 */
const SectionTitle = ({ eyebrow, title, subtitle, align = 'left' }: SectionTitleProps) => {

  const alignment =
    align === 'center'
      ? 'items-center text-center'
      : align === 'right'
        ? 'items-end text-right'
        : 'items-start text-left';

  return (
    <div
      data-animate="fade-scale"
      data-animate-active="false"
      className={`flex flex-col gap-3 sm:gap-4 mb-10 ${alignment}`}
      role="heading"
      aria-level={2}
    >
      {eyebrow && (
        <div className="text-sm font-semibold tracking-[0.32em] uppercase text-[var(--accent)]" aria-label={eyebrow}>
          {eyebrow}
        </div>
      )}
      <h2 className="text-4xl sm:text-5xl font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-[var(--text-muted)]/80 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;

