# Mesura

Mesura turns "I should drink less" into a weekly number the user controls and can win.

## Requirements

- Node.js 20+
- The **Expo Go** app on your phone (SDK 54)

## Run it

```bash
npm install
npm start
```

Then scan the QR code in the terminal with your iPhone camera and open the link
in Expo Go.

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm start`         | Start Metro and print the QR code     |
| `npm run lint`      | ESLint (Prettier runs as a lint rule) |
| `npm run format`    | Format everything with Prettier       |
| `npm run typecheck` | TypeScript, no emit                   |

## Push to GitHub

The remote is already set to `https://github.com/ytthinkpower-maker/mesura.git`.

1. Copy `.env.example` to `.env`.
2. Create a token at <https://github.com/settings/tokens?type=beta> with access
   to the `mesura` repository and the **Contents: Read and write** permission.
3. Paste it after `GITHUB_TOKEN=` in `.env`.
4. Run `npm run push`.

`.env` is git-ignored, so the token never leaves your computer.

## Layout

```
app/          Routes (Expo Router, file-based)
components/   Reusable UI
lib/          Framework-free logic
content/      Lesson and challenge copy
constants/    Design tokens (brand.ts is the source of truth)
```

Project conventions, the brand system, and the two hard rules live in
[CLAUDE.md](CLAUDE.md).
