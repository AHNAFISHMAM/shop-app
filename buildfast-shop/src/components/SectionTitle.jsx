import { useState, useEffect } from 'react';
import PropTypes from 'prop-types'

const SectionTitle = ({ eyebrow, title, subtitle, align = 'left' }) => {
  // Detect current theme from document element (for consistency with hybrid approach)
  // eslint-disable-next-line no-unused-vars
  const [isLightTheme, setIsLightTheme] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('theme-light');
  });
  
  // Watch for theme changes
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

  const alignment =
    align === 'center'
      ? 'items-center text-center'
      : 'items-start text-left';

  return (
    <div
      data-animate="fade-scale"
      data-animate-active="false"
      className={`flex flex-col gap-3 sm:gap-4 mb-10 ${alignment}`}
    >
      {eyebrow && (
        <div className="text-xs sm:text-sm font-semibold tracking-[0.32em] uppercase text-accent">
          {eyebrow}
        </div>
      )}
      <h2 className="text-4xl sm:text-5xl font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-muted/80 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;

SectionTitle.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  align: PropTypes.oneOf(['left', 'center', 'right'])
}
