import { useState, useEffect, ReactNode } from 'react';

/**
 * RootProps interface
 */
export interface RootProps {
  children: ReactNode;
}

/**
 * CardProps interface
 */
export interface CardProps {
  children: ReactNode;
}

/**
 * HeaderProps interface
 */
export interface HeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  helper?: ReactNode;
}

/**
 * Root component for auth shell layout
 *
 * @param {RootProps} props - Component props
 */
function Root({ children }: RootProps) {
  return (
    <section className="relative z-0 isolate flex min-h-[calc(100vh-6rem)] w-full items-center justify-center overflow-hidden py-12" role="main" aria-label="Authentication">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--accent)]/20 via-transparent to-transparent opacity-60" />
        <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-[var(--accent)]/15 blur-3xl" />
        <div className="absolute -right-28 bottom-10 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-3xl" />
      </div>
      <div className="w-full max-w-lg px-4 sm:px-6 lg:px-0">
        {children}
      </div>
    </section>
  );
}

/**
 * Card component for auth shell
 *
 * @param {CardProps} props - Component props
 */
function Card({ children }: CardProps) {
  // Detect current theme from document element
  const [isLightTheme, setIsLightTheme] = useState<boolean>(() => {
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
      className="glow-surface relative z-10 rounded-3xl border border-[var(--border-default)] px-6 py-8 backdrop-blur-xl sm:px-8"
      style={{
        pointerEvents: 'auto',
        backgroundColor: isLightTheme 
          ? 'rgba(255, 255, 255, 0.95)' 
          : 'rgba(255, 255, 255, 0.05)',
        boxShadow: isLightTheme 
          ? '0 40px 120px -50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)' 
          : '0 40px 120px -50px rgba(5, 5, 9, 0.8)',
        borderColor: isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.15)' : undefined
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl border border-[var(--border-subtle)] opacity-40"
        style={{
          borderColor: isLightTheme ? 'rgba(var(--bg-dark-rgb), 0.1)' : undefined
        }}
      />
      <div className="relative space-y-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Header component for auth shell
 *
 * @param {HeaderProps} props - Component props
 */
function Header({ eyebrow, title, subtitle, helper }: HeaderProps) {
  return (
    <header className="space-y-3 text-center">
      {eyebrow ? (
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent)]/80">
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
        <div className="text-sm text-[var(--text-muted)]">
          {helper}
        </div>
      ) : null}
    </header>
  );
}

const AuthShell = {
  Root,
  Card,
  Header,
};

export default AuthShell;

