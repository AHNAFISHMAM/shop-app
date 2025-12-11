import { getContrastRatio, meetsWCAGAA } from './contrastUtils';
import { logger } from './logger';

/**
 * Theme color definitions
 */
const THEME_COLORS = {
  light: {
    background: '#F4F6F8',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    accent: '#C59D5F',
  },
  dark: {
    background: '#050509',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    accent: '#C59D5F',
  }
};

/**
 * Verify all theme contrast ratios
 * @returns {Object} Verification results
 */
export function verifyThemeContrast() {
  const results = {
    light: {},
    dark: {},
    allPass: true
  };
  
  // Verify light theme
  const light = THEME_COLORS.light;
  results.light = {
    primary: {
      ratio: getContrastRatio(light.textPrimary, light.background),
      passes: meetsWCAGAA(light.textPrimary, light.background),
      level: meetsWCAGAA(light.textPrimary, light.background) ? 'AA' : 'FAIL'
    },
    secondary: {
      ratio: getContrastRatio(light.textSecondary, light.background),
      passes: meetsWCAGAA(light.textSecondary, light.background),
      level: meetsWCAGAA(light.textSecondary, light.background) ? 'AA' : 'FAIL'
    },
    accent: {
      ratio: getContrastRatio(light.accent, light.background),
      passes: meetsWCAGAA(light.accent, light.background),
      level: meetsWCAGAA(light.accent, light.background) ? 'AA' : 'FAIL'
    }
  };
  
  // Verify dark theme
  const dark = THEME_COLORS.dark;
  results.dark = {
    primary: {
      ratio: getContrastRatio(dark.textPrimary, dark.background),
      passes: meetsWCAGAA(dark.textPrimary, dark.background),
      level: meetsWCAGAA(dark.textPrimary, dark.background) ? 'AA' : 'FAIL'
    },
    secondary: {
      ratio: getContrastRatio(dark.textSecondary, dark.background),
      passes: meetsWCAGAA(dark.textSecondary, dark.background),
      level: meetsWCAGAA(dark.textSecondary, dark.background) ? 'AA' : 'FAIL'
    },
    accent: {
      ratio: getContrastRatio(dark.accent, dark.background),
      passes: meetsWCAGAA(dark.accent, dark.background),
      level: meetsWCAGAA(dark.accent, dark.background) ? 'AA' : 'FAIL'
    }
  };
  
  // Check if all pass
  results.allPass = 
    Object.values(results.light).every(r => r.passes) &&
    Object.values(results.dark).every(r => r.passes);
  
  return results;
}

// Log results in development
if (import.meta.env.DEV) {
  const verification = verifyThemeContrast();
  logger.log('Theme Contrast Verification:', verification);
  
  if (!verification.allPass) {
    logger.warn('⚠️ Some color combinations do not meet WCAG AA standards');
  }
}

