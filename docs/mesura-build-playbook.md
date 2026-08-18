# Mesura — Paste-Ready Build Playbook (v3 — zero-assumptions edition)

Every step written for a non-technical builder. Exact prompts. Exact clicks. Nothing assumed.
Stack: React Native + Expo SDK 54 (managed) · Supabase · RevenueCat (App Store IAP) · built with Claude Code
Companion file: mesura-launch-checklist.xlsx

---

# PART A — One-time computer setup (do this once, before Phase 0)

## A.1 Words you'll see in this playbook (read once)

- **Terminal** — an app on your computer where you type text commands instead of clicking. Claude Code runs inside it. You will only ever type the few short commands this playbook gives you.
- **Claude Code** — the AI agent that writes all the code. You paste instructions ("prompts") into it; it builds the app.
- **Prompt** — a block of instructions you copy from this playbook and paste into Claude Code, exactly as written.
- **Repo (repository)** — your project's folder, with a full history of every saved version, stored on GitHub.
- **Commit** — a saved snapshot of the project. **Push** — uploading that snapshot to GitHub. Together they're your save-points: if anything breaks, we roll back to the last one.
- **.env file** — a small text file holding private settings. It stays on your computer and is never uploaded.
- **Expo Go** — a free iPhone app that shows you the Mesura app while it's being built, by scanning a QR code.
- **Supabase** — the online service that stores user accounts and data. **RevenueCat** — the service that handles subscriptions. **EAS** — Expo's service that packages the finished app for the App Store.

## A.2 Install Node.js (the engine Expo needs)

1. In your web browser, go to **nodejs.org**.
2. Click the big green button labeled with **"LTS"** (it will say something like "Download Node.js (LTS)"). LTS means the stable version — always pick this one, never "Current."
3. Open the downloaded file and click Continue/Next through the installer, accepting the defaults. Enter your computer password if asked.

## A.3 Install Claude Code

**On a Mac:**

1. Open the **Terminal** app: press Cmd + Space, type `Terminal`, press Return. A window with text appears — that's it.
2. Copy this entire line, paste it into Terminal, and press Return:
   `curl -fsSL https://claude.ai/install.sh | bash`
3. Wait for it to finish (a minute or two). Then **close Terminal completely and open it again** (this refresh matters).
4. Type `claude --version` and press Return. If you see a version number, it worked.

**On Windows:**

1. Open **PowerShell**: press the Windows key, type `PowerShell`, press Enter.
2. Paste this line and press Enter: `irm https://claude.ai/install.ps1 | iex`
3. Close PowerShell, reopen it, type `claude --version`, press Enter. A version number = success.

If either machine says "command not found," don't troubleshoot yourself — Claude Code's docs at code.claude.com/docs cover it, or tell me the exact message you see.

## A.4 Sign in to Claude Code

1. In Terminal (or PowerShell), type `claude` and press Return.
2. The first time, it opens a browser page asking you to sign in with your Claude account. Sign in and approve.
3. You'll land back in Terminal with a Claude Code prompt waiting for input. Type `/exit` and press Return to leave for now.

## A.5 Create the project folder and learn the two commands you'll reuse forever

1. In Terminal, type these two lines, pressing Return after each:
   `mkdir mesura`
   `cd mesura`
   (`mkdir` makes a folder named mesura; `cd` steps inside it.)
2. Type `claude` and press Return. Claude Code is now running **inside your project folder** — this is where every prompt in this playbook gets pasted.
3. **Every future work session starts the same way:** open Terminal, type `cd mesura`, press Return, type `claude`, press Return. That's the whole ritual.

## A.6 How to paste a prompt

1. In this playbook, prompts appear as indented blocks starting with ">". Select the whole block (every line of it), copy it.
2. Click into the Claude Code window and paste. Press Return to send.
3. **Wait until it completely stops working** before you do anything else. It will narrate what it's doing; you don't need to read every line, but do read its final summary.
4. If it asks you a question mid-task, answer it in plain English, like a text message.

---

# PART B — The build

## Rules that apply to every step (read once, follow always)

1. **One prompt per step.** Paste it exactly. Wait for it to finish.
2. **Verify before moving on.** Every step ends with a numbered VERIFY list. Do every check. If even one fails, use the Recovery prompt, then re-run the ENTIRE verify list — not just the failed check.
3. **Commit after every verified step.** When a verify list passes, paste this with the step number filled in:
   > **COMMIT PROMPT:** All checks for step [X.Y] passed. Commit everything with the message "Step [X.Y]: [one-line description]" and push to GitHub. Confirm the push succeeded and tell me the commit message you used.
