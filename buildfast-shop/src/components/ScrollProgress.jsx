import { useEffect } from 'react';

const ScrollProgress = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const html = document.documentElement;
    let rafId = null;

    const updateProgress = () => {
      rafId = null;
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const scrollHeight = html.scrollHeight;
      const progress = scrollHeight <= viewportHeight
        ? 0
        : Math.min(1, scrollTop / (scrollHeight - viewportHeight));

      html.style.setProperty('--scroll-progress', `${(progress * 100).toFixed(2)}%`);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateProgress);
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
      if (rafId) {
        window.cancelAnimationFrame(rafId);
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

