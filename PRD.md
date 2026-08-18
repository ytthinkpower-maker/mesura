# Mesura — Product Requirements Document

Store listing: "Mesura: Drink Less" · Mindful drinking tracker · v1.1 · August 2026
Verdict basis: 8.0/10 Build (vs. Reframe, Sunnyside, I Am Sober)

---

## 1. Positioning

The drink tracker that respects paying customers. Wellness-coded (premium fitness/sleep-app aesthetic), never clinical, never recovery-coded. For the gray-middle drinker who wants a number, not an identity.

Differentiators (all Apple-proof — things incumbents' complaint corpus shows they can't or won't fix):

- Account and data reliability: your history never disappears
- Real support: replies within 24h, refunds granted without friction
- No upsells inside a paid subscription — paid is paid
- Billing through App Store IAP only: cancellation lives in iOS Settings, not our support queue

## 1.1 Competitive positioning

Study set: Reframe ($99.99/yr base, coaching tiers to $249/mo), Sunnyside ($12/mo · $99/yr), I Am Sober (free · $39.99/yr), Less (~$5.99/mo), Try Dry (free).

**Vs. Reframe — win on trust and focus:**

- Billing trust is architectural, not promised: 100% App Store IAP means no web-billing path where double-charges or phantom subscriptions can occur. Reframe can't match without dismantling its web-funnel + upsell machinery. (Evidence: documented trial-to-annual charges despite cancellation; web payment followed by in-app payment demand.)
- Data survives: first-class account recovery + user-facing export. (Evidence: paid users reporting vanished subscriptions and unrecoverable data after unanswered support threads.)
- Paid means paid: one price, everything included, no ads or upsells inside a paid tier. (Evidence: "additional costs and ads even with a paid subscription." Structural trap: their ARPU expansion depends on the upsell ladder.)
- Subtraction as advantage: 30-second core loop vs. six years of feature accretion ("cluttered interface" reviews). The gap widens with every feature they add.
- Both modes (cut back / alcohol-free) as a toggle — captures the moderation→abstinence transition both incumbents lose to churn.

**Vs. Sunnyside — win on mechanics and hygiene:**

- Urge-survived credit makes _not drinking_ a first-class logged win; incumbent loop only scores what you drank.
- No SMS at all (push only) + refund posture printed on the paywall. (Evidence: sub-3-star reviews citing continued texts and charges post-cancellation; "nonrefundable" terms contradicting a "nice about refunds" FAQ.)
- AI weekly report interprets patterns and prescribes one winnable adjustment; incumbent charts without interpreting.

**Vs. value tier (I Am Sober / Less / Try Dry) — different category, not a feature fight:**

- They are counters; we are a coach-shaped product (program + urge intervention + AI insight + cohorts) without coach payroll. Our free tier serves the counter-only user until they want more — that's the conversion moment. Never compete on price against this tier.

**Structural advantages (hard to copy):**

- Cost base: API calls + support inbox vs. their coach/Zoom/SMS/telehealth payrolls → $69.99/yr all-inclusive is sustainable for us, margin-dilutive for them.
- Publicly verifiable trust claim: "read our reviews — no billing complaints." Checkable in ten seconds, unavailable to incumbents, and self-enforcing on us.

**Where they beat us (accepted, with mitigations):**

- Human connection (named coaches in multi-year testimonials) → mitigate with cohort challenges + personal-tone AI report; accept residual churn risk.
- Medical reach (Sunnyside Med naltrexone) → out of scope permanently; route users who need it.
- Content depth (160 days vs. our 60) and years of accumulated ratings → offset via influencer affiliates + January challenge; extend content arc post-launch.

## 2. Core Function (one sentence)

Turn "I should drink less" into a weekly number the user controls and can win.

## 3. Core Loop (action → reward, under 30 seconds)

1. Moment occurs: user drinks, or feels the urge to
2. One-tap log: "Log drink" (type pre-selected from their usual) or "Urge"
3. Immediate reward, same screen:
   - Drink logged → progress ring updates, "on track" status, money/calorie counters tick
   - Urge ridden out → "urge survived" credit, streak protected, visible tally of wins-by-restraint
4. Exit. Total time: 5–15 seconds

The urge path is the emotional core: this is an app that rewards you for _not_ doing something. No competitor centers this.

## 4. Accessory Features (only what supports the loop)

- **Onboarding quiz (3 min):** current habits, goal mode (cut back / alcohol-free), weekly target suggestion, drink-cost input (powers money counter), safety screen (see §9)
- **Plan tonight (free, core-loop adjacent):** before an event/evening, user sets an intended drink count in two taps; app compares plan vs. actual afterward and credits "stuck to plan" — the behavioral-science half of moderation that log-after-only misses (Sunnyside's most-loved mechanic)
- **Close the day (free):** optional evening one-tap ritual confirming today's count — zero days get celebrated in spruce, the app's only proactive daily touch; 5 seconds
- **Milestone moments:** 7/14/30/60/100-day and urges-survived milestones get a dedicated celebration screen in brand voice, exportable as a clean shareable image (organic acquisition, zero moderation surface)
- **Streak fairness (anti-rage-uninstall):** 48-hour backfill window for forgotten logs, edit/delete any entry, one "streak repair" per week — unfairly dead streaks are a top habit-app 1-star driver
- **Daily 2-minute lesson:** 60-day content arc (see §10), text + audio, unlocks each morning; days 1–7 free (the "Baseline" arc doubles as the product demo), days 8–60 paid
- **Urge toolkit:** 90-second breathing timer, trigger journaling prompt, swap suggestions
- **Weekly AI report (Claude API):** drinks vs. target, pattern detection (day-of-week, trigger correlation, zero-day context), one concrete suggestion for next week
- **Counters:** money saved, calories avoided, current streak, urges survived (lifetime)
- **Dry(ish) challenge mode:** cohort event with shared start date (January launch vehicle) — shows aggregate cohort stats plus a "wins wall": system-generated milestone cards with anonymous auto-assigned handles and emoji reactions only. No free text, no user-generated content anywhere, zero moderation surface. Cohort-scoped in v1 (solves cold start); app-wide promotion is a v1.1 data decision

## 5. Retention Hooks (unfinished state)

- Tomorrow's lesson visible but locked until morning
- Weekly report always exactly one week from complete
- Evening "close the day" ritual — the only proactive daily touch; zero days celebrated
- Milestone moments approaching (next badge always visible)
- Streak + urges-survived tally (loss aversion, with fairness mechanics so streaks never die unfairly)
- Weekly target resets Sunday night with a fresh "set your week" ritual
- Challenge cohorts: shared countdown, aggregate progress, wins wall reactions

## 6. Screens

Today (home) · Log drink sheet · Urge SOS · Lesson reader · Weekly report · History/calendar · Challenge · Settings (incl. one-tap account deletion + data export) · Onboarding flow · Paywall

## 7. Monetization

- Model: App Store IAP via RevenueCat. No web billing, no Stripe (deliberate divergence from CurbQuote — consumer impulse purchase, store-native discovery, Apple-managed cancellation IS the trust wedge)
- Pricing: $12.99/mo · $69.99/yr (presented as $5.83/mo)
- Paywall placement: end of onboarding, after the quiz produces their personalized weekly target — the moment of highest motivation. Transparent presentation: full price stated, renewal date stated, "cancel anytime in iOS Settings" stated on the paywall itself
- Free tier (answers the category's "free does nothing" complaint while protecting paid CAC payback): drink logging, progress ring, plan-tonight, close-the-day, streaks + milestones, and lessons days 1–7. Paid: lessons 8–60, urge toolkit, AI reports, challenges + wins wall, money/calorie insights. Day-7 paywall moment is a disclosed content boundary ("week two is where the mechanics start"), not a trick
- No trial-to-annual conversion tricks. If a trial is used, it is a 7-day trial of the _monthly_ plan with a day-5 reminder notification

### Paid-acquisition payback model (planning assumptions — validate with first $1k of spend)

Formula: CAC ceiling = (blended LTV) ÷ 3

| Variable                          | Planning assumption                      | Validate via                |
| --------------------------------- | ---------------------------------------- | --------------------------- |
| Ad click → install                | 25–35%                                   | Meta campaign data          |
| Install → trial/paid start        | 8–15%                                    | onboarding funnel analytics |
| Trial → paid conversion           | 30–40%                                   | RevenueCat                  |
| Annual vs. monthly mix            | 60/40                                    | paywall A/B                 |
| 12-mo net revenue per paying user | ~$55–70 (post-Apple cut, churn-adjusted) | RevenueCat cohorts          |
| **Implied CAC ceiling**           | **~$18–23 per paying user**              | —                           |

Rule: no spend scaling until observed CAC-per-paying-user < ceiling on ≥100 conversions. Influencer affiliate deals (promo code + rev share via RevenueCat) run in parallel and are pay-on-conversion — no ceiling risk.

## 8. Distribution

- Paid Meta (FB/IG) + influencer affiliates. No owned YouTube channel for this product.
- Meta ad compliance: no personal-attribute framing ("Do you drink too much?" = rejected/flagged). Aspiration framing only: "the mindful drinking app," "your Dry January companion." Study Reframe/Sunnyside live creative in Meta Ad Library before producing ours.
- Spend calendar: Nov–Dec = influencer outreach + low-spend creative testing. Dec 26–Jan 31 = main push (post-holiday CPM trough + peak resolution intent).

## 9. Safety and compliance (non-negotiable)

- Onboarding safety screen: heavy-use pattern detection (frequency/quantity thresholds) → users flagged for physical dependence risk get a clear message that stopping abruptly can be medically dangerous and a route to professional care (SAMHSA helpline + "talk to your doctor") before proceeding. Abstinence mode carries a persistent version of this notice.
- Persistent disclaimer: educational tool, not medical treatment or therapy
- Clinician review: full 60-lesson library reviewed by a licensed counselor/clinician (flat-fee engagement) before launch
- App Store requirements pre-built: privacy policy, data-handling disclosure, in-app account deletion, data export
- Privacy positioning as feature: drinking data never sold, delete-anytime, marketed on the paywall

## 10. Content system

60-day arc, 2 minutes/day, drafted with Claude → clinician-reviewed → recorded (ElevenLabs pipeline):

- **Days 1–7 — Baseline:** what a drink actually is, honest counting, why tracking alone reduces intake, setting a target you can win
- **Days 8–21 — Mechanics:** alcohol and sleep architecture, the 9pm boredom pour, urge surfing (20-minute rule), swaps and rituals, money math
- **Days 22–40 — Triggers and social:** Friday patterns, drinking scripts at dinners/events, saying "I'm good" without explaining, stress vs. reward drinking, plateau week
- **Days 41–60 — Durability:** identity without the project, handling the bad week without spiral, vacation/holiday protocols, graduating to maintenance mode

Weekly AI report spec: input = 7 days of logs + urge entries + targets; output = 3 observations + 1 suggestion, warm and specific, never scolding; hard rule — never praise drinking, never shame a missed target, always frame next week as winnable.

## 11. Out of scope (v1)

Community forum or any free-text UGC · live coaching · telehealth/meds · SMS check-ins · Android (iOS-first; Android fast-follows if January cohort retains) · wearable integrations, iOS widgets, Apple Watch (v1.1 backlog — widgets need config-plugin native work; do not let the build agent improvise them)

## 12. Timeline

- Aug: PRD lock, naming/brand, content drafting begins, prompt playbook authored
- Sep: agentic build sprints (2–4 wks), clinician review runs in parallel
- Oct: internal polish, App Store assets, influencer outreach begins
- Nov: TestFlight beta (target ≥100 testers), creative testing at low spend
- Early Dec: App Store live (buffer for review rejection cycle)
- Dec 26 – Jan 31: main acquisition push + Dry(ish) January challenge

## 13. Success metrics

- Beta: D7 retention ≥ 35%, median log time < 15s
- Launch: trial→paid ≥ 30%, CAC per paying user < $23, refund rate < 5%
- 90 days: MRR $3–5k, D30 retention ≥ 20%, support median first-response < 24h
- Brand health: zero billing-complaint reviews — the entire positioning depends on it
