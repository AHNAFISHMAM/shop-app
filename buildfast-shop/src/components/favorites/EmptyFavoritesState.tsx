import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { fadeSlideUp } from '../animations/menuAnimations';

const EmptyFavoritesState = memo(() => {
  return (
    <m.div
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center gap-6 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <m.div
        variants={fadeSlideUp}
        custom={0.1}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--bg-secondary)]"
      >
        <Heart className="h-12 w-12 text-[var(--text-muted)]" aria-hidden="true" />
      </m.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          No favorites yet
        </h2>
        <p className="text-[var(--text-muted)]">
          Start adding items you love to see them here
        </p>
      </div>

      <m.div
        variants={fadeSlideUp}
        custom={0.2}
        className="flex flex-col gap-4 sm:flex-row"
      >
        <Link
          to="/menu"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
          aria-label="Browse menu items"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          Browse Menu
        </Link>
        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] px-6 py-3 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
          aria-label="Browse products"
        >
          Browse Products
        </Link>
      </m.div>
    </m.div>
  );
});

EmptyFavoritesState.displayName = 'EmptyFavoritesState';

export default EmptyFavoritesState;

