import { Platform } from 'react-native';

// Glassmorphic wellness-app palette: soft blue -> lavender -> peach -> pale
// gold gradient mesh, frosted glass cards, and a magenta primary accent.
export const colors = {
  // Base / gradient-mesh stops
  meshBlue: '#B9D8EC',
  meshLavender: '#C7BCEE',
  meshPeach: '#F6D3C4',
  meshGold: '#F0E4C4',

  // Surfaces
  cream: '#F4F1FB', // soft lavender-white used for subtle in-card fills
  creamDeep: '#E8E2F7',
  surface: 'rgba(255, 255, 255, 0.62)', // glass card
  surfaceSolid: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.55)',
  borderSoft: 'rgba(255, 255, 255, 0.4)',

  // Text
  ink: '#181521',
  inkSoft: '#7A7488',
  inkMuted: '#9791A6',

  // Primary accent — magenta/pink, matches the reference's CTA + heart icon
  coral: '#E23F82',
  coralDeep: '#C22C6B',
  coralSoft: 'rgba(226, 63, 130, 0.14)',

  // Supporting
  lavender: '#8F7DDC',
  lavenderSoft: 'rgba(143, 125, 220, 0.16)',
  sky: '#4FA6D9',
  skySoft: 'rgba(79, 166, 217, 0.14)',
  sage: '#3FB8B0', // teal, matches the reference's checkmark / plan icon accent
  sageSoft: 'rgba(63, 184, 176, 0.15)',
  amber: '#D6A542', // gold, matches the crown icon accent
  amberSoft: 'rgba(214, 165, 66, 0.16)',
};

// Greenhouse department names are company-specific and open-ended, so instead
// of a fixed lookup, hash the name into a small rotating palette.
const CATEGORY_PALETTE = [
  { fg: colors.coralDeep, bg: colors.coralSoft, dot: colors.coral },
  { fg: colors.lavender, bg: colors.lavenderSoft, dot: colors.lavender },
  { fg: colors.amber, bg: colors.amberSoft, dot: colors.amber },
  { fg: colors.sky, bg: colors.skySoft, dot: colors.sky },
  { fg: colors.sage, bg: colors.sageSoft, dot: colors.sage },
];

export function categoryStyleFor(name) {
  if (!name) return { fg: colors.inkSoft, bg: colors.creamDeep, dot: colors.inkMuted };
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

export const statusStyle = {
  'On Track': { fg: colors.sage, bg: colors.sageSoft },
  'Needs Attention': { fg: colors.amber, bg: colors.amberSoft },
  Completed: { fg: colors.sky, bg: colors.skySoft },
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

// Soft, diffuse shadows tuned for glass cards floating over a colorful mesh.
const softShadow = Platform.select({
  web: { boxShadow: '0 10px 30px rgba(90, 70, 130, 0.10)' },
  default: {
    shadowColor: '#5A4682',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});

const liftShadow = Platform.select({
  web: { boxShadow: '0 18px 44px rgba(90, 70, 130, 0.16)' },
  default: {
    shadowColor: '#5A4682',
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
});

export const shadow = { soft: softShadow, lift: liftShadow };

export const font = Platform.select({
  web: {
    regular: '"Avenir Next", "Nunito", -apple-system, "Segoe UI", system-ui, sans-serif',
  },
  default: { regular: undefined },
});

export const type = {
  display: { fontSize: 27, fontWeight: '800', color: colors.ink, letterSpacing: -0.6, lineHeight: 34 },
  title: { fontSize: 19, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  section: { fontSize: 15, fontWeight: '800', color: colors.ink, letterSpacing: -0.1 },
  body: { fontSize: 14, fontWeight: '500', color: colors.inkSoft, lineHeight: 21 },
  small: { fontSize: 12.5, fontWeight: '600', color: colors.inkMuted },
  tiny: { fontSize: 11, fontWeight: '700', color: colors.inkMuted, letterSpacing: 0.3 },
};
