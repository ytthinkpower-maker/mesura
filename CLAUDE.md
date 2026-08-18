@AGENTS.md

# Mesura

**Mesura turns "I should drink less" into a weekly number the user controls and can win.**

The user sets a number of drinks for the week. Mesura tracks it, shows where they
stand, and makes finishing the week under the number feel like a win they earned.
Every design and copy decision serves that sentence.

---

## Two hard rules

These are not preferences. Breaking either one breaks the product.

1. **Never eject.** Mesura stays on Expo's managed workflow, permanently. Do not
   run `expo prebuild`, do not create `ios/` or `android/` directories, do not
   suggest bare React Native. If something seems to need ejecting, find another
   way or ask.
2. **Never add custom native modules.** Only libraries already bundled in the
   App Store build of Expo Go for SDK 54 may be used. Anything requiring a
   config plugin with native code, a custom development client, or a `pod
install` is out of scope. Before adding any dependency, run
   `npx expo install <pkg>` (never plain `npm install`) and confirm it resolves
   to an SDK-54 version.

---

## Stack

| Piece      | Choice                                                       |
| ---------- | ------------------------------------------------------------ |
| Framework  | Expo SDK **54** (managed workflow), pinned to `expo@54.0.37` |
| Runtime    | React Native 0.81.5, React 19.1.0, New Architecture enabled  |
| Language   | TypeScript (strict)                                          |
| Navigation | Expo Router 6 (file-based), bottom tabs                      |
| Drawing    | `react-native-svg` 15.12.1 (the version inside Expo Go 54)   |
| Linting    | ESLint 9 (`eslint-config-expo`) + Prettier, wired together   |
| Target     | Expo Go on iPhone. SDK 54 only.                              |

Every dependency is pinned to an exact version — no `^`, no `~`. Two packages
(`@react-navigation/bottom-tabs`, `@react-navigation/native`) are listed in
`expo.install.exclude` in `package.json` because the exact pin is deliberate and
would otherwise be reported by `expo install --check`.

### Commands

```bash
npm start          # Metro + QR code for Expo Go
npm run lint       # ESLint (includes Prettier as a lint rule)
npm run format     # Prettier, write
npm run typecheck  # tsc --noEmit
npm run push       # push to GitHub using GITHUB_TOKEN from .env
```

Secrets live in `.env`, which is git-ignored along with every other env file and
key format (see `.gitignore`). `.env.example` is the only committed template.
Never put a token, key, or account id in tracked source.

The Expo CLI loads `.env` automatically, but only variables prefixed
`EXPO_PUBLIC_` are inlined into the app bundle. Anything secret must therefore
**never** carry that prefix — `GITHUB_TOKEN` is read by `scripts/push.js` on
your machine and never reaches the bundle.

---

## Folder structure

```
app/          Routes only. File-based; a file here is a URL.
components/   Reusable UI. Presentational, brand-token-driven.
lib/          Framework-free logic. No JSX, unit-testable in plain Node.
content/      Authored copy: lessons, challenges, onboarding strings. Data only.
constants/    Design tokens. `brand.ts` is the single source of truth.
assets/       Images and fonts.
docs/         Reference material for building: briefs, research, design notes.
              Read it when relevant; never bundled into the app.
```

`lib/` never imports from `app/`. Only `constants/brand.ts` contains hex values.

---

## Brand system

Implemented in [`constants/brand.ts`](constants/brand.ts). These names are
contractual — reference tokens, never raw values.

### `BrandColor`

