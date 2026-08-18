-- Mesura — development seed.
--
-- Gives every account in the project a known starting point so the Today
-- screen has something real to draw.
--
--   *** NEVER RUN THIS AGAINST `mesura-prod`. ***
--
-- There is no WHERE clause, deliberately. A dev project holds nothing but test
-- accounts, and matching on an email is how you end up seeding one account
-- while your phone is signed into another — which looks exactly like a bug in
-- the app. Seeding all of them cannot miss.

update public.profiles
set
  goal_mode       = 'cut_back',
  weekly_target   = 8,   -- the number the ring is drawn against
  baseline_drinks = 10,  -- a normal week before Mesura; powers "money saved"
  drink_cost      = 8.00; -- one drink, in whatever currency the user pays in

-- `timezone` is left alone: the app writes the device's IANA zone on load,
-- which is both more reliable than guessing here and a useful tell — the row
-- that still says 'UTC' is an account no device has opened.

select u.email, p.weekly_target, p.baseline_drinks, p.drink_cost, p.timezone
from public.profiles as p
join auth.users as u on u.id = p.id
order by p.created_at;
