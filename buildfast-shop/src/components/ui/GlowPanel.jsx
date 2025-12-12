import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable panel that applies the app-wide glow surface styling.
 * Allows customizing radius, padding, and background while keeping
 * the radial highlights and border treatment consistent.
 * Now theme-aware for proper light/dark theme support.
 */
function GlowPanel({
  as: Component = 'div',
  radius = 'rounded-2xl',
  padding = 'p-6',
  background,
  borderColor = 'border-theme',
  glow = 'medium',
  className = '',
  children,
  style,
  ...props
}) {
  // Detect current theme from document element
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

  const glowClass =
    glow && glow !== 'medium'
      ? glow === 'none'
        ? ''
        : `glow-${glow}`
      : ''

  // Determine default background based on theme if not provided
  // Use inline styles instead of Tailwind classes for better theme support
  const defaultBackgroundStyle = background ? undefined : {
    backgroundColor: isLightTheme
      ? 'rgba(255, 255, 255, 0.95)'
      : 'rgba(255, 255, 255, 0.03)'
  };

  const baseClasses = [
    'glow-surface',
    'border',
    radius,
    padding,
    background, // Only use if explicitly provided
    borderColor,
    glowClass,
    className
  ]
    .filter(Boolean)
    .join(' ')

  // Merge inline styles with theme-aware background and border color
  const mergedStyle = {
    ...defaultBackgroundStyle,
    ...style,
    ...(isLightTheme && !style?.borderColor ? {
      borderColor: 'rgba(0, 0, 0, 0.1)'
    } : {})
  }

  return (
    <Component className={baseClasses} style={mergedStyle} {...props}>
      {children}
    </Component>
  )
}

GlowPanel.propTypes = {
  as: PropTypes.elementType,
  radius: PropTypes.string,
  padding: PropTypes.string,
  background: PropTypes.string,
  borderColor: PropTypes.string,
  glow: PropTypes.oneOf(['none', 'subtle', 'soft', 'medium', 'strong']),
  className: PropTypes.string,
  children: PropTypes.node
}

export default GlowPanel

