/**
 * Types for the Mesura database. Hand-maintained to match
 * [`supabase/schema.sql`](../supabase/schema.sql) — if you change one, change
 * the other in the same commit.
 */

export type GoalMode = 'cut_back' | 'alcohol_free';
export type DrinkType = 'beer' | 'wine' | 'spirits' | 'cocktail' | 'other';
export type UrgeOutcome = 'survived' | 'drank';
export type ChallengeStatus = 'active' | 'completed' | 'left';

/** The tables a user owns, in the order the export writes them. */
export const USER_TABLES = [
  'profiles',
  'drink_logs',
  'urge_logs',
  'lesson_progress',
  'challenge_memberships',
] as const;

export type UserTable = (typeof USER_TABLES)[number];

export type Profile = {
  id: string;
  goal_mode: GoalMode;
  weekly_target: number;
  drink_cost: number;
  timezone: string;
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
