/**
 * Mesura design tokens — the single source of truth for the brand.
 *
 * Rules that these tokens encode (see CLAUDE.md):
 * - Winning ALWAYS renders in `spruce`. There is no separate "success green".
 * - Backgrounds are always `paper`. The app is never dark-dominant, so there
 *   is no dark palette and no `useColorScheme()` branching.
 * - `rose` is for over-target and errors only, used sparingly. Never
 *   alarm-red, never scolding.
 * - `slate` marks AI-generated text, and nothing else.
 * - No gradients and no shadows anywhere. Separation comes from `line`.
 *
 * Components and screens reference tokens. Only this file contains hex values.
 */

import { Platform, type TextStyle } from 'react-native';

export const BrandColor = {
  /** Primary. Buttons, progress ring fill, streak highlights, active tab, wins. */
  spruce: '#14594A',
  /** Pressed state for spruce surfaces. */
  sprucePressed: '#0F4539',
  /** Quiet spruce wash: ring track, selected pills, subtle fills. */
  spruceSoft: '#E3ECE8',
  /** Text/icons placed on a spruce fill. */
  onSpruce: '#FAF8F3',

  /** The background of everything. Light and warm. */
  paper: '#FAF8F3',
  /** Card and tile fill, one step above paper. */
  surface: '#FFFFFF',
  /** Hairline borders and dividers — the only separation device (no shadows). */
  line: '#E8E3D9',

  /** Primary text. */
  ink: '#191C1B',
  /** Secondary text: labels, captions, inactive tabs. */
  inkMuted: '#6B706E',

  /** AI-generated text, and nothing else. */
  slate: '#5C6B68',

  /** Over-target and errors. Sparing use only. */
  rose: '#C25B6E',
  /** Quiet rose wash behind over-target messaging. */
  roseSoft: '#F7EAED',
} as const;

/** Spacing scale, in points. Whitespace is generous by default. */
export const BrandSpace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Only two radii exist: cards/controls are 12, pills are fully round. */
export const BrandRadius = {
  card: 12,
  control: 12,
  pill: 999,
} as const;

/** Hairline border width used with `BrandColor.line`. */
export const BrandBorderWidth = 1;

/**
 * Font families.
 * - `ui` is the system font (SF Pro on iOS) and is used for all UI.
 * - `serif` is New York on iOS (`ui-serif` resolves to it) and is reserved
 *   for lesson body text.
 */
export const BrandFont = {
  ui: Platform.select({ ios: 'system-ui', android: 'sans-serif', default: 'system-ui' }),
  serif: Platform.select({ ios: 'ui-serif', android: 'serif', default: 'Georgia, serif' }),
} as const;

/**
 * Type scale. `lessonBody` is the only serif style — do not use it for UI.
 * `numeric` is reserved for the weekly number.
 */
export const BrandType = {
  numeric: { fontFamily: BrandFont.ui, fontSize: 48, lineHeight: 52, fontWeight: '700' },
  display: { fontFamily: BrandFont.ui, fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontFamily: BrandFont.ui, fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontFamily: BrandFont.ui, fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontFamily: BrandFont.ui, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontFamily: BrandFont.ui, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontFamily: BrandFont.ui, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  /** Lesson body copy only. */
  lessonBody: { fontFamily: BrandFont.serif, fontSize: 18, lineHeight: 28, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type BrandTypeToken = keyof typeof BrandType;
