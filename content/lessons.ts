/**
 * The Baseline arc — lesson days 1 to 7, the free week (PRD §4, §7).
 *
 * Authored copy, bundled with the app and versioned with it. Data only: no
 * components, no fetching. `body` is the serif read; `teaser` is the single
 * line Today shows to make opening it worth the tap.
 */

export type Lesson = {
  /** 1-60. The arc is written in order and read in order. */
  day: number;
  title: string;
  /** One sentence, shown on Today. Says something, never "tap to read more". */
  teaser: string;
  /** The two-minute read. */
  body: string;
};

export const LESSONS: Lesson[] = [
  {
    day: 1,
    title: 'Why a number beats a rule',
    teaser: 'A rule breaks the first time the week is unusual. A number bends.',
    body: 'A rule like "only on weekends" breaks the first time the week is unusual — a birthday on a Tuesday, a hard Wednesday. Once it breaks, most people stop keeping score at all. A number you chose bends instead: you spend it how you like, and you still know exactly where you stand on Sunday night.',
  },
  {
    day: 2,
    title: 'Count first, change later',
    teaser: 'This week only asks you to watch. Changing the number comes after.',
    body: 'Almost nobody knows their real weekly number before they count it. The guess is usually low, and not because people are dishonest — drinks spread across a week are genuinely hard to add up from memory. So this week does one thing: log every drink, change nothing. The number you end up with is the only honest place to start.',
  },
  {
    day: 3,
    title: 'The drink you did not plan',
    teaser: 'Most weeks go over on the drinks nobody decided to have.',
    body: 'Look at a week that went over and you will usually find one or two drinks that were never a decision — the top-up someone poured, the one that came with the round. Planned drinks rarely wreck a number. Unplanned ones do, quietly, and they are the easiest kind to take back.',
  },
  {
    day: 4,
    title: 'What the urge actually is',
    teaser: 'An urge is a wave, not a verdict — and waves have a length.',
    body: 'An urge feels like it will keep climbing until you do something about it. It does not. Left alone it peaks and falls, usually inside twenty minutes. Knowing the shape changes what you are being asked to do: not to resist forever, only to outlast a wave whose length you now know.',
  },
  {
    day: 5,
    title: 'Zero days are not the point',
    teaser: 'A week under your number counts, however the days were arranged.',
    body: 'Plenty of trackers push for the clean streak, and it works right up until the day it breaks. Mesura scores the week, not the day, because that is the unit real life comes in. Four drinks on Saturday and none the rest of the week is a won week. So is one a night. You get to choose the arrangement.',
  },
  {
    day: 6,
    title: 'The cost you already paid',
    teaser: 'The money counter is not a lecture — it is a receipt you never got.',
    body: 'Drinking money leaves in small amounts, which is exactly why it never feels like a number. Multiply your usual week by what a drink costs you and the year arrives all at once. The point is not guilt. It is that you were already paying it, and now you can see what a lighter week returns.',
  },
  {
    day: 7,
    title: 'Setting next week',
    teaser: 'Pick a number you would bet on — not the one that sounds impressive.',
    body: 'The best target is one you would put money on hitting. Slightly under your honest baseline, not half of it. A number you clear is a week you won, and won weeks are what make the next one easier. An ambitious number you miss teaches you nothing except that the app is not for you.',
  },
];

/**
 * The lesson for a given day of the programme.
 *
 * Clamped at both ends: day 0 (someone who signed up an hour ago) reads day 1,
 * and anyone past the end of the written arc keeps the last lesson rather than
 * seeing an empty card.
 */
export function lessonForDay(day: number): Lesson {
  const index = Math.min(Math.max(day, 1), LESSONS.length) - 1;
  return LESSONS[index];
}
