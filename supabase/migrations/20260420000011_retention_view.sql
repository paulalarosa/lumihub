-- Admin-facing metrics view: MRR, churn, cohort retention.
-- Plan price map matches Stripe (R$ 49,90 / 99,90 / 199,90).
-- Annual plans use a separate plan slug; map here if needed.

create or replace view public.admin_mrr_stats as
with plan_prices as (
  select * from (values
    ('essencial'::text, 49.90::numeric),
    ('profissional'::text, 99.90::numeric),
    ('studio'::text, 199.90::numeric)
  ) as t(plan, price)
),
active_subs as (
  select
    p.id as user_id,
    lower(coalesce(p.plan, 'free')) as plan,
    p.subscription_status,
    p.created_at,
    p.stripe_customer_id
  from public.profiles p
  where p.parent_user_id is null
    and lower(coalesce(p.plan, 'free')) != 'free'
    and p.subscription_status = any (array['active', 'trialing'])
)
select
  count(*)::integer as active_subscribers,
  count(*) filter (where a.subscription_status = 'trialing')::integer as in_trial,
  count(*) filter (where a.subscription_status = 'active')::integer as paying,
  coalesce(sum(pp.price) filter (where a.subscription_status = 'active'), 0)::numeric as mrr,
  coalesce(sum(pp.price * 12) filter (where a.subscription_status = 'active'), 0)::numeric as arr,
  coalesce(
    avg(pp.price) filter (where a.subscription_status = 'active'),
    0
  )::numeric as arpu
from active_subs a
left join plan_prices pp on pp.plan = a.plan;

grant select on public.admin_mrr_stats to authenticated, service_role;

create or replace view public.admin_signup_cohorts as
select
  date_trunc('month', p.created_at)::date as cohort_month,
  count(*)::integer as signups,
  count(*) filter (where p.subscription_status = 'active')::integer as active_now,
  count(*) filter (where p.subscription_status = 'trialing')::integer as trialing_now,
  count(*) filter (where p.subscription_status = 'cancelled')::integer as churned,
  count(*) filter (where lower(coalesce(p.plan,'free')) != 'free')::integer as paying_now
from public.profiles p
where p.parent_user_id is null
group by 1
order by 1 desc
limit 24;

grant select on public.admin_signup_cohorts to authenticated, service_role;
