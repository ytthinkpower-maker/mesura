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

Environments are split by file, and Expo picks one by mode:

| File               | Loaded by                 | Supabase project |
| ------------------ | ------------------------- | ---------------- |
| `.env`             | always, both modes        | —                |
| `.env.development` | `npm start` (Expo Go)     | `mesura-dev`     |
| `.env.production`  | `expo export`, EAS builds | `mesura-prod`    |

A mode file wins over `.env` for the same variable name. Only `.env.example` is
committed. The Supabase `service_role` key never appears in any of them.

---

## Folder structure

```
app/          Routes only. File-based; a file here is a URL.
components/   Reusable UI. Presentational, brand-token-driven. React context
              providers live here too, because they carry JSX.
lib/          Framework-free logic. No JSX, no React. `supabase.ts` is the one
              place the client is constructed; everything else imports it from
              there. `week.ts` owns every date boundary, `drinks.ts` everything
              the Today screen derives.
supabase/     Database schema and policies as SQL. Run by hand in the Supabase
              SQL editor — there is no migration runner in this project.
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

| Component           | File                                | Notes                                                                                                                    |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PrimaryButton`     | `components/primary-button.tsx`     | The one CTA: a spruce pill. No shadow, no gradient                                                                       |
| `Card`              | `components/card.tsx`               | `surface` fill, radius 12, hairline border, `flush` prop                                                                 |
| `StatTile`          | `components/stat-tile.tsx`          | Label + value + caption; `tone` is `default` / `spruce` / `over`                                                         |
| `ProgressRing`      | `components/progress-ring.tsx`      | SVG ring, takes `current` + `target`, open gap at the top, fills spruce and only turns rose past target. Animates        |
| `PlaceholderScreen` | `components/placeholder-screen.tsx` | Temporary tab body. Delete once every tab is real                                                                        |
| `TextField`         | `components/text-field.tsx`         | Labelled input. Border turns spruce on focus, rose on error. Use `revealable` for passwords, never raw `secureTextEntry` |
| `AuthScreen`        | `components/auth-screen.tsx`        | Shell for the signed-out screens: title, one column, keyboard-aware. Exports `AuthLink`                                  |
| `AuthProvider`      | `components/auth-provider.tsx`      | Session state + `useAuth()`. Holds the password-recovery flag the router gates on                                        |
| `SecondaryButton`   | `components/secondary-button.tsx`   | Outlined spruce pill, same size as `PrimaryButton`. Only where two actions are genuinely equal                           |
| `Sheet`             | `components/sheet.tsx`              | Bottom panel built on the platform `Modal`. Tap outside to close. No sheet library, no gestures                          |
| `LogDrinkSheet`     | `components/log-drink-sheet.tsx`    | `Sheet` + `DrinkTypePicker`. One tap logs and the sheet closes itself                                                    |
| `DrinkTypePicker`   | `components/drink-type-picker.tsx`  | Three one-tap types + "Something else". Shared by the log sheet and Urge SOS so logging is one gesture everywhere        |
| `BreathingCircle`   | `components/breathing-circle.tsx`   | 4s in / 4s hold / 6s out. Takes `phase` from its parent — one clock drives the circle, the label, and the countdown      |

---

## Screens

Five tabs, defined in `app/(tabs)/`:

| Tab       | Route           | Purpose                                                 |
| --------- | --------------- | ------------------------------------------------------- |
| Today     | `index.tsx`     | Log drinks and urges, see the weekly ring. **Real**     |
| History   | `history.tsx`   | Past weeks: set, drank, won. _Placeholder_              |
| Lessons   | `lessons.tsx`   | Short reads, serif body. _Placeholder + sample_         |
| Challenge | `challenge.tsx` | Commit to a number, build a streak. _Placeholder_       |
| Settings  | `settings.tsx`  | Account, export, delete. **Real.** Limits still pending |

One route lives outside the tabs:

| Route   | File           | Purpose                                                         |
| ------- | -------------- | --------------------------------------------------------------- |
| `/urge` | `app/urge.tsx` | Urge SOS, a `fullScreenModal` presented over the tabs. **Real** |

### Urge SOS

The emotional core: the one screen that rewards something the user does _not_
do. It has to read as a deep breath, not a form — the breathing circle is the
subject, the trigger note is unlabelled and optional, and the exit that ends in
a drink is exactly as quiet and unpunished as the one that does not.

- **Both outcomes are logged.** A tally of urges survived is only true if the
  urges that were not survived are counted too, so "I had the drink" writes an
  `urge_logs` row as well as a `drink_logs` row.
- **The outcome is `survived`, not `rode_it_out`.** The build playbook's prompt
  says the latter, but `urge_logs.outcome` carries a check constraint allowing
  only `survived` / `drank`, and that constraint is already live in `mesura-dev`
  and baked into the export format. The schema wins.
- **The screen computes the breath phase, not the circle.** The label and the
  animation come off one clock, recomputed each tick from a start timestamp, so
  neither drifts: a circle contracting under the word "Hold" is worse than no
  guide at all.

