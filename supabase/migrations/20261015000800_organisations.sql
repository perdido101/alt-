-- Milestone 6: organisation portal (municipalities first): seats, licence codes, co-branding, aggregate stats.

-- Licence codes like "DOKIMI-7KQ2-M9XD": org slug prefix so social workers can tell them apart.
create or replace function public.random_code_part(p_len integer) returns text
language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 32), 1), '')
  from (select extensions.gen_random_bytes(p_len) b) x, generate_series(0, p_len - 1) i;
$$;

-- Seats: every non-revoked code uses a seat (printed codes are promised to someone).
create or replace function public.generate_licence_codes(p_org uuid, p_count integer, p_valid_months integer default 12)
returns setof text
language plpgsql security definer set search_path = '' as $$
declare
  v_org public.organisations;
  v_used integer;
  v_prefix text;
  v_code text;
  i integer;
begin
  if not (public.is_org_admin(p_org) or public.is_admin()) then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_count < 1 or p_count > 500 then raise exception 'invalid_count' using errcode = '22023'; end if;
  select * into v_org from public.organisations where id = p_org for update;
  select count(*) into v_used from public.org_licence_codes where org_id = p_org and revoked_at is null;
  if v_used + p_count > v_org.seats_total then raise exception 'not_enough_seats' using errcode = '54000'; end if;
  v_prefix := upper(left(regexp_replace(v_org.slug, '[^a-z0-9]', '', 'g'), 6));
  for i in 1..p_count loop
    loop
      v_code := v_prefix || '-' || public.random_code_part(4) || '-' || public.random_code_part(4);
      exit when not exists (select 1 from public.org_licence_codes where code = v_code);
    end loop;
    insert into public.org_licence_codes (org_id, code, plan, created_by, expires_at)
    values (p_org, v_code, 'family', auth.uid(), now() + make_interval(months => least(greatest(p_valid_months, 1), 36)));
    return next v_code;
  end loop;
  perform public.audit('licence.generate', 'organisation', p_org::text, null, jsonb_build_object('count', p_count));
end $$;

