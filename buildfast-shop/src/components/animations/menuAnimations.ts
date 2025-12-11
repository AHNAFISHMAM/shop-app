import { Variants } from 'framer-motion';

const easeOut = 'easeOut';
const easeIn = 'easeIn';
const easeInOut = 'easeInOut';

type BatchCustom =
  | number
  | {
      batchIndex?: number;
      itemIndex?: number;
      baseDelay?: number;
      batchDelay?: number;
      itemDelay?: number;
      exitDelay?: number;
    };

const resolveDelay = (custom: BatchCustom, defaults?: { baseDelay?: number; batchDelay?: number; itemDelay?: number }) => {
  if (typeof custom === 'number') {
    return { delay: custom };
  }

  const {
    batchIndex = 0,
    itemIndex = 0,
    baseDelay = defaults?.baseDelay ?? 0,
    batchDelay = defaults?.batchDelay ?? 0.4,
    itemDelay = defaults?.itemDelay ?? 0.08,
  } = custom ?? {};

  return {
    delay: baseDelay + batchIndex * batchDelay + itemIndex * itemDelay,
    exitDelay: custom?.exitDelay ?? 0,
  };
};

export const pageFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: easeInOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.5, ease: easeIn },
  },
};

export const pageBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: easeInOut, delay: 0.08 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.45, ease: easeIn },
  },
};

export const sidebarSequence: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.72, ease: easeInOut, delay: 0.12 },
  },
  exit: {
    opacity: 0,
    x: -32,
    transition: { duration: 0.5, ease: easeIn },
  },
};

export const searchBarSequence: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.68, ease: easeInOut, delay: 0.24 },
  },
  exit: {
    opacity: 0,
    y: -18,
    transition: { duration: 0.45, ease: easeIn },
  },
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (custom: BatchCustom = 0) => {
    const { delay } = resolveDelay(custom);
    return {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: easeInOut, delay },
    };
  },
  exit: (custom: BatchCustom = 0) => ({
    opacity: 0,
    y: 24,
    transition: { duration: 0.45, ease: easeIn, delay: typeof custom === 'number' ? 0 : custom?.exitDelay ?? 0 },
  }),
};

export const batchFadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeInOut },
  },
  exit: {
    opacity: 0,
    y: 22,
    transition: { duration: 0.4, ease: easeIn },
  },
};

export const fadeSlideDown: Variants = {
  hidden: { opacity: 0, y: -28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeInOut },
  },
  exit: {
    opacity: 0,
    y: -22,
    transition: { duration: 0.45, ease: easeIn },
  },
};

export const fadeSlideFromLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easeInOut },
  },
  exit: {
    opacity: 0,
    x: -32,
    transition: { duration: 0.48, ease: easeIn },
  },
};

export const fadeSlideFromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easeInOut },
  },
  exit: {
    opacity: 0,
    x: 32,
    transition: { duration: 0.48, ease: easeIn },
  },
};

export const gridReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: easeInOut,
      staggerChildren: 0.16,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.45, ease: easeIn },
  },
};

export const menuStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.26,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.1,
      when: 'afterChildren',
    },
  },
};

export const floatingCartSequence: Variants = {
  hidden: { opacity: 0, x: 32, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.58, ease: easeInOut, delay: 0.4 },
  },
  exit: {
    opacity: 0,
    x: 36,
    scale: 0.97,
    transition: { duration: 0.45, ease: easeIn },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      when: 'afterChildren',
    },
  },
};


