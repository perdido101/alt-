-- Milestone 7: hardening. Abuse limits, GDPR export, consent withdrawal.

-- Invites: at most 20 created per circle per day (on top of 10 pending).
alter function public.create_invite(uuid, public.member_role, text, integer) rename to create_invite_unlimited;
revoke execute on function public.create_invite_unlimited(uuid, public.member_role, text, integer) from public, anon, authenticated;

create or replace function public.create_invite(p_circle uuid, p_role public.member_role, p_invitee_name text default null,
                                                p_ttl_hours integer default 72)
returns table (invite_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.invites i where i.circle_id = p_circle and i.created_at > now() - interval '1 day') >= 20 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;
  return query select * from public.create_invite_unlimited(p_circle, p_role, p_invitee_name, p_ttl_hours);
end $$;
grant execute on function public.create_invite(uuid, public.member_role, text, integer) to authenticated;

-- Codes: one entry point for gift and municipality codes, returning a status instead of raising, so failed
-- attempts can be counted. 10 failures per user per hour, then "rate_limited" (codes are 40-bit; this makes
-- guessing impractical).
revoke execute on function public.redeem_gift_code(uuid, text), public.redeem_licence_code(uuid, text) from public, anon, authenticated;

create or replace function public.redeem_code(p_circle uuid, p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_until timestamptz;
  v_kind text;
  v_err text;
begin
  if auth.uid() is null then return jsonb_build_object('status', 'forbidden'); end if;
  if (select count(*) from public.audit_log a where a.actor_id = auth.uid() and a.action = 'code.failed'
        and a.created_at > now() - interval '1 hour') >= 10 then
    return jsonb_build_object('status', 'rate_limited');
  end if;
  begin
    v_until := public.redeem_gift_code(p_circle, p_code);
    v_kind := 'gift';
  exception when others then
    v_err := sqlerrm;
    if v_err = 'code_invalid' then
      begin
        v_until := public.redeem_licence_code(p_circle, p_code);
        v_kind := 'licence';
        v_err := null;
      exception when others then
        v_err := sqlerrm;
      end;
    end if;
  end;
  if v_err is null then
    return jsonb_build_object('status', 'ok', 'kind', v_kind, 'until', v_until);
  end if;
  if v_err = 'code_invalid' then
    perform public.audit('code.failed', 'circle', p_circle::text, p_circle);
    return jsonb_build_object('status', 'invalid');
  end if;
  return jsonb_build_object('status', case v_err when 'already_subscribed' then 'already_subscribed' when 'forbidden' then 'forbidden' else 'error' end);
end $$;
revoke execute on function public.redeem_code(uuid, text) from public, anon;
grant execute on function public.redeem_code(uuid, text) to authenticated;

-- GDPR: everything we hold about the signed-in person, as JSON (Settings → "Λήψη των δεδομένων μου").
create or replace function public.export_my_data() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'is_admin' from public.profiles p where p.id = auth.uid()),
    'memberships', (select coalesce(jsonb_agg(jsonb_build_object('circle', c.name, 'role', m.role, 'display_name', m.display_name,
                      'phone', m.phone, 'consented_at', m.consented_at, 'joined_at', m.joined_at)), '[]')
                    from public.circle_members m join public.circles c on c.id = m.circle_id where m.user_id = auth.uid()),
    'family_contacts_added', (select coalesce(jsonb_agg(jsonb_build_object('name', f.name, 'phone', f.phone, 'relation', f.relation)), '[]')
                    from public.family_contacts f where f.created_by = auth.uid()),
    'checks', (select coalesce(jsonb_agg(jsonb_build_object('at', k.created_at, 'verdict', k.verdict, 'category', k.category,
                      'reason', k.reason, 'action', k.action, 'channel', k.channel)), '[]') from public.checks k where k.user_id = auth.uid()),
    'calls', (select coalesce(jsonb_agg(jsonb_build_object('at', e.started_at, 'number', e.number_key, 'classification', e.classification,
                      'answer', e.checkin_answer, 'claimed', e.claimed_category)), '[]') from public.call_events e where e.user_id = auth.uid()),
    'alerts', (select coalesce(jsonb_agg(jsonb_build_object('at', a.created_at, 'source', a.source, 'status', a.status)), '[]')
                    from public.alerts a where a.protected_user_id = auth.uid()),
    'quizzes', (select coalesce(jsonb_agg(jsonb_build_object('at', q.scheduled_for, 'result', q.result)), '[]')
                    from public.safe_word_quizzes q where q.user_id = auth.uid()),
    'number_reports', (select coalesce(jsonb_agg(jsonb_build_object('at', r.created_at, 'number', r.number_key, 'status', r.status)), '[]')
                    from public.number_reports r where r.reporter_id = auth.uid()),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('platform', d.platform, 'app_version', d.app_version, 'last_seen_at', d.last_seen_at)), '[]')
                    from public.devices d where d.user_id = auth.uid())
  );
$$;
revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- Leaving a circle. A parent leaving withdraws consent: their checks, calls, alerts and quizzes in that
-- circle are deleted. The last guardian can't leave while a parent still relies on the circle.
create or replace function public.leave_circle(p_circle uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_role public.member_role;
begin
  select role into v_role from public.circle_members where circle_id = p_circle and user_id = auth.uid();
  if v_role is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_role = 'guardian'
     and (select count(*) from public.circle_members where circle_id = p_circle and role = 'guardian') = 1
     and exists (select 1 from public.circle_members where circle_id = p_circle and role = 'protected') then
    raise exception 'last_guardian' using errcode = '42501';
  end if;
  if v_role = 'protected' then
    delete from public.checks where circle_id = p_circle and user_id = auth.uid();
    delete from public.call_events where circle_id = p_circle and user_id = auth.uid();
    delete from public.alerts where circle_id = p_circle and protected_user_id = auth.uid();
    delete from public.safe_word_quizzes where circle_id = p_circle and user_id = auth.uid();
    delete from public.channel_links where circle_id = p_circle and user_id = auth.uid();
  end if;
  delete from public.circle_members where circle_id = p_circle and user_id = auth.uid();
  perform public.audit('circle.leave', 'circle', p_circle::text, p_circle, jsonb_build_object('role', v_role));
end $$;
revoke execute on function public.leave_circle(uuid) from public, anon;
grant execute on function public.leave_circle(uuid) to authenticated;

-- Small-group suppression for organisation statistics: with fewer than 5 protected people in a week,
-- activity counts could point to a single household, so they are stored as NULL (the org sees "—").
-- Enforced in the table itself, because org admins can read org_stats_weekly directly through the API.
alter table public.org_stats_weekly
  alter column checks drop not null,
  alter column checks_scam drop not null,
  alter column alerts drop not null,
  alter column flagged_calls drop not null;

create or replace function public.org_stats_suppress_small() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.protected_people < 5 then
    new.checks := null; new.checks_scam := null; new.alerts := null; new.flagged_calls := null;
  end if;
  return new;
end $$;

create trigger org_stats_suppress_small before insert or update on public.org_stats_weekly
  for each row execute function public.org_stats_suppress_small();
update public.org_stats_weekly set protected_people = protected_people;