4. **Recovery prompt** (when a check fails):
   > Something went wrong in step [X.Y]. Expected: [WHAT THE VERIFY CHECK SAYS]. Actual: [PASTE THE ERROR OR DESCRIBE WHAT YOU SEE]. Diagnose the cause, explain it in one plain-English sentence, then fix it. Do not change anything unrelated. If your fix touches other features, tell me which verify lists to re-run.
5. **Two stop signs.** If Claude Code ever proposes "ejecting" from Expo's managed workflow, or adding a "custom native module," STOP and paste:
   > Do not eject and do not add custom native modules. Find a solution inside Expo's managed workflow with officially supported SDK-54-compatible packages. If truly impossible, stop and explain why in plain English instead of proceeding.
6. **Fresh session per phase.** At the start of each phase: `/exit`, then `claude` again (still inside the mesura folder). Prompts from Phase 2 onward begin with "Read CLAUDE.md and PRD.md" to reload context.
7. **The only secret rule you must memorize:** the Supabase Project URL and "anon key" are SAFE to paste into Claude Code when it asks (they're designed to be public). The **Anthropic API key is NEVER pasted into Claude Code, never put in any project file** — in Phase 7 you type it directly into the Supabase website, nowhere else.
8. **You never write code.** You paste prompts, look at your iPhone, run verify lists, and decide.

---

## Phase 0 — Accounts (all done in your web browser, no prompts, no commits)

Websites change their buttons occasionally, so these steps say what to look for rather than exact labels. If a screen doesn't match, look for the nearest equivalent — or ask me.

**0.1 Apple Developer Program** — Go to **developer.apple.com** → "Account" → sign in with your Apple ID → find "Enroll" → choose Individual → pay $99/yr. Approval takes 1–2 days; you'll get an email.

**0.2 Reserve the app name** — After approval: go to **appstoreconnect.apple.com** → sign in → "Apps" → the "+" (plus) button → "New App" → Platform: iOS → Name: type exactly `Mesura: Drink Less` → Primary language: English (U.S.) → Bundle ID: if the dropdown is empty, choose "create a new one" style option or ask me → SKU: type `mesura001` → click Create. **If it says the name is taken, stop and tell me.**

**0.3 Google Play Console** — **play.google.com/console** → sign up as an individual → pay the one-time $25. Create an app named `Mesura` (Android ships later; this just holds the name).

**0.4 Supabase** — **supabase.com** → Sign up (using GitHub sign-in is fine) → "New project" → name it `mesura-dev` → set a database password (save it in your password manager) → region: closest to you → Create. When it finishes loading, click the gear/"Project Settings" → "API": you'll see **Project URL** and **anon public** key. Save both in your password manager labeled DEV. Repeat everything once more for a project named `mesura-prod`, saving its URL + anon key labeled PROD.

**0.5 RevenueCat** — **revenuecat.com** → sign up → create a project named `Mesura`. Stop there; Phase 8 configures it.

**0.6 Expo** — **expo.dev** → sign up (save credentials). On your iPhone: App Store → search **Expo Go** → Get. (The App Store's Expo Go supports SDK 54, which is why this project pins SDK 54 until Phase 10, where EAS builds replace Expo Go.)

**0.7 GitHub** — **github.com** → sign up → the "+" in the top corner → "New repository" → name: `mesura` → select **Private** → Create repository. On the page that appears, copy the URL ending in `.git` (looks like `https://github.com/yourname/mesura.git`) and save it.

**0.8 Anthropic API key** — **console.anthropic.com** → sign up → find "API Keys" → create a key → copy it into your password manager immediately (it's shown once). Remember rule 7: this key is typed only into the Supabase website in Phase 7. Never into Claude Code, never into any file.

**0.9 Domain** — At any registrar (Namecheap, Cloudflare, GoDaddy): register your Mesura domain (try drinkmesura.com or mesura.app). It only needs to host a landing page and the privacy policy later.

**VERIFY 0:**

1. You can sign into all seven services using saved credentials (actually test each login).
2. App Store Connect → Apps shows `Mesura: Drink Less`.
3. Your password manager holds: both Supabase URLs + anon keys (DEV and PROD), the database passwords, the Anthropic key, the GitHub repo URL.
4. Expo Go opens on your iPhone (it will look empty — that's normal).
5. Your GitHub repo page loads in the browser and says it's empty.

---

## Phase 1 — Project scaffold

Open Terminal → `cd mesura` → `claude`.

**Prompt 1.1** (replace [YOURNAME] with your GitHub username before pasting):

> Create a new React Native app using Expo's managed workflow with TypeScript, in this folder. Name it Mesura. Requirements:
>
> - Expo SDK 54, latest 54.x patch — this project must run in the App Store version of Expo Go, which supports SDK 54 only. If create-expo-app asks, choose the App-Store-Expo-Go-compatible option. Expo Router for navigation. Verify every dependency you add has an SDK-54-compatible version and pin it.
> - Folder structure: app/ (routes), components/, lib/, content/, constants/.
> - Create CLAUDE.md at repo root recording: the product one-liner ("Mesura turns 'I should drink less' into a weekly number the user controls and can win"), the stack, the two hard rules (never eject, never add custom native modules), and the brand token names so future sessions stay consistent.
> - ESLint + Prettier with sensible defaults.
> - Initialize git with a .gitignore that excludes ALL env files and secrets. Connect the remote https://github.com/[YOURNAME]/mesura.git, make the first commit "Step 1.1: project scaffold", and push. If pushing asks for authentication, walk me through GitHub sign-in step by step, assuming I have never done it.
> - Placeholder tab navigation with five tabs: Today, History, Lessons, Challenge, Settings.
>   When done, tell me: (a) the exact expo version installed, (b) the exact command I type to see the app on my iPhone with Expo Go, explained for someone who does not code.

**How to view the app on your iPhone (you'll do this constantly):**

1. Claude Code will give you a command, usually `npx expo start`. Type it in a second Terminal window (open a new one, `cd mesura` first) or ask Claude Code to run it.
2. A large QR code appears in the Terminal. Make sure your iPhone is on the **same Wi-Fi as your computer**.
3. Open the iPhone **Camera** app, point it at the QR code on your screen, and tap the yellow "Open in Expo Go" banner that pops up.
4. The Mesura app loads on your phone. It updates live as Claude Code changes code. To stop the preview: click into that Terminal window and press Ctrl + C.

**VERIFY 1.1:**

1. Claude Code reported an expo version starting with **54**.
2. The QR scan opens Mesura in Expo Go — no "version mismatch" or "incompatible SDK" error.
3. All five tabs (Today, History, Lessons, Challenge, Settings) appear and switch when tapped.
4. In your browser, refresh your GitHub repo page: the code files are there. Click the file named `.gitignore` and confirm the list includes `.env`. Confirm there is NO file named .env visible in the repo.
5. Click CLAUDE.md on GitHub: it contains the one-liner and both hard rules.

_(The commit happened inside this step — no separate commit prompt.)_

---

## Phase 2 — Brand system ("First Light")

Fresh session: `/exit`, then `claude`.

**Prompt 2.1:**

> Read CLAUDE.md first. Implement the Mesura brand system as design tokens in constants/brand.ts and apply app-wide.
>
> - Brand color "spruce" #14594A: primary buttons, weekly progress ring, streak highlights, active tab. Winning ALWAYS renders in spruce — never a separate green.
> - Neutrals: paper #FAF8F3 (all backgrounds — light and warm, never dark-dominant), ink #191C1B (primary text).
> - Over-target/errors: muted rose #C25B6E, sparingly. Never alarm-red, never scolding.
> - AI-generated text: slate #5C6B68.
> - Typography: system font (SF Pro) for UI; New York serif for lesson body text only.
> - Radius 12 on cards, 999 on pills. Generous whitespace. No gradients, no shadows.
> - Restyle the five-tab shell and build reusable components: PrimaryButton, Card, StatTile, ProgressRing (SVG ring taking current + target, fills in spruce, open gap at top). Put a demo ProgressRing (5 of 8) on Today.
>   Update CLAUDE.md's brand section to match exactly what you implemented.

**VERIFY 2.1:**

1. On your phone: warm off-white backgrounds and deep-green accents everywhere; nothing default-blue remains on any tab.
2. Today shows the demo ring, filled about 5/8, with a small open gap at the top.
3. Tap through all five tabs: the active tab's icon/label is green (spruce).
4. Paste into Claude Code: "Show me constants/brand.ts" — check the four color codes on screen match this page: #14594A, #FAF8F3, #191C1B, #C25B6E.
5. Ask: "Show me the brand section of CLAUDE.md" — same values there.

→ **Paste the COMMIT PROMPT for step 2.1.**

---

## Phase 3 — Supabase: accounts and data

The PRD already lives at `PRD.md` in the repo root — it is the single source of
truth for product decisions. Nothing to paste; the prompts below refer to it by
name.

**Prompt 3.1:**

> Read CLAUDE.md and PRD.md. Set up Supabase for Mesura using our DEV project. Ask me for the Project URL and anon public key and I will paste them here (these are safe, publishable values). Put them in a .env file yourself and confirm .env is excluded from git.
> Build:
>
> - Email + Apple Sign-In auth with a working "forgot password" email recovery flow. Account recovery is a headline feature — treat it as such.
> - Tables: profiles (goal_mode, weekly_target, drink_cost, timezone), drink_logs (timestamp, drink_type, quantity), urge_logs (timestamp, outcome, trigger_note), lesson_progress, challenge_memberships.
> - Row Level Security on every table: a user can only read/write their own rows. Show me each policy with a one-sentence plain-English explanation.
> - Data export: user can request complete data as JSON via the iOS share sheet.
> - Full account deletion callable from the app: deletes the auth user and all their rows.
>   If any of this requires me to click things in the Supabase website (like running SQL or enabling Apple Sign-In), give me numbered click-by-click steps and wait for me to confirm each before continuing.
>   Wire sign-up, sign-in, sign-out, forgot-password screens in the brand system — minimal: email, one button, done.

When it asks, paste the DEV Project URL and anon key from your password manager.

**VERIFY 3.1:**

1. On your phone, create a real account with your actual email. Then force-quit the app (swipe up from the bottom of the screen and pause to see open apps, then swipe the Expo Go card up and away). Reopen via the QR code: you're still signed in.
2. Sign out, tap "forgot password," enter your email: the reset email arrives in your inbox within ~2 minutes (check spam).
3. In your browser: supabase.com → the mesura-dev project → "Table Editor" (left sidebar) → profiles: one row exists (yours).
4. RLS proof: sign up a SECOND account in the app with a different email. Then paste into Claude Code: "Prove that account B cannot read account A's rows — run the check and show me the result in plain English." It should demonstrate the block.
5. In the app, log 2 fake drinks, then use the export: a JSON file appears in the iPhone share sheet; open it and see your 2 entries.
6. Delete the SECOND account from inside the app; refresh the Table Editor: its rows are gone. (Keep account A — that's your daily test account.)
7. In your browser, check GitHub: no .env file anywhere in the repo.

→ **COMMIT PROMPT for step 3.1.**

---

## Phase 4 — The core loop (this is the product)

Fresh session.

**Prompt 4.1 — logging:**

> Read CLAUDE.md and PRD.md section 3. Build the Today screen and drink logging.
> Today shows: date; ProgressRing (drinks-this-week vs weekly_target); plain-English status ("On track — 3 left, 3 days to go"); StatTiles for money saved and streak; big "Log drink" and "Urge" buttons; today's lesson teaser.
> Log drink: bottom sheet with the user's three most-used drink types as one-tap options + "other." One tap logs, sheet closes itself, ring animates. Under 5 seconds, never requires typing.
> Money saved = (baseline weekly drinks − actual) × drink_cost, never negative. Weeks run Sunday–Saturday in the user's timezone.
> Ring animation: rewarding but calm — smooth fill, no confetti.
> For testing, set my profile to: baseline 10 drinks/week, weekly target 8, drink cost $8.

**VERIFY 4.1:**

1. Open your phone's Clock app → Stopwatch. Start it, log a drink, stop: under 5 seconds, zero typing.
2. The ring animates smoothly and the status line count drops by one.
3. With 6 drinks logged this week, paste: "Walk me through the money-saved number on screen right now, showing the arithmetic." Expect (10−6)×$8 = **$32**, and the screen shows $32.
4. Log drinks up to 11 total: the saved amount shows **$0**, never a negative number.
5. Force-quit and reopen: today's count is still correct.

→ **COMMIT PROMPT for step 4.1.**

**Prompt 4.2 — Urge SOS:**

> Read CLAUDE.md and PRD.md section 3. Build Urge SOS. Tapping "Urge" opens a full-screen calm view: headline "Riding it out," subline "Most urges pass in about 20 minutes." A 90-second breathing circle (expand 4s / hold 4s / contract 6s) in spruce on paper. Below: a one-line trigger note field ("What triggered this?"), a rotating swap suggestion from a list of 15, and the primary button "I rode it out — count it" → logs outcome rode_it_out, brief "Urge survived — that's a win" state, returns to Today where a lifetime "urges survived" tally is visible. Quiet secondary path: "I had the drink" logs the drink normally with zero shaming copy. This screen must feel like a deep breath, not a form.

**VERIFY 4.2:**

1. Watch the circle and slowly count "one-two-three-four": the expand phase matches your count.
2. Tap "count it": the win state appears; back on Today the urges-survived tally reads 1. Do it again: 2.
3. Take the "I had the drink" path and read every word on that screen out loud: nothing shaming, no exclamation marks. Today's drink count went up by one.
4. Run the flow again without typing anything in the trigger note: counting the win still works.
5. Open Urge SOS three separate times: the swap suggestion changed at least once.

→ **COMMIT PROMPT for step 4.2.**

**Prompt 4.3 — plan tonight, close the day, milestones, streak fairness:**

> Read CLAUDE.md and PRD.md sections 4 and 5. Add four FREE-tier features:
>
> 1. Plan tonight: from Today, set an intended drink count for this evening in two taps. Afterward compare plan vs. actual; meeting it shows "Stuck to your plan" in spruce; missing it shows the numbers with zero shaming copy.
> 2. Close the day: optional evening ritual (one tap from a gentle ~8pm notification the user can disable, or from Today): confirm today's count. Zero days get a brief spruce celebration. Under 5 seconds.
> 3. Milestones: full-screen celebrations at 7/14/30/60/100-day streaks and 5/25/50/100 urges survived. Calm brand voice, no confetti. Each has Share → exports a clean branded image (milestone number, ring, wordmark, no personal data).
> 4. Streak fairness: backfill logs up to 48 hours late, edit/delete any entry, one "streak repair" per week. Streaks must never die because someone forgot to open the app.
>    Also add a hidden developer menu for testing: opened by tapping the version number in Settings 10 times. It must let me simulate a 7-day streak, simulate any lesson day, and trigger tonight's 8pm notification now.
>    Update CLAUDE.md's feature list.

**VERIFY 4.3:**

1. Plan 3 drinks for tonight, log 2, close the day: "Stuck to your plan" appears in green.
2. Plan 2, log 4, close the day: the numbers show; read the copy aloud — zero negative language.
3. Close a day with zero drinks: the zero-day celebration appears.
4. Backfill: add a drink dated yesterday through the edit flow; your streak survives and yesterday's count updates.
5. Edit one entry's drink type, then delete another entirely: the ring and money numbers update both times.
6. Settings → tap the version number 10 times → dev menu opens → simulate a 7-day streak: the milestone screen appears. Tap Share: an image saves to Photos with no personal data on it.
7. Dev menu → trigger the 8pm notification: it appears on your lock screen. Turn it off in Settings, trigger again: nothing appears.

→ **COMMIT PROMPT for step 4.3.**

---

## Phase 5 — Onboarding and the safety screen

Fresh session.

**Prompt 5.1:**

> Read CLAUDE.md and PRD.md sections 4 and 9. Build onboarding, shown once before account creation:
>
> 1. Warm welcome: "Mesura turns drinking less into a number you control." No lectures.
> 2. Habit questions, one per screen, big tap targets: drinks per typical week (slider), heaviest day, usual drink types (sets quick-log presets), average cost per drink.
> 3. Goal mode: "Cut back" or "Alcohol-free" — equal options, switchable later.
> 4. SAFETY SCREEN — required logic, do not soften: thresholds are 6+ drinks/day or 35+/week. When exceeded, show a dedicated caring plain-English screen: stopping abruptly can be medically dangerous for heavy regular drinkers; Mesura is educational, not medical treatment; SAMHSA National Helpline 1-800-662-4357 (tappable); "talk to your doctor." The user can continue, but the screen cannot be dismissed in under 3 seconds. Alcohol-free mode shows a persistent one-line version in goal settings.
> 5. Weekly target suggestion (meaningful reduction, not impossible), adjustable with a stepper.
> 6. Then account creation → paywall placeholder → Today.
>    Brand system throughout. Typical completion under 3 minutes.
>    To let me re-test onboarding, add "reset onboarding" to the dev menu.

**VERIFY 5.1:**

1. Dev menu → reset onboarding. Answer as a heavy drinker (40/week): the safety screen appears; tapping the phone number offers to call; the continue button doesn't respond for the first ~3 seconds.
2. Read the safety screen out loud: caring, not clinical, not preachy — you'd show it to a friend without embarrassment.
3. Reset again, answer lightly (6/week): no safety screen.
4. The drink types you chose appear as the quick-log buttons on Today.
5. The suggested weekly target is below your stated intake but above zero; the stepper changes it.
6. Reset once more and run the light path against the Stopwatch: under 3 minutes total.
7. Settings → switch goal mode to alcohol-free: the persistent one-line safety notice appears there.

→ **COMMIT PROMPT for step 5.1.**

---

## Phase 6 — Lessons (the 60-day delivery system)

The 60 lessons themselves are drafted with me in Claude chat, reviewed by your clinician, then dropped in as files. This phase builds the delivery system with placeholders.

**Prompt 6.1:**

> Read CLAUDE.md. Build the lesson system: content/lessons/ holds day-01.md … day-60.md with frontmatter (title, day, audio_url optional). Generate placeholders now with real titles following PRD.md section 10's arc.
>
> - Lessons tab: vertical journey list. Completed days check off in spruce; today's is prominent; future days visible but locked ("Unlocks tomorrow morning").
> - Day N unlocks on the user's Nth morning (their timezone). Missing days never punishes — next lesson is simply the next unread one.
> - Reader: serif body, comfortable size, estimated read time, audio button when audio_url exists, one "Done — back tomorrow" button.
> - Today's teaser deep-links to today's lesson. Wire the dev menu's lesson-day simulation to this system.

**VERIFY 6.1:**

1. Tap the teaser on Today: today's lesson opens; the text is in a serif (bookish) font, clearly different from the rest of the app.
2. Tap "Done — back tomorrow": the Lessons tab now shows a green check on day 1.
3. Day 2 shows "Unlocks tomorrow morning" and does not open when tapped.
4. Dev menu → simulate day 2: lesson 2 unlocks; lesson 3 stays locked.
5. Dev menu → simulate day 5 without completing 2–4: the next offered lesson is 2 (no punishment, no gap).
6. Spot-check titles for days 1, 8, 22, 41 against PRD §10's arc — they match the themes.

→ **COMMIT PROMPT for step 6.1.**

---

## Phase 7 — Weekly AI report

Fresh session. This is the one phase touching the Anthropic key. The key goes ONLY into the Supabase website, by your hands.

**Prompt 7.1:**

> Read CLAUDE.md. Build the weekly report via a Supabase Edge Function so the Anthropic API key stays server-side. HARD SECURITY RULE: the key lives only in Supabase secrets — I will type it into the Supabase dashboard myself; you will never see it. If any step would put it in the app bundle or ask me to paste it here, stop and redesign. Give me numbered click-by-click steps for adding the secret in the Supabase website when we reach that point, and wait for my confirmation.
>
> - Edge Function runs per user Sunday 9am local (and on demand): gathers the week's drink_logs, urge_logs, target, streak; calls the Anthropic API (model claude-sonnet-4-6) producing exactly 3 observations + 1 next-week suggestion.
> - Voice rules in the system prompt, verbatim: warm and specific; never praise drinking; never shame a missed target; always frame next week as winnable; observations must cite the user's actual numbers and days; suggestion must be one small concrete change.
> - Report screen: week bar chart (spruce bars; rose only for days over daily guideline), observations + suggestion in slate with an "AI-generated" label, target vs. actual. History tab lists past reports + calendar heat view.
> - Push notification when the report is ready (Expo Notifications). Add "generate my report now" and "fill this week with sample data" to the dev menu.
>   Show me the Edge Function's full system prompt when done.

When it gives you the secret-adding steps, they'll look like: supabase.com → your mesura-dev project → Edge Functions or Project Settings → "Secrets" → Add secret → name it exactly what Claude Code specifies → paste the Anthropic key from your password manager → Save. Type "done" in Claude Code afterward.

**VERIFY 7.1:**

1. Dev menu → fill sample week → generate report now: exactly 3 observations + 1 suggestion appear.
2. The observations mention YOUR actual numbers and days (e.g., "Friday's 4 drinks") — not generic filler.
3. Tone test: read it imagining you'd blown past target all week — nothing scolds; next week reads winnable.
4. The bar chart shows rose only on over-guideline days, spruce elsewhere.
5. Paste: "Search the entire codebase and app configuration for any string of an Anthropic API key or the text sk-ant. Show me the search command and its result." The result must be empty.
6. The "report ready" push notification arrives on your phone.
7. Read the system prompt it shows you: all five voice rules present, word for word.

→ **COMMIT PROMPT for step 7.1.**

---

## Phase 8 — RevenueCat paywall and free tier

**Hand-work first (~15 min in the browser):**

1. **appstoreconnect.apple.com** → Apps → Mesura: Drink Less → find "Subscriptions" (under Monetization or Features) → Create a Subscription Group (name: `Mesura Premium`) → inside it create two subscriptions:
   - Reference name `mesura_monthly`, product ID `mesura_monthly`, price **$12.99/month**, then add an Introductory Offer: **Free trial, 7 days**.
   - Reference name `mesura_annual`, product ID `mesura_annual`, price **$69.99/year**, no trial.
     Fill any required localization fields plainly (display name "Mesura Monthly"/"Mesura Annual").
2. **Sandbox test account** (a fake Apple ID for free test purchases): App Store Connect → "Users and Access" → "Sandbox" / "Sandbox Testers" → add tester. Use an email you can invent (it doesn't need a real inbox) and save the password.
3. **app.revenuecat.com** → your Mesura project → connect the App Store app (it will ask for identifiers from App Store Connect; follow its on-screen guide) → Products: add both product IDs → create an Entitlement named exactly `full` and attach both products → create an Offering named `default` containing both.
   If any screen doesn't match, tell me what you see.

**Prompt 8.1:**

> Read CLAUDE.md and PRD.md section 7. Integrate RevenueCat with entitlement "full." Ask me for our RevenueCat public API key and tell me exactly where in the RevenueCat website I find it.
> Free forever: drink logging, progress ring, plan-tonight, close-the-day, streaks + milestone celebrations, lessons days 1–7. Paid ("full"): lessons 8–60, urge toolkit's breathing + swaps (the "count it" button stays FREE — never paywall the win), AI weekly reports, challenges + wins wall, money/calorie insights.
> Day-7 moment: when a free user finishes lesson 7, show a dedicated screen — "You've finished Baseline week. Week two is where the mechanics start." — with the paywall below. The copy must say plainly that days 1–7 were the free portion.
> Paywall (trust rules rendered literally): shown at end of onboarding and on locked-feature taps; both prices with annual math ("$69.99/yr — $5.83/mo"); trial described exactly ("7 days free, then $12.99/month. We'll remind you on day 5."); the line "Cancel anytime in your iPhone's Settings — no emails, no hoops."; "Maybe later" plainly visible, body-text size, never hidden or delayed.
> Day-5 trial reminder local notification. Locked features show a small spruce lock + one-line upsell — never a full-screen interruption mid-task.
> Set up sandbox testing and give me plain-English numbered steps to run a sandbox purchase on my iPhone using my sandbox tester account, assuming I've never done it.

**VERIFY 8.1:**

1. Follow its sandbox steps on your phone (you'll sign into the sandbox account when iOS asks during purchase — never your real Apple ID password on a purchase sheet that says [Environment: Sandbox]): the trial "purchase" completes and lessons 8+ unlock immediately.
2. app.revenuecat.com → your project → look for recent transactions/customers: the sandbox purchase shows with entitlement `full`.
3. Dev menu → reset onboarding → run through and tap "Maybe later" on the paywall: you land in the free app, and logging, ring, plan-tonight, close-the-day, milestones, and lessons 1–7 all work.
4. As that free user: tap lesson 8 → the day-7 boundary screen with the disclosed-boundary copy; tap the AI report → a small lock and one line, not a full-screen takeover.
5. As that free user: Urge → "count it" still works (never paywalled).
6. Read the paywall out loud: both exact prices, the $5.83 annual math, the exact trial sentence, the cancel-anytime line; "Maybe later" is the same size as normal text.
7. On the subscribed account: Settings → Restore Purchases: access returns, no second charge appears.

→ **COMMIT PROMPT for step 8.1.**

---

## Phase 9 — Challenge mode, Settings, and polish

Fresh session.

**Prompt 9.1:**

> Read CLAUDE.md. Build the remaining PRD.md items:
>
> - Challenge tab: admin-created cohort challenges (start date, duration, mode). One-tap join; during a challenge show MY progress + aggregate cohort stats (member count, total drink-free days, average vs target) + the "wins wall": system-generated milestone cards ("Someone in your cohort hit 14 days") with anonymous auto-assigned handles. ONLY user input on the wall: tapping one of 3 preset emoji reactions. No free text anywhere, no chosen usernames, no user-generated content — nothing one user types is ever shown to another user. Add "create a test challenge" to the dev menu.
> - Settings: edit weekly target, goal mode, drink cost, presets; notification preferences; restore purchases; manage subscription (deep-link to iOS subscription settings); export my data; delete my account (double-confirm → Phase 3 deletion); privacy policy + terms links; support email link with device info pre-filled.
> - Empty/error/offline states for every screen in brand voice: helpful, never blaming, no exclamation marks.
> - App icon: the Mesura ring, open gap at top, spruce on paper. Full iOS icon set.

**VERIFY 9.1:**

1. Dev menu → create a test challenge → join it: your progress and cohort numbers render; tap an emoji on a wins-wall card and it visibly registers.
2. Look over the whole Challenge tab: there is nowhere to type text. Anywhere.
3. Walk EVERY Settings row top to bottom and check each does what it says: change the weekly target and watch the ring change; "manage subscription" opens iPhone subscription settings; the support link opens an email draft with device info already filled in.
4. Delete-account asks you twice; delete your test account B (recreate it first if needed) and confirm in the Supabase Table Editor its rows are gone.
5. Swipe into Control Center and turn ON Airplane Mode. Open every tab: calm, branded messages — no crashes, no raw error codes. Log a drink while offline. Turn Airplane Mode OFF, wait a few seconds, then paste: "Show me that the offline drink log synced to Supabase."
6. Close and reopen Expo Go: the app icon shown for the project is the green ring on the warm background. (The real home-screen icon appears at Phase 10's TestFlight build — check it again there.)

→ **COMMIT PROMPT for step 9.1.**

---

## Phase 10 — Hardening and TestFlight

Fresh session. From here Expo Go retires; your phone gets a real installable build via TestFlight (Apple's official beta app — install **TestFlight** from the App Store on your iPhone now).

**Prompt 10.1:**

> Read CLAUDE.md. Prepare Mesura for TestFlight:
>
> 1. Upgrade from Expo SDK 54 to the current stable SDK (Expo Go no longer matters — TestFlight uses EAS builds). Official upgrade path one SDK at a time, npx expo install --fix, resolve breaking changes, re-verify end to end on a simulator, and tell me what changed in plain English.
> 2. Switch the app to the mesura-prod Supabase project. Ask me for the PROD Project URL and anon key and update the environment config yourself. Then re-verify auth, RLS, export, deletion against prod and show me the results.
> 3. Write and run a test pass: week-boundary math across timezones, streak logic (including a no-log day), money-saved math, paywall gating of every premium feature, safety-screen thresholds, offline logging + sync. Report results as a plain-English pass/fail list.
> 4. Audit against App Store Review Guidelines for a health-adjacent app: account deletion, privacy policy link, medical disclaimer, no unsupportable health claims. List anything risky in plain English.
> 5. Configure EAS Build and produce an iOS build. Then give me numbered click-by-click steps, assuming zero experience, to get it into TestFlight and install it on my own iPhone, and to invite testers by email.
> 6. Draft the privacy policy + App Store privacy-label answers matching exactly what we collect.

**VERIFY 10.1:**

1. Claude Code reports the new SDK version and a passing simulator run.
2. On your iPhone, the TestFlight app shows Mesura; install it. Create a fresh account (this is PROD — real data now), complete onboarding, log a drink, run an export: all work.
3. The test-pass list shows zero failures.
4. The risk list is empty, or every item has a fix you explicitly approved.
5. Paste: "List every piece of user data we collect and where each appears in the privacy-label answers." Nothing collected is missing from the labels.
6. Repeat the Phase 7 key search on the final build configuration: still empty.
7. The home-screen icon on the TestFlight install is the spruce ring on paper.

→ **COMMIT PROMPT for step 10.1** — and add: "Also tag this commit v1.0-beta."

---

## Phase 11 — Store listing and launch

**11.1 Hand-work in App Store Connect** (Apps → Mesura → the version page):

- Screenshots: take them on your iPhone from the TestFlight build (Today, Urge SOS, weekly report, paywall). iPhone screenshots: press the side button + volume-up together. Upload where the version page asks for screenshots; if it demands specific sizes, ask Claude Code to resize them for each required slot.
- Subtitle: `Drink less. Feel better.`
- Keywords field: `alcohol tracker,mindful drinking,drink less,dry january,sober curious,moderation`
- Age rating questionnaire: answer honestly about alcohol references (expect a 17+ rating — that's normal for this category).
- Support URL + privacy policy URL: pages on your domain (Claude Code drafted the privacy policy in Phase 10; ask it to generate the simple web pages too, and tell it where your domain is hosted for posting steps).

**Prompt 11.2:**

> Read CLAUDE.md and PRD.md sections 1 and 1.1. Write the App Store description for Mesura: Drink Less. Lead with the number-you-control promise, then the urge-survived mechanic, then a plain-spoken "Our promises" section (honest billing, cancel-anytime, data export, real support). Include the medical disclaimer line. No hype words, no exclamation marks, no unsupportable outcome claims. 3,000 characters max. Tell me the character count.

**VERIFY 11.2:**

1. Read the description aloud: every promise is one the shipped app actually keeps — check each against what you verified in Phases 3–9.
2. Zero exclamation marks; zero medical/outcome claims ("helps you track" yes; "reduces addiction" no).
3. Reported character count under 3,000.
4. The medical disclaimer line is present.

→ **COMMIT PROMPT for step 11.2** — add: "Also tag this commit v1.0."

**11.3 Submit** — On the version page, paste the description, attach the build (it offers the TestFlight build), answer the export-compliance question (Claude Code will tell you the right answer for our setup — ask it), and click Submit for Review. Do this **early December** to leave buffer for a rejection cycle. If rejected: copy Apple's rejection text into the Recovery prompt.

**11.4 Marketing calendar** — influencer affiliate outreach now → low-spend Meta creative testing Nov–Dec → main push Dec 26–Jan 31 with the Dry(ish) January challenge live in-app (create it via the admin flow, not the dev menu — ask Claude Code for the steps when ready).

---

## Reference card — prompts you'll reuse constantly

- **Commit:** rule 3. · **Recovery:** rule 4. · **Stop sign:** rule 5.
- **Explain:** "Explain what you just built in plain English, as if to someone who doesn't code, in under 8 sentences."
- **Show me:** "Give me numbered steps to see this change running on my iPhone right now."
- **Voice check:** "Review every user-facing string you added this session against these rules: warm, plain, never shaming, no exclamation marks, no medical claims. List and fix violations."
- **Rollback:** "Discard all uncommitted changes and restore the project to the last commit. Confirm the working state matches step [X.Y]."
- **Where am I?** (after any break) "Read CLAUDE.md and the git log. Tell me in plain English which playbook step we finished last and what comes next."