create or replace function public.revoke_licence_code(p_code text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_org uuid;
begin
  select org_id into v_org from public.org_licence_codes where code = upper(btrim(p_code)) and redeemed_at is null;
  if v_org is null or not (public.is_org_admin(v_org) or public.is_admin()) then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.org_licence_codes set revoked_at = now() where code = upper(btrim(p_code));
end $$;

-- A guardian (or a social worker signed in as one) activates the Family plan for a circle.
create or replace function public.redeem_licence_code(p_circle uuid, p_code text) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_lic public.org_licence_codes;
  v_sub public.subscriptions;
  v_end timestamptz;
begin
  if not public.is_guardian(p_circle) or public.is_anonymous_user() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_lic from public.org_licence_codes where code = upper(btrim(p_code)) for update;
  if not found or v_lic.redeemed_at is not null or v_lic.revoked_at is not null or (v_lic.expires_at is not null and v_lic.expires_at < now()) then
    raise exception 'code_invalid' using errcode = 'P0002';
  end if;
  select * into v_sub from public.subscriptions where circle_id = p_circle for update;
  if found and v_sub.provider = 'stripe' and v_sub.status in ('active', 'trialing', 'past_due') then
    raise exception 'already_subscribed' using errcode = '23505';
  end if;
  v_end := coalesce(v_lic.expires_at, now() + interval '1 year');
  insert into public.subscriptions (circle_id, plan, status, provider, current_period_end)
  values (p_circle, v_lic.plan, 'active', 'org_licence', v_end)
  on conflict (circle_id) do update set plan = excluded.plan, status = 'active', provider = 'org_licence',
    current_period_end = excluded.current_period_end, grace_until = null, provider_subscription_id = null, updated_at = now();
  update public.circles set plan = v_lic.plan, sponsor_org_id = v_lic.org_id where id = p_circle;
  update public.org_licence_codes set redeemed_at = now(), redeemed_by = auth.uid(), redeemed_circle_id = p_circle where id = v_lic.id;
  perform public.audit('licence.redeem', 'org_licence_code', v_lic.id::text, p_circle);
  return v_end;
end $$;

-- Public co-branding (website /d/<slug>): only organisations that enabled it, and only name + logo.
create or replace function public.org_branding(p_slug text)
returns table (slug text, name_el text, name_en text, logo_path text, kind public.org_kind)
language sql stable security definer set search_path = '' as $$
  select o.slug, o.name_el, o.name_en, o.logo_path, o.kind from public.organisations o
  where o.slug = p_slug and o.cobranding_enabled;
$$;

-- The parent's home screen: "Με τη στήριξη του Δήμου <Name>" when the circle's sponsor enabled co-branding.
create or replace function public.circle_sponsor(p_circle uuid)
returns table (name_el text, name_en text, logo_path text, kind public.org_kind)
language sql stable security definer set search_path = '' as $$
  select o.name_el, o.name_en, o.logo_path, o.kind from public.circles c
  join public.organisations o on o.id = c.sponsor_org_id
  where c.id = p_circle and o.cobranding_enabled and public.is_member(p_circle);
$$;

-- Weekly anonymised aggregates per organisation (circles it sponsors). Counts only, never identities.
create or replace function public.compute_org_stats(p_week_start date) returns integer
language sql security definer set search_path = '' as $$
  with week as (select p_week_start::timestamptz as s, (p_week_start + 7)::timestamptz as e),
  sponsored as (select id as circle_id, sponsor_org_id as org_id from public.circles where sponsor_org_id is not null),
  rows as (
    select o.id as org_id,
      (select count(*) from public.circle_members m join sponsored sp on sp.circle_id = m.circle_id
        where sp.org_id = o.id and m.role = 'protected')::int as protected_people,
      (select count(*) from public.checks c join sponsored sp on sp.circle_id = c.circle_id, week
        where sp.org_id = o.id and c.created_at >= week.s and c.created_at < week.e)::int as checks,
      (select count(*) from public.checks c join sponsored sp on sp.circle_id = c.circle_id, week
        where sp.org_id = o.id and c.verdict = 'scam' and c.created_at >= week.s and c.created_at < week.e)::int as checks_scam,
      (select count(*) from public.alerts a join sponsored sp on sp.circle_id = a.circle_id, week
        where sp.org_id = o.id and a.created_at >= week.s and a.created_at < week.e)::int as alerts,
      (select count(*) from public.call_events ce join sponsored sp on sp.circle_id = ce.circle_id, week
        where sp.org_id = o.id and ce.classification in ('reported_scam', 'risky') and ce.started_at >= week.s and ce.started_at < week.e)::int as flagged_calls
    from public.organisations o
  ),
  upserted as (
    insert into public.org_stats_weekly (org_id, week_start, protected_people, checks, checks_scam, alerts, flagged_calls, computed_at)
    select org_id, p_week_start, protected_people, checks, checks_scam, alerts, flagged_calls, now() from rows
    on conflict (org_id, week_start) do update set protected_people = excluded.protected_people, checks = excluded.checks,
      checks_scam = excluded.checks_scam, alerts = excluded.alerts, flagged_calls = excluded.flagged_calls, computed_at = now()
    returning 1
  )
  select count(*)::int from upserted;
$$;

revoke execute on function public.random_code_part(integer), public.generate_licence_codes(uuid, integer, integer), public.revoke_licence_code(text),
  public.redeem_licence_code(uuid, text), public.org_branding(text), public.circle_sponsor(uuid), public.compute_org_stats(date) from public, anon;
grant execute on function public.generate_licence_codes(uuid, integer, integer), public.revoke_licence_code(text),
  public.redeem_licence_code(uuid, text), public.circle_sponsor(uuid) to authenticated;
grant execute on function public.org_branding(text) to anon, authenticated;
grant execute on function public.compute_org_stats(date) to service_role;

-- Org admins can update their own logo; everything else about the org is set by us.
grant update (logo_path) on public.organisations to authenticated;
create policy orgs_admin_logo on public.organisations for update to authenticated
  using (public.is_org_admin(id)) with check (public.is_org_admin(id));

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('org-logos', 'org-logos', true) on conflict (id) do nothing;
  end if;
end $$;
