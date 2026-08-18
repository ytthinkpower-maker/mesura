-- Mesura — Supabase schema, RLS, and account lifecycle.
--
-- Run this whole file in the Supabase SQL editor (Dashboard → SQL Editor → New
-- query → paste → Run). It is idempotent: running it twice is safe.
--
-- Design rules encoded here:
--   * Every user-owned table carries `user_id` and cascades from auth.users, so
--     deleting the auth user removes every trace of them in one statement.
--   * RLS is ON everywhere and the only key the app ships with is the anon key,
--     so a user can never see another user's rows.
--   * The column the PRD calls "timestamp" is `logged_at`. `timestamp` is a
--     Postgres type name, and using it as a column name forces quoting forever.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  goal_mode     text        not null default 'cut_back'
                            check (goal_mode in ('cut_back', 'alcohol_free')),
  weekly_target integer     not null default 8
                            check (weekly_target between 0 and 100),
  drink_cost    numeric(10, 2) not null default 0
                            check (drink_cost >= 0),
  timezone      text        not null default 'UTC',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'One row per user. Holds the weekly number the whole product is built around.';

create table if not exists public.drink_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  logged_at  timestamptz not null default now(),
  drink_type text        not null
                         check (drink_type in ('beer', 'wine', 'spirits', 'cocktail', 'other')),
  quantity   numeric(4, 2) not null default 1
                         check (quantity > 0 and quantity <= 50),
  created_at timestamptz not null default now()
);

create index if not exists drink_logs_user_logged_at_idx
  on public.drink_logs (user_id, logged_at desc);

create table if not exists public.urge_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  logged_at    timestamptz not null default now(),
  outcome      text        not null check (outcome in ('survived', 'drank')),
  trigger_note text        check (char_length(trigger_note) <= 500),
  created_at   timestamptz not null default now()
);

create index if not exists urge_logs_user_logged_at_idx
  on public.urge_logs (user_id, logged_at desc);

create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  lesson_day   integer     not null check (lesson_day between 1 and 60),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, lesson_day)
);

create table if not exists public.challenge_memberships (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade,
  challenge_slug text        not null,
  handle         text        not null,
  status         text        not null default 'active'
                             check (status in ('active', 'completed', 'left')),
  joined_at      timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (user_id, challenge_slug)
);

-- ---------------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles              enable row level security;
alter table public.drink_logs            enable row level security;
alter table public.urge_logs             enable row level security;
alter table public.lesson_progress       enable row level security;
alter table public.challenge_memberships enable row level security;

-- profiles is keyed on `id` (which IS the auth user id), not `user_id`.

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No delete policy on profiles, deliberately: a profile disappears only when
-- the whole account is deleted, and that path cascades from auth.users.

-- The four log tables all follow the identical user_id pattern, so the four
-- policies are generated rather than written out sixteen times.
do $policies$
declare
  t text;
begin
  foreach t in array array['drink_logs', 'urge_logs', 'lesson_progress', 'challenge_memberships']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for select to authenticated '
      'using ((select auth.uid()) = user_id)',
      t || '_select_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated '
      'with check ((select auth.uid()) = user_id)',
      t || '_insert_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated '
      'using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_update_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated '
      'using ((select auth.uid()) = user_id)',
      t || '_delete_own', t);
  end loop;
end;
$policies$;

-- ---------------------------------------------------------------------------
-- 3. A profile row is created automatically at sign-up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $handle_new_user$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$handle_new_user$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $touch_updated_at$
begin
  new.updated_at = now();
  return new;
end;
$touch_updated_at$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Full account deletion, callable from the app
-- ---------------------------------------------------------------------------
-- `security definer` so the function runs with its owner's rights: the anon and
-- authenticated roles cannot touch auth.users directly, and must not be able
-- to. auth.uid() pins the delete to the caller, so this can only ever delete
-- you. Every table above cascades from auth.users, so this single statement
-- removes the account and all of its rows.

create or replace function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $delete_account$
  delete from auth.users where id = (select auth.uid());
$delete_account$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