| Token           | Value     | Use                                                                                     |
| --------------- | --------- | --------------------------------------------------------------------------------------- |
| `spruce`        | `#14594A` | Primary. Buttons, progress ring fill, streak highlights, active tab — **and every win** |
| `sprucePressed` | `#0F4539` | Pressed state on spruce surfaces                                                        |
| `spruceSoft`    | `#E3ECE8` | Quiet spruce wash: ring track, selected pills                                           |
| `onSpruce`      | `#FAF8F3` | Text and icons on a spruce fill                                                         |
| `paper`         | `#FAF8F3` | The background of everything. Light and warm                                            |
| `surface`       | `#FFFFFF` | Card and tile fill, one step above paper                                                |
| `line`          | `#E8E3D9` | Hairline borders and dividers — the only separation device                              |
| `ink`           | `#191C1B` | Primary text                                                                            |
| `inkMuted`      | `#6B706E` | Secondary text: labels, captions, inactive tabs                                         |
| `slate`         | `#5C6B68` | AI-generated text, and nothing else                                                     |
| `rose`          | `#C25B6E` | Over-target and errors, sparingly                                                       |
| `roseSoft`      | `#F7EAED` | Quiet wash behind over-target messaging                                                 |

**Colour laws:**

- **Winning always renders in `spruce`.** There is no success green in this app.
  If a screen needs to say "you did it", it says it in spruce.
- **`paper` is the background, always.** Mesura is never dark-dominant. There is
  no dark palette and no `useColorScheme()` branching; `app.json` sets
  `userInterfaceStyle: "light"`.
- **`rose` is muted and rare.** Over-target and errors only. Never alarm-red,
  never scolding — the user is not in trouble.
- **`slate` means a machine wrote it.** Do not use it for ordinary body copy.

### `BrandSpace`

`xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `xxl` 32 · `xxxl` 48

Whitespace is generous by default. When in doubt, go up a step.

### `BrandRadius` and `BrandBorderWidth`

`card` 12 · `control` 12 · `pill` 999. `BrandBorderWidth` is 1, paired with
`BrandColor.line`.

**No gradients. No shadows.** Ever. Elevation is communicated by `surface`
against `paper` plus a hairline `line` border.

### `BrandFont` and `BrandType`

- `BrandFont.ui` — the system font (SF Pro on iOS). All UI.
- `BrandFont.serif` — New York on iOS (via `ui-serif`). **Lesson body text only.**

Type tokens: `numeric` (48, reserved for the weekly number) · `display` (32) ·
`title` (24) · `heading` (18) · `body` (16) · `label` (14) · `caption` (12) ·
`lessonBody` (18, serif — the only serif style).

---

## Components

| Component           | File                                | Notes                                                                                                   |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PrimaryButton`     | `components/primary-button.tsx`     | The one CTA: a spruce pill. No shadow, no gradient                                                      |
| `Card`              | `components/card.tsx`               | `surface` fill, radius 12, hairline border, `flush` prop                                                |
| `StatTile`          | `components/stat-tile.tsx`          | Label + value + caption; `tone` is `default` / `spruce` / `over`                                        |
| `ProgressRing`      | `components/progress-ring.tsx`      | SVG ring, takes `current` + `target`, open gap at the top, fills spruce and only turns rose past target |
| `PlaceholderScreen` | `components/placeholder-screen.tsx` | Temporary tab body. Delete once every tab is real                                                       |

---

## Screens

Five tabs, defined in `app/(tabs)/`:

| Tab       | Route           | Purpose                                                  |
| --------- | --------------- | -------------------------------------------------------- |
| Today     | `index.tsx`     | Log drinks, see the weekly ring. **Real UI (demo data)** |
| History   | `history.tsx`   | Past weeks: set, drank, won. _Placeholder_               |
| Lessons   | `lessons.tsx`   | Short reads, serif body. _Placeholder + sample_          |
| Challenge | `challenge.tsx` | Commit to a number, build a streak. _Placeholder_        |
| Settings  | `settings.tsx`  | Limit, drink sizes, reminders, data. _Placeholder_       |

Today currently shows a hard-coded 5-of-8 ring. Replace `DEMO_CURRENT` /
`DEMO_TARGET` when real state lands.

---

## Conventions

- Files are kebab-case; React components are PascalCase.
- Imports use the `@/` alias.
- Tone of voice: plain, warm, never clinical, never scolding. The user is an
  adult making a choice, not a patient.
