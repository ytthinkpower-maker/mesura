/**
 * Types for the Mesura database. Hand-maintained to match
 * [`supabase/schema.sql`](../supabase/schema.sql) — if you change one, change
 * the other in the same commit.
 */

export type GoalMode = 'cut_back' | 'alcohol_free';
export type DrinkType = 'beer' | 'wine' | 'spirits' | 'cocktail' | 'other';
export type UrgeOutcome = 'survived' | 'drank';
export type ChallengeStatus = 'active' | 'completed' | 'left';
export type MilestoneKind = 'day_streak' | 'urges_survived';

/** The tables a user owns, in the order the export writes them. */
export const USER_TABLES = [
  'profiles',
  'drink_logs',
  'urge_logs',
  'lesson_progress',
  'challenge_memberships',
  'evening_plans',
  'day_closes',
  'milestones',
] as const;

export type UserTable = (typeof USER_TABLES)[number];

export type Profile = {
  id: string;
  goal_mode: GoalMode;
  weekly_target: number;
  /** A normal week before Mesura. 0 means "not answered yet". */
  baseline_drinks: number;
  drink_cost: number;
  timezone: string;
  /** Whether the nightly "close the day" nudge is wanted. */
  evening_reminder: boolean;
  created_at: string;
  updated_at: string;
};

export type DrinkLog = {
  id: string;
  user_id: string;
  logged_at: string;
  drink_type: DrinkType;
  quantity: number;
  created_at: string;
};

export type UrgeLog = {
  id: string;
  user_id: string;
  logged_at: string;
  outcome: UrgeOutcome;
  trigger_note: string | null;
  created_at: string;
};

export type LessonProgress = {
  id: string;
  user_id: string;
  lesson_day: number;
  completed_at: string | null;
  created_at: string;
};

export type ChallengeMembership = {
  id: string;
  user_id: string;
  challenge_slug: string;
  handle: string;
  status: ChallengeStatus;
  joined_at: string;
  created_at: string;
};

/** A calendar day in the user's own zone, `YYYY-MM-DD`. Never an instant. */
export type DateKey = string;

export type EveningPlan = {
  id: string;
  user_id: string;
  plan_date: DateKey;
  intended_drinks: number;
  created_at: string;
  updated_at: string;
};

export type DayClose = {
  id: string;
  user_id: string;
  close_date: DateKey;
  /** The count as the user confirmed it, not as the logs read now. */
  drinks: number;
  /** True when a streak repair wrote this row rather than the user. */
  repaired: boolean;
  closed_at: string;
  created_at: string;
};

export type Milestone = {
  id: string;
  user_id: string;
  kind: MilestoneKind;
  threshold: number;
  achieved_at: string;
  created_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Pick<Profile, 'id'> & Partial<Profile>>;
      drink_logs: Table<DrinkLog, Pick<DrinkLog, 'user_id' | 'drink_type'> & Partial<DrinkLog>>;
      urge_logs: Table<UrgeLog, Pick<UrgeLog, 'user_id' | 'outcome'> & Partial<UrgeLog>>;
      lesson_progress: Table<
        LessonProgress,
        Pick<LessonProgress, 'user_id' | 'lesson_day'> & Partial<LessonProgress>
      >;
      challenge_memberships: Table<
        ChallengeMembership,
        Pick<ChallengeMembership, 'user_id' | 'challenge_slug' | 'handle'> &
          Partial<ChallengeMembership>
      >;
      evening_plans: Table<
        EveningPlan,
        Pick<EveningPlan, 'user_id' | 'plan_date' | 'intended_drinks'> & Partial<EveningPlan>
      >;
      day_closes: Table<DayClose, Pick<DayClose, 'user_id' | 'close_date'> & Partial<DayClose>>;
      milestones: Table<
        Milestone,
        Pick<Milestone, 'user_id' | 'kind' | 'threshold'> & Partial<Milestone>
      >;
    };
    Views: Record<never, never>;
    Functions: {
      delete_account: {
        Args: Record<never, never>;
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