### The weekly number

The rules Today is built on live in [`lib/week.ts`](lib/week.ts) and
[`lib/drinks.ts`](lib/drinks.ts), not in the screen:

- **Weeks run Sunday 00:00 to Saturday 23:59 in the user's timezone.** Not UTC,
  and not a fixed offset — the IANA zone, resolved through
  `Intl.DateTimeFormat`, so a boundary survives DST and half-hour zones. The
  profile's `timezone` is refreshed from the device on load, because the device
  is the only thing that knows it.
- **Money saved is `(baseline_drinks - drinks) x drink_cost`, floored at zero.**
  A heavy week saves nothing; it never owes. A `baseline_drinks` of 0 means the
  question has not been asked yet, and the counter stays at zero rather than
  inventing a saving.
- **The streak counts finished weeks at or under the number** — never the
  current one, and never a week that started before the account did.
- **Logging is one tap and never types.** The sheet offers the three types this
  user actually logs; the ring moves before the insert comes back, and rolls
  back if it fails.

Weekly target, baseline, and drink cost still have no UI. Set them with
[`supabase/seed-dev.sql`](supabase/seed-dev.sql) until onboarding lands.

---

## Auth and data

Supabase provides accounts and storage. The app ships only the anon key —
**Row Level Security is what keeps one user out of another's rows**, not
secrecy. The `service_role` key must never enter this repo.

- Schema, policies, and the account-deletion function live in
  [`supabase/schema.sql`](supabase/schema.sql). It is idempotent: paste the
  whole file into the Supabase SQL editor and run it. When you change a table,
  change [`lib/database.types.ts`](lib/database.types.ts) in the same commit.
- **Recovery uses one-time codes, not emailed links.** A link has to travel
  from Mail back into the app through a deep link, which is the most common way
  a recovery flow strands someone — and account recovery is a headline feature.
  Both the Supabase "Confirm signup" and "Reset password" email templates must
  therefore contain `{{ .Token }}`, and neither should still offer
  `{{ .ConfirmationURL }}` — a user who taps the link gets confirmed in Safari
  while the app sits on the code screen, never learning it worked.
- **Two constants mirror dashboard settings and must be changed in pairs.**
  `CODE_LENGTH` in [`lib/auth.ts`](lib/auth.ts) mirrors _Email OTP length_, and
  `MIN_PASSWORD_LENGTH` mirrors _Minimum password length_, both on the Supabase
  Email provider. A mismatch on the first makes every valid code look wrong.
- Routes under `app/(auth)/` are the signed-out stack. The root layout gates on
  `Stack.Protected`; a password-recovery session counts as signed **out** until
  the new password is saved.
- Sessions persist in AsyncStorage, not SecureStore — SecureStore's 2048-byte
  cap silently truncates a Supabase session and signs the user out.
- Every table cascades from `auth.users`, so `delete_account()` removes the
  account and all its rows in one statement.

### Account deletion — two things owed before submission

App Store Review Guideline 5.1.1(v) requires in-app account deletion, and
Mesura's Settings screen satisfies the bulk of it today: the option is easy to
find, it permanently deletes rather than deactivates, it removes every row the
account owns, it needs no phone call or support ticket, and two confirmation
alerts are within the "may add verification steps" allowance without being
"unnecessarily difficult".

Two requirements are **not** met yet, and neither can be met from Expo Go:

1. **Sign in with Apple token revocation.** Apple requires apps offering Sign in
   with Apple to call the [Revoke Tokens REST
   API](https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens/)
   when an account is deleted. That needs a Team ID, Key ID, and `.p8` private
   key signing a `client_secret` JWT server-side — so a Supabase Edge Function,
   never the client. It also needs `credential.authorizationCode`, which
   [`lib/auth.ts`](lib/auth.ts) currently discards, exchanged for a refresh token
   and stored at sign-in. **Impossible in Expo Go**, where the Apple client ID is
   `host.exp.Exponent` and belongs to Expo, not us. Blocked until Mesura has its
   own bundle identifier.
2. **Subscription notice.** Once IAP lands (PRD §7), the deletion flow must tell
   the user that billing continues through Apple and link them to manage or
   cancel the subscription. Deleting the account does not cancel it.

## Conventions

- Files are kebab-case; React components are PascalCase.
- Imports use the `@/` alias.
- Tone of voice: plain, warm, never clinical, never scolding. The user is an
  adult making a choice, not a patient.

### Commit messages

Every commit subject is `Step X.Y: one-line description`, where `X.Y` is the
step number from
[`docs/mesura-build-playbook.md`](docs/mesura-build-playbook.md). The playbook's
prompts are pasted in verbatim, so the step is found by matching the prompt you
were given against its `Prompt X.Y` block — not by guessing from the diff.

Work that is not itself a step — a bug fix, a doc, a piece of housekeeping —
takes the number of the step it belongs to. Several commits sharing a number is
normal and correct; a commit with no number is not. If nothing plausibly fits,
ask rather than inventing one.

The body is prose explaining **why**, not a list of what changed. The diff
already says what changed.
