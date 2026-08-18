/**
 * Milestones — the moments the app stops and says something.
 *
 * Two ladders, both from PRD §4: days closed in a row, and urges ridden out.
 * A milestone fires exactly once, which is why the `milestones` table exists:
 * a full screen the user cannot dismiss by accident must never come back a
 * second time because a query ran twice.
 *
 * The voice here is the calmest in the app. No exclamation marks, no confetti,
 * nothing that sounds like a slot machine. The number is the reward.
 */

import type { Milestone, MilestoneKind } from '@/lib/database.types';
import type { WriteResult } from '@/lib/drinks';
import { supabase } from '@/lib/supabase';

export const DAY_STREAK_MILESTONES = [7, 14, 30, 60, 100] as const;
export const URGE_MILESTONES = [5, 25, 50, 100] as const;

export type MilestoneKey = { kind: MilestoneKind; threshold: number };

export function milestoneId(key: MilestoneKey): string {
  return `${key.kind}:${key.threshold}`;
}

/** Every milestone the current numbers have earned, lowest first. */
export function earnedMilestones(streakDays: number, urgesSurvived: number): MilestoneKey[] {
  return [
    ...DAY_STREAK_MILESTONES.filter((threshold) => streakDays >= threshold).map((threshold) => ({
      kind: 'day_streak' as const,
      threshold,
    })),
    ...URGE_MILESTONES.filter((threshold) => urgesSurvived >= threshold).map((threshold) => ({
      kind: 'urges_survived' as const,
      threshold,
    })),
  ];
}

/**
 * What to celebrate now, and what to quietly write down.
 *
 * Only one screen is ever shown, even when several milestones land together —
 * which happens whenever a repair joins two runs, or a week of backfilling is
 * caught up in one sitting. The biggest is the one worth stopping for; the rest
 * are recorded so they do not queue up behind it.
 *
 * "Biggest" is the raw number, which does compare across the two ladders on the
 * rare day both land at once. That is a deliberate shrug rather than an
 * oversight: either milestone is worth the screen, and inventing a ranking
 * between days and urges would be a claim the product does not want to make.
 */
export function pendingMilestones(
  earned: MilestoneKey[],
  recorded: Pick<Milestone, 'kind' | 'threshold'>[]
): { celebrate: MilestoneKey | null; record: MilestoneKey[] } {
  const seen = new Set(recorded.map((row) => milestoneId(row)));
  const fresh = earned.filter((key) => !seen.has(milestoneId(key)));

  if (fresh.length === 0) return { celebrate: null, record: [] };

  const celebrate = fresh.reduce((best, key) => (key.threshold > best.threshold ? key : best));
  return { celebrate, record: fresh };
}

export type MilestoneCopy = {
  /** The number, alone. This is what the share image is built around. */
  figure: string;
  /** What the number counts. */
  unit: string;
  /** One sentence. Never two. */
  line: string;
};

const DAY_STREAK_LINES: Record<number, string> = {
  7: 'A week of knowing exactly where you stand.',
  14: 'Two weeks in. This is roughly where it stops taking effort.',
  30: 'Thirty days. Long enough that it is simply what you do now.',
  60: 'Sixty days. The habit is older than the decision that started it.',
  100: 'One hundred days. There is nothing to add to that.',
};

const URGE_LINES: Record<number, string> = {
  5: 'Five waves you let pass. Five you now know the length of.',
  25: 'Twenty-five. The wave is not news any more.',
  50: 'Fifty urges that went nowhere at all.',
  100: 'One hundred. You have more evidence than doubt now.',
};

export function milestoneCopy(key: MilestoneKey): MilestoneCopy {
  if (key.kind === 'day_streak') {
    return {
      figure: String(key.threshold),
      unit: key.threshold === 1 ? 'day in a row' : 'days in a row',
      line: DAY_STREAK_LINES[key.threshold] ?? 'Another stretch of days you kept track of.',
    };
  }

  return {
    figure: String(key.threshold),
    unit: key.threshold === 1 ? 'urge ridden out' : 'urges ridden out',
    line: URGE_LINES[key.threshold] ?? 'Another urge that went nowhere.',
  };
}

/**
 * Writes down that these milestones happened.
 *
 * `ignoreDuplicates` rather than an update: the row's whole meaning is "this
 * has been celebrated", and re-celebrating is the one thing it exists to
 * prevent. A second device racing the first simply loses the insert.
 */
export async function recordMilestones(keys: MilestoneKey[]): Promise<WriteResult> {
  if (keys.length === 0) return { ok: true };

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, message: 'You need to be signed in.' };

  const { error } = await supabase.from('milestones').upsert(
    keys.map((key) => ({
      user_id: userData.user!.id,
      kind: key.kind,
      threshold: key.threshold,
      achieved_at: new Date().toISOString(),
    })),
    { onConflict: 'user_id,kind,threshold', ignoreDuplicates: true }
  );

  if (error) return { ok: false, message: 'Could not save that milestone.' };
  return { ok: true };
}
