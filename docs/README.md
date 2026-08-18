# docs/

Reference material for building Mesura — things you write or collect, not things
the app ships.

Good candidates:

- Product notes, feature specs, decisions you want remembered
- Brand and design references (screenshots, palettes, competitor teardowns)
- Research: guidelines on drinking limits, standard drink sizes, sources worth citing
- Copy drafts before they become real lesson content

## How this folder is used

- **Nothing here is bundled into the app.** `docs/` sits outside `app/`, so Metro
  never touches it. Anything the app actually displays belongs in `content/`.
- **Claude reads this folder.** Drop a file here and refer to it by name
  ("use docs/tone-of-voice.md") and it becomes part of how the build gets made.
- **It is committed to git**, so it travels with the repo and survives across
  sessions. Keep files reasonably small; git handles text far better than large
  binaries. A 40 MB PDF is better linked than committed.
- **No secrets.** This folder is tracked. Tokens and keys go in `.env`.

## Suggested naming

Lowercase, hyphenated, dated when the date matters:

```
docs/product-brief.md
docs/tone-of-voice.md
docs/2026-08-18-user-interviews.md
docs/references/standard-drink-sizes.md
```
