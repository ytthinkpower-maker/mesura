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

- [ ] **Nothing writes `weekly_target`, `baseline_drinks`, or `drink_cost`.**
      Today reads all three and draws the ring, the status line, and the money
      counter from them, but the only way to set them is
      [`supabase/seed-dev.sql`](supabase/seed-dev.sql) by hand. Onboarding (PRD
      §4) is the real answer; a Settings editor is the cheap one. Until then a
      real new user sees a default 8-drink target and `$0` saved.
- [ ] Settings: weekly limit, drink sizes, reminders — the "Your week" card is a
      placeholder.
- [ ] **The Today lesson teaser has nowhere to go.** It routes to the Lessons
      tab, which still shows its own hard-coded sample rather than the lesson
      the teaser named. Needs the lesson reader, reading
      [`content/lessons.ts`](content/lessons.ts) and writing `lesson_progress`.
- [ ] **Urge toolkit** (PRD §4): the 90-second breathing timer, the trigger
      prompt, swap suggestions. `urge_logs.trigger_note` is therefore always
      null — the sheet logs the outcome and nothing else, deliberately, because
      typing is what the 5-second loop cannot afford.
- [ ] **Streak fairness** (PRD §4): 48-hour backfill, edit/delete an entry, one
      streak repair a week. Right now a drink can only be logged at the moment
      it happens and can never be corrected, which is the top rage-uninstall
      driver in this category.
- [ ] Plan tonight and close the day (PRD §4).
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

## Known limits in the weekly number

None of these are wrong enough to block anything, and all of them are invisible
until the app has been used for a while.

- [ ] **The streak scores past weeks against the _current_ target.** Lower your
      number today and last month's weeks are re-judged against it, possibly
      shortening a streak the user already earned. Fixing it needs the target
      stored per week — which History wants anyway.
- [ ] **`streakFrom` pulls a year of `drink_logs` on every focus of Today.** Two
      queries and a few hundred rows today, which is fine; it becomes a Postgres
      aggregate the moment accounts are old enough for that to be a real page.
- [ ] **Money is formatted as USD**, because `profiles` has no currency column.
      `drink_cost` is just a number, so a user in euros sees their own figure
      with the wrong symbol in front of it. Add `currency` alongside the
      onboarding question that sets `drink_cost`.
- [ ] **The date line does not tick over at midnight** while the app sits open
      on Today. It refreshes on focus, which covers everything except leaving
      the screen open across midnight.

## Smaller things

- [ ] [`lib/database.types.ts`](lib/database.types.ts) is hand-maintained and
      must be edited in the same commit as any schema change. Consider generating
      it from the Supabase CLI instead.
- [ ] Sessions live in unencrypted AsyncStorage, because SecureStore's 2048-byte
      cap silently truncates a Supabase session. Revisit if a chunked
      SecureStore adapter becomes worthwhile.
- [ ] `supabase/schema.sql` is applied by hand. If it grows, consider real
      migrations rather than one idempotent file.
