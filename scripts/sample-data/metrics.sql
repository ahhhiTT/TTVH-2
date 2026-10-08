-- SAMPLE metrics, generated inside Postgres. Fictional only. Re-runnable:
-- deletes rows with source = 'sample' and recreates them up to current_date.
-- Rules (same as generate.ts):
--   daily base by store scale x random 0.6..1.4, weekly growth -0.4%..+0.8%
--   weekday shape, double day (dd = mm) x3..5, 15th/25th x1.6..2.2, two days before double day x1.2..1.5
--   website traffic is not tracked -> null (Missing)
--   ~15% stores have no ad import -> ad_spend null (Missing); ~9% run no ads -> 0 (Zero)
--   ~10% stores lag one day -> today's row exists but all values null (Missing)
--   onboarding stores have no target for Sep/Oct (Missing)
select setseed(0.20261008);

delete from daily_metrics where source = 'sample';
delete from monthly_targets;

create temp table _store_params on commit drop as
select s.id,
       s.platform,
       s.status,
       (case s.scale when 'S' then 10e6 when 'M' then 30e6 when 'L' then 85e6 else 200e6 end) * (0.6 + random() * 0.8) as base,
       -0.004 + random() * 0.012 as growth,
       random() as r_ads,
       random() as r_lag,
       180e3 + random() * 270e3 as aov,
       0.012 + random() * 0.033 as cr
from stores s
order by s.id;

insert into monthly_targets (store_id, month, gmv_target)
select p.id, m.month,
       case when p.status = 'onboarding' and m.idx >= 4 then null
            else round(p.base * extract(day from (m.month + interval '1 month - 1 day')) * (1 + p.growth * 4 * m.idx)
                       * (1.0 + random() * 0.18) * 1.12)
       end
from _store_params p
cross join lateral (
  select (date '2026-05-01' + make_interval(months => i))::date as month, i as idx
  from generate_series(0, 5) i
) m;

insert into daily_metrics (store_id, date, gmv, nmv, orders, traffic, ad_spend, source)
select id, d,
       case when lagged then null else round(gmv) end,
       case when lagged then null else round(gmv * (0.78 + random() * 0.12)) end,
       case when lagged then null else orders end,
       case when lagged or platform = 'website' then null else round(orders / (cr * (0.85 + random() * 0.3))) end,
       case when lagged or r_ads > 0.85 then null
            when r_ads > 0.76 then 0
            else round(gmv / (5 + random() * 9)) end,
       'sample'
from (
  select p.*, x.d, x.gmv,
         greatest(0, round(x.gmv / (p.aov * (0.9 + random() * 0.2))))::int as orders,
         (p.r_lag > 0.9 and x.d = current_date) as lagged
  from _store_params p
  cross join lateral (
    select g::date as d,
           p.base
           * (array[1.1, 0.9, 0.95, 0.95, 1.0, 1.05, 1.15])[extract(dow from g)::int + 1]
           * (1 + p.growth * ((g::date - date '2026-05-01') / 7.0))
           * (0.75 + random() * 0.5)
           * case
               when extract(day from g) = extract(month from g) then 3 + random() * 2
               when extract(day from g) in (15, 25) then 1.6 + random() * 0.6
               when extract(day from g) in (extract(month from g) - 1, extract(month from g) - 2) then 1.2 + random() * 0.3
               else 1 end as gmv
    from generate_series(date '2026-05-01', current_date, interval '1 day') g
  ) x
) t;
