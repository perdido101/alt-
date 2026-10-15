-- Helper functions used by RLS, and the RPCs the apps call for anything that must be atomic or
-- must not expose secrets (invites, safe word). All security definer functions pin search_path.

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_member(p_circle uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.circle_members m where m.circle_id = p_circle and m.user_id = auth.uid());
$$;

create or replace function public.is_guardian(p_circle uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.circle_members m
                 where m.circle_id = p_circle and m.user_id = auth.uid() and m.role = 'guardian');
$$;

-- True when the current user and p_user are in at least one circle together.
create or replace function public.shares_circle(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.circle_members a
                 join public.circle_members b on a.circle_id = b.circle_id
                 where a.user_id = auth.uid() and b.user_id = p_user);
$$;

-- True when the current user is a guardian in the circle where p_user is the protected person.
create or replace function public.is_guardian_of(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.circle_members g
                 join public.circle_members p on g.circle_id = p.circle_id
                 where g.user_id = auth.uid() and g.role = 'guardian'
                   and p.user_id = p_user and p.role = 'protected');
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_org_admin(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.org_members o where o.org_id = p_org and o.user_id = auth.uid());
$$;

-- Seconds since the user last authenticated (from the Supabase JWT "amr" claim). Used to require re-auth.
create or replace function public.auth_age_seconds() returns bigint
language sql stable set search_path = '' as $$
  select extract(epoch from now())::bigint - coalesce(
    (select max((e ->> 'timestamp')::bigint)
       from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) e),
    0);
$$;

create or replace function public.is_anonymous_user() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

-- Mirrors packages/core/src/plans.ts.
create or replace function public.plan_max_members(p_plan public.plan_tier, p_role public.member_role) returns integer
language sql immutable set search_path = '' as $$
  select case p_role
    when 'guardian' then case p_plan when 'free' then 2 else 4 end
    else case p_plan when 'free' then 1 when 'family' then 2 else 4 end
  end;
$$;

-- Mirrors packages/core/src/safeWord.ts: NFD, strip combining marks, lowercase, ς→σ, collapse spaces, trim.
create or replace function public.normalise_safe_word(p_word text) returns text
language sql immutable strict set search_path = '' as $$
  select btrim(regexp_replace(
           replace(lower(regexp_replace(normalize(p_word, NFD), '[̀-ͯ]', '', 'g')), 'ς', 'σ'),
           '\s+', ' ', 'g'));
$$;

create or replace function public.audit(p_action text, p_entity text, p_entity_id text, p_circle uuid,
                                        p_meta jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, circle_id, meta)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_circle, coalesce(p_meta, '{}'::jsonb));
$$;
revoke execute on function public.audit(text, text, text, uuid, jsonb) from public;

