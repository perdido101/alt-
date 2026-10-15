-- Milestone 3: family alert. Alerts are created and dispatched by the server (service role);
-- these functions cover what clients do directly: register devices, mark alerts seen, resolve them.

-- The parent's own number, so guardians can tap "Πάρε τηλέφωνο τώρα".
alter table public.circle_members add column phone public.e164;
grant update (phone) on public.circle_members to authenticated;

-- Push token / setup health for this device. Moves a token that used to belong to another account.
create or replace function public.register_device(p_platform text, p_push_token text default null, p_app_version text default null,
                                                  p_os_version text default null, p_health jsonb default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_push_token is not null then
    delete from public.devices where push_token = p_push_token and user_id <> auth.uid();
    select id into v_id from public.devices where push_token = p_push_token;
  end if;
  if v_id is null then
    select id into v_id from public.devices where user_id = auth.uid() and platform = p_platform
    order by last_seen_at desc limit 1;
  end if;
  if v_id is null then
    insert into public.devices (user_id, platform, push_token, app_version, os_version, health)
    values (auth.uid(), p_platform, p_push_token, p_app_version, p_os_version, coalesce(p_health, '{}'::jsonb))
    returning id into v_id;
  else
    update public.devices set
      push_token = coalesce(p_push_token, push_token),
      app_version = coalesce(p_app_version, app_version),
      os_version = coalesce(p_os_version, os_version),
      health = coalesce(p_health, health),
      last_seen_at = now()
    where id = v_id;
  end if;
  return v_id;
end $$;

-- A guardian opened the alert.
create or replace function public.mark_alert_seen(p_alert uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_circle uuid;
begin
  select circle_id into v_circle from public.alerts where id = p_alert;
  if v_circle is null or not public.is_guardian(v_circle) then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.alert_deliveries set seen_at = now()
  where alert_id = p_alert and recipient_user_id = auth.uid() and seen_at is null;
  -- A guardian without a push delivery (e.g. no device registered) still counts as having seen it.
  if not found and not exists (select 1 from public.alert_deliveries where alert_id = p_alert and recipient_user_id = auth.uid()) then
    insert into public.alert_deliveries (alert_id, recipient_user_id, channel, status, seen_at)
    values (p_alert, auth.uid(), 'push', 'delivered', now());
  end if;
end $$;

create or replace function public.resolve_alert(p_alert uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_circle uuid;
begin
  select circle_id into v_circle from public.alerts where id = p_alert;
  if v_circle is null or not public.is_guardian(v_circle) then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.alerts set status = 'resolved', resolved_at = now(), resolved_by = auth.uid()
  where id = p_alert and status = 'open';
  perform public.audit('alert.resolve', 'alert', p_alert::text, v_circle);
end $$;

-- Escalation claim used by the delayed job: true exactly once, and only if nobody has seen the alert.
create or replace function public.claim_alert_escalation(p_alert uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_ok boolean;
begin
  update public.alerts a set escalated_at = now()
  where a.id = p_alert and a.escalated_at is null and a.status = 'open'
    and not exists (select 1 from public.alert_deliveries d where d.alert_id = a.id and d.seen_at is not null)
  returning true into v_ok;
  return coalesce(v_ok, false);
end $$;

revoke execute on function public.register_device(text, text, text, text, jsonb), public.mark_alert_seen(uuid),
  public.resolve_alert(uuid), public.claim_alert_escalation(uuid) from public, anon;
grant execute on function public.register_device(text, text, text, text, jsonb), public.mark_alert_seen(uuid),
  public.resolve_alert(uuid) to authenticated;
-- claim_alert_escalation is for the service role only.
grant execute on function public.claim_alert_escalation(uuid) to service_role;

-- Realtime: guardians' apps and the parent's holding screen follow alerts live.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.alerts, public.alert_deliveries;
  end if;
end $$;
