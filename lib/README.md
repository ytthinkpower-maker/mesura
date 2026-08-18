# lib/

Framework-free logic: drink math, week boundaries, storage adapters, formatting.

Rules of thumb:

- No React imports, no JSX. Anything in here should be unit-testable in plain Node.
- No native modules (see the hard rules in `CLAUDE.md`).
- Screens in `app/` call into `lib/`; `lib/` never imports from `app/`.