-- ---------------------------------------------------------------------------
-- New auth user → profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    case when new.raw_user_meta_data ->> 'locale' in ('el', 'en') then new.raw_user_meta_data ->> 'locale' else 'el' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Circles and invites
-- ---------------------------------------------------------------------------
create or replace function public.create_circle(p_name text, p_display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_circle uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if public.is_anonymous_user() then raise exception 'anonymous_not_allowed' using errcode = '42501'; end if;
  if exists (select 1 from public.circle_members where user_id = v_uid and role = 'protected') then
    raise exception 'role_conflict' using errcode = '42501';
  end if;
  if (select count(*) from public.circle_members where user_id = v_uid and role = 'guardian') >= 5 then
    raise exception 'too_many_circles' using errcode = '54000';
  end if;
  if coalesce(btrim(p_display_name), '') = '' then raise exception 'display_name_required' using errcode = '22023'; end if;

  insert into public.circles (name, created_by) values (btrim(p_name), v_uid) returning id into v_circle;
  insert into public.circle_members (circle_id, user_id, role, display_name, consented_at)
  values (v_circle, v_uid, 'guardian', btrim(p_display_name), now());
  update public.profiles set display_name = coalesce(display_name, btrim(p_display_name)) where id = v_uid;
  perform public.audit('circle.create', 'circle', v_circle::text, v_circle);
  return v_circle;
end $$;

-- Returns the plaintext token exactly once; only its SHA-256 is stored.
create or replace function public.create_invite(p_circle uuid, p_role public.member_role, p_invitee_name text default null,
                                                p_ttl_hours integer default 72)
returns table (invite_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  v_plan public.plan_tier;
  v_token text;
  v_id uuid;
  v_expires timestamptz := now() + make_interval(hours => least(greatest(p_ttl_hours, 1), 168));
begin
  if not public.is_guardian(p_circle) or public.is_anonymous_user() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_role = 'protected' and coalesce(btrim(p_invitee_name), '') = '' then
    raise exception 'display_name_required' using errcode = '22023';
  end if;
  select c.plan into v_plan from public.circles c where c.id = p_circle;
  if (select count(*) from public.circle_members m where m.circle_id = p_circle and m.role = p_role)
     >= public.plan_max_members(v_plan, p_role) then
    raise exception 'circle_full' using errcode = '54000';
  end if;
  if (select count(*) from public.invites i where i.circle_id = p_circle and i.accepted_at is null
        and i.revoked_at is null and i.expires_at > now()) >= 10 then
    raise exception 'too_many_invites' using errcode = '54000';
  end if;

  v_token := translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');
  insert into public.invites (circle_id, role, invitee_name, token_hash, created_by, expires_at)
  values (p_circle, p_role, nullif(btrim(p_invitee_name), ''), sha256(convert_to(v_token, 'UTF8')), auth.uid(), v_expires)
  returning id into v_id;
  perform public.audit('invite.create', 'invite', v_id::text, p_circle, jsonb_build_object('role', p_role));
  return query select v_id, v_token, v_expires;
end $$;

create or replace function public.accept_invite(p_token text, p_display_name text default null)
returns table (circle_id uuid, role public.member_role)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.invites;
  v_plan public.plan_tier;
  v_name text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  select * into v_inv from public.invites i
  where i.token_hash = sha256(convert_to(btrim(p_token), 'UTF8'))
  for update;

  if not found or v_inv.revoked_at is not null then
    raise exception 'invite_invalid' using errcode = 'P0002';
  end if;
  -- Idempotent: re-opening your own accepted link just returns the circle.
  if v_inv.accepted_at is not null then
    if v_inv.accepted_by = v_uid then
      return query select v_inv.circle_id, v_inv.role;
      return;
    end if;
    raise exception 'invite_invalid' using errcode = 'P0002';
  end if;
  if v_inv.expires_at <= now() then raise exception 'invite_expired' using errcode = 'P0002'; end if;

  if exists (select 1 from public.circle_members m where m.circle_id = v_inv.circle_id and m.user_id = v_uid) then
    raise exception 'already_member' using errcode = '23505';
  end if;
  -- A protected person is in one circle only, and the same account can't be both guardian and protected.
  if exists (select 1 from public.circle_members m where m.user_id = v_uid and m.role <> v_inv.role)
     or (v_inv.role = 'protected' and exists (select 1 from public.circle_members m where m.user_id = v_uid)) then
    raise exception 'role_conflict' using errcode = '42501';
  end if;
  if v_inv.role = 'guardian' and public.is_anonymous_user() then
    raise exception 'anonymous_not_allowed' using errcode = '42501';
  end if;

  select c.plan into v_plan from public.circles c where c.id = v_inv.circle_id for update;
  if (select count(*) from public.circle_members m where m.circle_id = v_inv.circle_id and m.role = v_inv.role)
     >= public.plan_max_members(v_plan, v_inv.role) then
    raise exception 'circle_full' using errcode = '54000';
  end if;

  v_name := coalesce(nullif(btrim(p_display_name), ''), v_inv.invitee_name,
                     (select p.display_name from public.profiles p where p.id = v_uid));
  if v_name is null then raise exception 'display_name_required' using errcode = '22023'; end if;

  insert into public.circle_members (circle_id, user_id, role, display_name, consented_at)
  values (v_inv.circle_id, v_uid, v_inv.role, v_name,
          case when v_inv.role = 'guardian' then now() end);  -- protected people consent on their own screen
  update public.invites set accepted_by = v_uid, accepted_at = now() where id = v_inv.id;
  update public.profiles set display_name = coalesce(display_name, v_name) where id = v_uid;
  perform public.audit('invite.accept', 'invite', v_inv.id::text, v_inv.circle_id, jsonb_build_object('role', v_inv.role));
  return query select v_inv.circle_id, v_inv.role;
end $$;

-- The protected person taps "Συμφωνώ" on the consent screen.
create or replace function public.record_consent(p_circle uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare v_at timestamptz;
begin
  update public.circle_members set consented_at = coalesce(consented_at, now())
  where circle_id = p_circle and user_id = auth.uid()
  returning consented_at into v_at;
  if v_at is null then raise exception 'forbidden' using errcode = '42501'; end if;
  perform public.audit('consent.record', 'circle_member', auth.uid()::text, p_circle);
  return v_at;
end $$;

-- ---------------------------------------------------------------------------
-- Safe word: plaintext never stored, hash never readable by clients.
-- ---------------------------------------------------------------------------
create or replace function public.set_safe_word(p_circle uuid, p_word text) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_norm text := public.normalise_safe_word(coalesce(p_word, ''));
  v_exists boolean;
  v_at timestamptz := now();
begin
  if not public.is_member(p_circle) then raise exception 'forbidden' using errcode = '42501'; end if;
  if char_length(v_norm) < 3 then raise exception 'safe_word_too_short' using errcode = '22023'; end if;
  select true into v_exists from public.safe_words where circle_id = p_circle;
  -- First time (during setup on the parent's phone) anyone in the circle may set it.
  -- Changing it later is for guardians only, within 10 minutes of signing in.
  if coalesce(v_exists, false) then
    if not public.is_guardian(p_circle) then raise exception 'forbidden' using errcode = '42501'; end if;
    if public.auth_age_seconds() > 600 then raise exception 'reauth_required' using errcode = '42501'; end if;
  end if;
  insert into public.safe_words (circle_id, word_hash, set_by, updated_at)
  values (p_circle, extensions.crypt(v_norm, extensions.gen_salt('bf', 10)), auth.uid(), v_at)
  on conflict (circle_id) do update set word_hash = excluded.word_hash, set_by = excluded.set_by, updated_at = excluded.updated_at;
  perform public.audit(case when coalesce(v_exists, false) then 'safe_word.change' else 'safe_word.set' end,
                       'safe_word', p_circle::text, p_circle);
  return v_at;
end $$;

-- At most 10 attempts per user per 10 minutes, so the RPC can't be used to brute-force the word.
create or replace function public.check_safe_word(p_circle uuid, p_word text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_hash text;
  v_ok boolean;
begin
  if not public.is_member(p_circle) then raise exception 'forbidden' using errcode = '42501'; end if;
  if (select count(*) from public.audit_log a where a.actor_id = auth.uid() and a.action = 'safe_word.check'
        and a.created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;
  select s.word_hash into v_hash from public.safe_words s where s.circle_id = p_circle;
  if v_hash is null then raise exception 'safe_word_not_set' using errcode = 'P0002'; end if;
  v_ok := extensions.crypt(public.normalise_safe_word(coalesce(p_word, '')), v_hash) = v_hash;
  perform public.audit('safe_word.check', 'safe_word', p_circle::text, p_circle, jsonb_build_object('ok', v_ok));
  return v_ok;
end $$;

create or replace function public.safe_word_status(p_circle uuid)
returns table (is_set boolean, updated_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_member(p_circle) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query select s.circle_id is not null, s.updated_at
               from (select 1) one left join public.safe_words s on s.circle_id = p_circle;
end $$;

-- ---------------------------------------------------------------------------
-- Execute grants: helpers and RPCs are for signed-in users only.
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.is_member(uuid), public.is_guardian(uuid), public.shares_circle(uuid), public.is_guardian_of(uuid),
  public.is_admin(), public.is_org_admin(uuid), public.auth_age_seconds(), public.is_anonymous_user(),
  public.plan_max_members(public.plan_tier, public.member_role), public.normalise_safe_word(text),
  public.create_circle(text, text), public.create_invite(uuid, public.member_role, text, integer),
  public.accept_invite(text, text), public.record_consent(uuid),
  public.set_safe_word(uuid, text), public.check_safe_word(uuid, text), public.safe_word_status(uuid)
to authenticated;
