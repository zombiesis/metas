import { prisma, dbAvailable } from '@/lib/prisma';
import { getCurrentBranchId } from '@/lib/tenant';

export type BranchTheme = {
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  tagline: string | null;
  footerText: string | null;
  features: Record<string, boolean>;
  customCss: string | null;
};

const DEFAULT_THEME: BranchTheme = {
  logo: null,
  favicon: null,
  primaryColor: '#071B33',
  accentColor: '#C7A45B',
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  tagline: null,
  footerText: null,
  features: {},
  customCss: null,
};

export async function getBranchTheme(): Promise<BranchTheme> {
  if (!dbAvailable) return DEFAULT_THEME;
  const branchId = await getCurrentBranchId();
  if (!branchId) return DEFAULT_THEME;

  const settings = await prisma.branchSettings.findUnique({ where: { branchId } }).catch(() => null);
  if (!settings) return DEFAULT_THEME;

  let features: Record<string, boolean> = {};
  try { features = JSON.parse(settings.features); } catch {}

  return {
    logo: settings.logo,
    favicon: settings.favicon,
    primaryColor: settings.primaryColor,
    accentColor: settings.accentColor,
    fontHeading: settings.fontHeading,
    fontBody: settings.fontBody,
    tagline: settings.tagline,
    footerText: settings.footerText,
    features,
    customCss: settings.customCss,
  };
}

/** Generate CSS variables string from theme */
export function themeToCssVars(theme: BranchTheme): string {
  const safeColor = (v: string) => /^#[0-9a-fA-F]{3,8}$|^(rgb|hsl)a?\([^)]+\)$/.test(v) ? v : '#071B33';
  return [
    `--color-primary: ${safeColor(theme.primaryColor)}`,
    `--color-accent: ${safeColor(theme.accentColor)}`,
    `--color-navy: ${safeColor(theme.primaryColor)}`,
    `--color-gold: ${safeColor(theme.accentColor)}`,
  ].join('; ');
}

/** Sanitize custom CSS — strip dangerous constructs */
export function sanitizeCustomCss(css: string): string {
  return css
    .replace(/<\/?[^>]*>/g, '')           // strip HTML tags
    .replace(/@import\b/gi, '')           // block @import
    .replace(/expression\s*\(/gi, '')     // block IE expression()
    .replace(/javascript\s*:/gi, '')      // block javascript: urls
    .replace(/url\s*\(\s*['"]?\s*data:/gi, 'url(blocked:') // block data: urls
    .slice(0, 10000);                     // cap length
}


/** Check if a feature is enabled for the current branch */
export async function isFeatureEnabled(feature: string): Promise<boolean> {
  const theme = await getBranchTheme();
  return theme.features[feature] !== false; // default to enabled
}
