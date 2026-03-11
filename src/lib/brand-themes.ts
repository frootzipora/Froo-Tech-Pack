import { Brand, BRAND_THEMES } from './types';

export function getBrandColors(brand: Brand) {
  const theme = BRAND_THEMES[brand];
  return {
    primary: theme.primary,
    secondary: theme.secondary,
    // Derived colors
    primaryText: brand === 'Froo' ? '#FFFFFF' : brand === 'Soirée' ? '#3A3A3A' : '#333333',
    headerBg: theme.primary,
    bodyBg: theme.secondary,
    accent: theme.primary,
    border: theme.primary + '40', // 25% opacity
  };
}

export function getBrandCSS(brand: Brand): Record<string, string> {
  const colors = getBrandColors(brand);
  return {
    '--brand-primary': colors.primary,
    '--brand-secondary': colors.secondary,
    '--brand-primary-text': colors.primaryText,
    '--brand-header-bg': colors.headerBg,
    '--brand-body-bg': colors.bodyBg,
    '--brand-accent': colors.accent,
    '--brand-border': colors.border,
  };
}
