-- Mesura — development reset.
--
-- Wipes everything a test account has *logged*, leaving the accounts and their
-- profile settings alone. Use it before a verification run so the numbers on
-- screen match the numbers in the checklist — the alternative is deleting a
-- fortnight of test drinks one tap at a time.
--
--   *** NEVER RUN THIS AGAINST `mesura-prod`. ***
--
-- Like `seed-dev.sql`, there is deliberately no WHERE clause. A dev project
-- holds nothing but test accounts, and matching on an email is how you end up
-- clearing one account while your phone is signed into another — which looks
-- exactly like a bug in the app.
--
-- `profiles` is left untouched on purpose: the weekly target, baseline, and
-- drink cost come from `seed-dev.sql`, and nothing here should send you back
-- there. `auth.users` is untouched too, so you stay signed in.

delete from public.drink_logs;
delete from public.urge_logs;
delete from public.evening_plans;
delete from public.day_closes;
delete from public.milestones;
delete from public.lesson_progress;

-- The day streak and the forgotten-day card are both counted no further back
-- than `created_at`, so an account made today cannot show either. Ageing it
-- here is the same thing the developer menu's "Backdate this account" does.
--
-- After this runs the weekly "Streak" tile reads 0 weeks won, which is correct:
-- a week only counts once there is a drink logged or a day closed in it, and
-- the deletes above just removed every one of those.
update public.profiles
set created_at = now() - interval '120 days';

select
  u.email,
  p.weekly_target,
  p.baseline_drinks,
  p.drink_cost,
  p.created_at,
  (select count(*) from public.drink_logs where user_id = p.id) as drinks,
  (select count(*) from public.day_closes where user_id = p.id) as closed_days
from public.profiles as p
join auth.users as u on u.id = p.id
order by u.email;
