import { useEffect, useRef } from 'react';

/**
 * ScrollProgress Component
 *
 * Displays a visual progress indicator showing scroll position on the page.
 * Uses CSS custom properties for smooth, performant updates.
 *
 * Features:
 * - RequestAnimationFrame for smooth updates
 * - Passive event listeners for performance
 * - Respects prefers-reduced-motion preference
 * - Accessibility compliant (hidden from screen readers)
 */
const ScrollProgress = () => {
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Don't show scroll progress if user prefers reduced motion
      return undefined;
    }

    const html = document.documentElement;

    const updateProgress = () => {
      rafIdRef.current = null;
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const scrollHeight = html.scrollHeight;
      const progress = scrollHeight <= viewportHeight
        ? 0
        : Math.min(1, scrollTop / (scrollHeight - viewportHeight));

      html.style.setProperty('--scroll-progress', `${(progress * 100).toFixed(2)}%`);
    };

    const onScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(updateProgress);
    };

    const onResize = () => {
      updateProgress();
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      html.style.removeProperty('--scroll-progress');
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span className="scroll-progress__track" />
      <span className="scroll-progress__indicator" />
    </div>
  );
};

export default ScrollProgress;

