import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

function Root({ children }) {
  return (
    <section className="relative isolate flex min-h-[calc(100vh-6rem)] w-full items-center justify-center overflow-hidden py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--accent)]/20 via-transparent to-transparent opacity-60" />
        <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-[var(--accent)]/15 blur-3xl" />
        <div className="absolute -right-28 bottom-10 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-3xl" />
      </div>
      <div className="w-full max-w-lg px-4 sm:px-6 lg:px-0">
        {children}
      </div>
    </section>
  )
}

function Card({ children }) {
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

  return (
    <div 
      className="glow-surface relative rounded-3xl border border-theme px-6 py-8 backdrop-blur-xl sm:px-8"
      style={{
        backgroundColor: isLightTheme 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(255, 255, 255, 0.05)',
        boxShadow: isLightTheme 
          ? '0 40px 120px -50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
          : '0 40px 120px -50px rgba(5, 5, 9, 0.8)',
        borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.15)' : undefined
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl border border-theme-subtle opacity-40"
        style={{
          borderColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : undefined
        }}
      />
      <div className="relative space-y-6">
        {children}
      </div>
    </div>
  )
}

function Header({ eyebrow, title, subtitle, helper }) {
  return (
    <header className="space-y-3 text-center">
      {eyebrow ? (
        <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]/80">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold text-[var(--text-main)] sm:text-3xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-sm text-[var(--text-muted)]">
          {subtitle}
        </p>
      ) : null}
      {helper ? (
        <div className="text-xs text-[var(--text-muted)]">
          {helper}
        </div>
      ) : null}
    </header>
  )
}

const AuthShell = {
  Root,
  Card,
  Header,
}

export default AuthShell

Root.propTypes = {
  children: PropTypes.node.isRequired
}

Card.propTypes = {
  children: PropTypes.node.isRequired
}

Header.propTypes = {
  eyebrow: PropTypes.node,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  helper: PropTypes.node
}

