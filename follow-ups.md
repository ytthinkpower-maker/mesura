# Follow-ups

Things we know we need to do but deliberately have not done yet. Each entry says
**why** it is deferred, so a future session can tell "not yet" from "forgotten".

Add to this file when you defer something. Delete entries when they ship —
this is a working list, not a changelog.

---

## Blocked until Mesura has its own bundle identifier

`app.json` has no `ios.bundleIdentifier`. Expo Go does not need one, so nothing
here is broken today — but everything below is waiting on it.

- [ ] **Set `ios.bundleIdentifier`** in `app.json`. Everything else in this
      section depends on it.
- [ ] **Sign in with Apple token revocation.** App Store Review Guideline
      5.1.1(v) requires apps offering Sign in with Apple to call the
      [Revoke Tokens REST API](https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens/)
      on account deletion. Needs: `credential.authorizationCode` captured in
      `lib/auth.ts` (currently discarded), exchanged for a refresh token and
      stored; plus a Supabase Edge Function holding the Team ID, Key ID, and
      `.p8` key to sign the `client_secret` JWT. Impossible in Expo Go, where the
      Apple client ID is `host.exp.Exponent` and belongs to Expo, not us.
      **This is an App Store review blocker.**
- [ ] **Add the real bundle identifier to the Supabase Apple provider's
      _Client IDs_**, comma-separated alongside `host.exp.Exponent`.
- [ ] Accounts created with Apple in Expo Go are **different accounts** from
      those in a real build — Apple scopes its user identifier per App ID. Expect
      to discard Expo Go Apple test accounts.

## Before the production project is usable

`.env.production` points at `mesura-prod`, which has had none of the setup that
`mesura-dev` got. All of this must be repeated there.

- [ ] Run [`supabase/schema.sql`](supabase/schema.sql) against `mesura-prod`.
- [ ] Set the **Confirm signup** and **Reset password** email templates to use
      `{{ .Token }}` with no `{{ .ConfirmationURL }}`.
- [ ] Set **Email OTP length** to 8 and **Minimum password length** to 8, to
      match `CODE_LENGTH` and `MIN_PASSWORD_LENGTH` in `lib/auth.ts`.
- [ ] Enable the Apple provider with the real bundle identifier.
- [ ] **Configure a custom SMTP provider.** Supabase's built-in email sender is
      rate-limited to a handful of messages per hour and is not intended for
      production. Recovery is a headline feature; it cannot sit behind a sender
      that throttles. **This is a launch blocker.**
- [ ] Mirror the `EXPO_PUBLIC_*` values into EAS — git-ignored files are not
      uploaded to Expo's build servers.

## Before App Store submission

- [ ] **Subscription notice in the deletion flow.** Once IAP lands (PRD §7),
      deletion must tell the user billing continues through Apple and link them
      to cancel. Deleting an account does not cancel a subscription, and a user
      charged after deleting is precisely the review the positioning cannot
      survive.
- [ ] Privacy policy and data-handling disclosure (PRD §9).
- [ ] Confirm **Prevent use of leaked passwords** is on for both projects.

## Product surface still unbuilt

- [ ] **Drink logging.** The Today tab is hard-coded — replace `DEMO_CURRENT` and
      `DEMO_TARGET` in `app/(tabs)/index.tsx` with real reads and writes against
      `drink_logs`. Until this exists, the data export legitimately returns empty
      arrays for everything but `profiles`.
- [ ] Urge logging against `urge_logs`, including the urge-survived credit.
- [ ] Settings: weekly limit, drink sizes, reminders — the "Your week" card is a
      placeholder.
- [ ] History, Lessons, and Challenge tabs are all `PlaceholderScreen`.
- [ ] Onboarding quiz, including the §9 safety screen for heavy-use patterns.
- [ ] Delete `components/placeholder-screen.tsx` once no route imports it.

## Undecided

- [ ] **Google sign-in.** Possible in Expo Go only via the browser OAuth flow
      (`signInWithOAuth` + `expo-web-browser` + `expo-auth-session`); the
      recommended native library needs a development build and is barred by hard
      rule #2. Costs a Google Cloud Console setup and re-allow-listing the
      `exp://<LAN-IP>` redirect whenever the dev machine's IP changes. Not in the
      PRD, which specifies email and Apple only. Recommendation: revisit after
      the bundle identifier exists, when the redirect becomes a stable
      `mesura://`.

## Smaller things

- [ ] [`lib/database.types.ts`](lib/database.types.ts) is hand-maintained and
      must be edited in the same commit as any schema change. Consider generating
      it from the Supabase CLI instead.
- [ ] Sessions live in unencrypted AsyncStorage, because SecureStore's 2048-byte
      cap silently truncates a Supabase session. Revisit if a chunked
      SecureStore adapter becomes worthwhile.
- [ ] `supabase/schema.sql` is applied by hand. If it grows, consider real
      migrations rather than one idempotent file.
