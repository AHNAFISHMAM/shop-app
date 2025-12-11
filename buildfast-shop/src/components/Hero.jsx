import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useStoreSettings } from '../contexts/StoreSettingsContext';
import { getBackgroundStyle } from '../utils/backgroundUtils';

const Hero = ({
  id,
  title,
  subtitle,
  ctaButtons = [],
  images = [],
  className = ''
}) => {
  const { settings } = useStoreSettings();

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

  return (
    <section
      id={id}
      data-animate="fade-scale"
      data-animate-active="false"
      className={`py-3 sm:py-4 md:py-5 px-4 -mx-4 rounded-xl sm:rounded-2xl ${className}`}
      style={settings ? getBackgroundStyle(settings, 'hero') : {}}
    >
      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
        {/* Left: Content */}
        <div
          data-animate="slide-up"
          data-animate-active="false"
          style={{ transitionDelay: '80ms' }}
          className="space-y-4 sm:space-y-6"
        >
          {subtitle && (
            <p className="text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest text-accent">
              {subtitle}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
            {title}
          </h1>

          {/* CTA Buttons */}
          {ctaButtons.length > 0 && (
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
              {ctaButtons.map((button) => (
                <Link
                  key={button.label}
                  to={button.to}
                  className={`${button.variant === 'outline' ? 'btn-outline' : 'btn-primary'} min-h-[44px] text-sm sm:text-base px-5 sm:px-6`}
                >
                  {button.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Images Collage */}
        {images.length > 0 && (
          <div
            data-animate="drift-left"
            data-animate-active="false"
            style={{ transitionDelay: '140ms' }}
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            {images.map((image, index) => (
              <div
                key={image.src}
                data-animate="rise"
                data-animate-active="false"
                style={{ transitionDelay: `${220 + index * 90}ms` }}
                className={`rounded-xl sm:rounded-2xl overflow-hidden ${
                  index === 0 ? 'col-span-2' : ''
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt || `Hero image ${index + 1}`}
                  className="w-full h-48 sm:h-56 md:h-64 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;

Hero.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  ctaButtons: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      variant: PropTypes.oneOf(['outline', 'primary'])
    })
  ),
  images: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string
    })
  ),
  className: PropTypes.string
};
